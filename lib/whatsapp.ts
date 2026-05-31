const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theshehri.co';

export function buildWhatsAppURL(
  phone: string,
  orderNumber: string,
  trackingNumber?: string | null
): string {
  const digits = phone.replace(/\D/g, '').replace(/^91/, '');
  const trackLine = trackingNumber
    ? `\n\nTrack here: ${SITE_URL}/track?order=${encodeURIComponent(orderNumber)}`
    : '';
  const indiaPostLine = trackingNumber
    ? `\nIndia Post: https://www.indiapost.gov.in/Track/Tnt/TrackConsignment.aspx?ConsignmentNo=${encodeURIComponent(trackingNumber)}`
    : '';

  const message = trackingNumber
    ? `Hey! Your Shehri Co. order ${orderNumber} has shipped. 🚚\n\nSpeed Post tracking: ${trackingNumber}${indiaPostLine}${trackLine}\n\nEstimated delivery: 2–4 business days.`
    : `Hey! Update on your Shehri Co. order ${orderNumber}.`;

  return `https://wa.me/91${digits}?text=${encodeURIComponent(message)}`;
}
