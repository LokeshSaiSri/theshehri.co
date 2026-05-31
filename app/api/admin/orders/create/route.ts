import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getVariantAvailability, reserveOrderItems, releaseOrderItems } from '@/lib/inventory';
import { generateOrderNumber } from '@/lib/generate-order-number';
import { sendOrderEmails } from '@/lib/send-order-emails';
import { getShippingSettings } from '@/lib/shipping-settings';
import { calculateShipping, settingsToConfig } from '@/lib/shipping';

type ManualItem = {
  productId: string;
  productName: string;
  size: string;
  color?: string | null;
  price: number;
  quantity: number;
};

type FulfillmentOption =
  | 'stall_pickup'
  | 'instagram_speed_post'
  | 'instagram_collecting';

function resolveOrderStatus(
  fulfillment: FulfillmentOption,
  paymentStatus: 'paid' | 'pending'
): string {
  if (fulfillment === 'instagram_speed_post') return 'processing';
  if (paymentStatus === 'paid') return 'delivered';
  return 'pending';
}

function resolveFulfillmentType(fulfillment: FulfillmentOption): 'pickup' | 'delivery' {
  return fulfillment === 'instagram_speed_post' ? 'delivery' : 'pickup';
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await req.json();
    const {
      customer,
      items,
      paymentMethod,
      paymentStatus,
      amountReceived,
      fulfillment,
      shippingAddress,
      sourceNote,
    } = body as {
      customer: {
        name: string;
        phone: string;
        email?: string;
        city?: string;
        address?: string;
      };
      items: ManualItem[];
      paymentMethod: 'cash' | 'upi';
      paymentStatus: 'paid' | 'pending';
      amountReceived: number;
      fulfillment: FulfillmentOption;
      shippingAddress?: {
        name: string;
        address_line1: string;
        city: string;
        pincode: string;
        state?: string;
      };
      sourceNote?: string;
    };

    if (!customer?.name?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!customer?.phone?.trim() || !/^[6-9]\d{9}$/.test(customer.phone.trim())) {
      return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
    }
    if (!items?.length) {
      return NextResponse.json({ error: 'Add at least one item to the order' }, { status: 400 });
    }
    if (fulfillment === 'instagram_speed_post') {
      if (!shippingAddress?.address_line1?.trim() || !shippingAddress?.pincode?.trim()) {
        return NextResponse.json({ error: 'Shipping address and pincode are required for Speed Post' }, { status: 400 });
      }
    }

    for (const item of items) {
      const qty = item.quantity ?? 1;
      const { available, variant } = await getVariantAvailability(
        supabase,
        item.productId,
        item.size,
        item.color
      );
      if (!variant) {
        return NextResponse.json(
          { error: `${item.productName} (Size ${item.size}) not found` },
          { status: 404 }
        );
      }
      if (available < qty) {
        return NextResponse.json(
          {
            error:
              available === 0
                ? `${item.productName} (Size ${item.size}) is out of stock`
                : `${item.productName} (Size ${item.size}) — only ${available} available`,
          },
          { status: 409 }
        );
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 1), 0);
    const settings = await getShippingSettings();
    const shippingConfig = settingsToConfig(settings);

    let shipping = 0;
    if (fulfillment === 'instagram_speed_post') {
      shipping = calculateShipping(subtotal, shippingConfig);
    }

    const total = Math.max(0, Math.round(Number(amountReceived) || subtotal + shipping));
    const fulfillmentType = resolveFulfillmentType(fulfillment);
    const status = resolveOrderStatus(fulfillment, paymentStatus);
    const now = new Date().toISOString();

    const customerCity = customer.city?.trim() || 'Delhi';
    const customerAddress =
      fulfillment === 'instagram_speed_post' && shippingAddress
        ? {
            name: shippingAddress.name?.trim() || customer.name.trim(),
            address_line1: shippingAddress.address_line1.trim(),
            address_line2: null as string | null,
            city: shippingAddress.city?.trim() || customerCity,
            state: shippingAddress.state?.trim() || 'Delhi',
            pincode: shippingAddress.pincode.trim(),
          }
        : {
            name: customer.name.trim(),
            address_line1: customer.address?.trim() || customerCity,
            address_line2: null as string | null,
            city: customerCity,
            state: 'Delhi',
            pincode: '',
          };

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email?.trim() || null,
          address_line1: customerAddress.address_line1,
          address_line2: customerAddress.address_line2,
          city: customerAddress.city,
          state: customerAddress.state,
          pincode: customerAddress.pincode || null,
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (customerError) throw customerError;

    const orderNumber = await generateOrderNumber(supabase);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerData.id,
        status,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        source: 'manual',
        fulfillment_type: fulfillmentType,
        source_note: sourceNote?.trim() || null,
        subtotal,
        shipping,
        total,
        delivery_note: sourceNote?.trim() || null,
        delivered_at: status === 'delivered' ? now : null,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    const orderItemsPayload = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      size: item.size,
      color: item.color || null,
      price: item.price,
      quantity: item.quantity ?? 1,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    const inventoryItems = items.map((item) => ({
      product_id: item.productId,
      size: item.size,
      color: item.color,
      quantity: item.quantity ?? 1,
    }));

    const reserveResult = await reserveOrderItems(supabase, inventoryItems);
    if (!reserveResult.ok) {
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: reserveResult.message }, { status: 409 });
    }

    if (paymentStatus === 'paid') {
      await supabase.rpc('increment_customer_stats', {
        p_customer_id: customerData.id,
        p_total: total,
      });
      await supabase
        .from('customers')
        .update({ last_ordered_at: now })
        .eq('id', customerData.id);
    }

    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError || !fullOrder) {
      await releaseOrderItems(supabase, inventoryItems);
      return NextResponse.json({ error: 'Order created but could not be loaded' }, { status: 500 });
    }

    if (paymentStatus === 'paid' && customer.email?.trim()) {
      try {
        await sendOrderEmails(order.id, {
          order_number: fullOrder.order_number,
          subtotal: fullOrder.subtotal,
          shipping: fullOrder.shipping,
          total: fullOrder.total,
          delivery_note: fullOrder.delivery_note,
          customer: fullOrder.customer,
          items: fullOrder.items,
        });
      } catch (emailErr) {
        console.error('[admin/orders/create] Email error:', emailErr);
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
    });
  } catch (error) {
    console.error('[admin/orders/create]', error);
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
