/**
 * Payment provider abstraction.
 * Swap `demoProvider` for a real Razorpay/Cashfree implementation
 * without changing checkout UI code.
 */

export type PaymentResult = {
  success: boolean;
  provider: string;
  providerPaymentId: string;
  message?: string;
};

export type PaymentProvider = {
  name: string;
  /**
   * Initiate a payment for the given amount (INR, paise/rupees depending on provider).
   * For demo we simply return a mock success result.
   */
  processPayment: (amount: number, currency: string) => Promise<PaymentResult>;
};

export const demoProvider: PaymentProvider = {
  name: "demo",
  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    // Simulate network delay + gateway round-trip.
    await new Promise((r) => setTimeout(r, 800));
    const id = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      success: true,
      provider: "demo",
      providerPaymentId: id,
      message: `Demo payment of ${currency} ${amount} succeeded. Replace demoProvider with Razorpay when ready.`,
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // In the future: read VITE_PAYMENT_PROVIDER env var or config here.
  return demoProvider;
}
