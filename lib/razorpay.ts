import crypto from 'crypto';
import Razorpay from 'razorpay';

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) throw new Error('RAZORPAY_KEY_ID is not configured');
  return keyId;
}

export function getRazorpayKeySecret(): string {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error('RAZORPAY_KEY_SECRET is not configured');
  return keySecret;
}

/** Ensures server and client use the same Razorpay key pair before calling the API. */
export function assertRazorpayConfig(): void {
  const keyId = getRazorpayKeyId();
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (publicKeyId && publicKeyId !== keyId) {
    throw new Error(
      'RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must match. Update both in your environment settings.',
    );
  }

  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    throw new Error('RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_.');
  }
}

export function getRazorpayClient(): Razorpay {
  assertRazorpayConfig();
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  });
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(body)
    .digest('hex');
  return expected === razorpaySignature;
}
