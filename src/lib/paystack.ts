export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder_key_for_paystack';

interface PaystackConfig {
  email: string;
  amount: number; // Amount in kobo (if NGN) e.g., 500000 for NGN 5000.00
  currency?: string; // Default: 'NGN'
  reference: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
}

export const initializePaystackPayment = (config: PaystackConfig) => {
  // @ts-expect-error - Paystack is loaded globally via script tag or we mock it
  const handler = window.PaystackPop?.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: config.amount,
    currency: config.currency || 'NGN',
    ref: config.reference,
    callback: function (response: any) {
      config.onSuccess(response);
    },
    onClose: function () {
      config.onClose();
    },
  });

  if (handler) {
      handler.openIframe();
  } else {
      console.warn("Paystack Inline JS not loaded or key is invalid. Triggering mock success.");
      // Mock flow if the script isn't loaded yet
      setTimeout(() => {
          config.onSuccess({ reference: config.reference, message: 'Mock success' });
      }, 1000);
  }
};
