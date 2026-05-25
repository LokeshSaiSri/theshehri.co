import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const { customer, items, subtotal, shipping, total } = await req.json();

    // 1. Generate unique order number (e.g. SHR-9A2F8B)
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `SHR-${randomPart}`;

    // 2. Upsert customer (phone is unique key)
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          name:          customer.name,
          phone:         customer.phone,
          email:         customer.email,
          address_line1: customer.address_line1,
          address_line2: customer.address_line2 || null,
          city:          customer.city,
          state:         customer.state,
          pincode:       customer.pincode,
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (customerError) throw customerError;

    // 3. Create pending order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number:  orderNumber,
        customer_id:   customerData.id,
        status:        'pending',
        payment_status: 'pending',
        subtotal,
        shipping,
        total,
        delivery_note: customer.delivery_note || null,
        // Mock Razorpay IDs — replace with real ones when Razorpay goes live
        razorpay_order_id: `mock_order_${Date.now()}`,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // 4. Insert order items
    const orderItems = items.map((item: {
      productId: string;
      productSlug: string;
      productName: string;
      size: string;
      color?: string;
      price: number;
    }) => ({
      order_id:     order.id,
      product_id:   item.productId,
      product_name: item.productName,
      size:         item.size,
      color:        item.color || null,
      price:        item.price,
      quantity:     1,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return NextResponse.json({ orderId: order.id, orderNumber });
  } catch (error) {
    console.error('[orders/create]', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
