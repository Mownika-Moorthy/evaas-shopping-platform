import Razorpay from 'razorpay';

/**
 * Razorpay SDK Singleton
 * Reads credentials from environment variables.
 * RAZORPAY_KEY_SECRET is NEVER sent to the frontend.
 */

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;
let isMockMode = false;

if (keyId && keySecret && !keyId.includes('mock')) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('✅ Razorpay SDK initialized (LIVE/TEST mode)');
  } catch (err) {
    console.error('❌ Razorpay SDK init failed, falling back to mock mode:', err.message);
    isMockMode = true;
  }
} else {
  isMockMode = true;
  console.log('⚠️  Razorpay running in MOCK mode (no real keys configured)');
}

export { razorpayInstance, keyId, keySecret, isMockMode };
