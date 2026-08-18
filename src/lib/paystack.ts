export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

declare global {
  interface Window {
    PaystackPop?: {
      setup: (setupConfig: any) => { openIframe: () => void } | undefined;
    };
  }
}

interface PaystackConfig {
  email: string;
  amount: number; // Amount in kobo (if NGN)
  currency?: string; // Default: 'NGN'
  reference: string;
  channels?: string[]; // omit to show all Paystack-enabled methods
  metadata?: Record<string, any>;
  onSuccess: (response: any) => void;
  onClose: () => void;
  onError?: (err: Error) => void;
}

const PAYSTACK_INLINE_SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";

/** All NGN methods Paystack supports. Dashboard must also have them enabled. */
export const PAYSTACK_NGN_CHANNELS = [
  "card",
  "bank",
  "ussd",
  "qr",
  "mobile_money",
  "bank_transfer",
] as const;

let paystackScriptPromise: Promise<void> | null = null;

const ensurePaystackInlineScript = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  if (window.PaystackPop) return;

  // Load script once.
  if (!paystackScriptPromise) {
    paystackScriptPromise = new Promise<void>((resolve, reject) => {
      // If script tag already exists, wait for it.
      const existing = document.querySelector(`script[src="${PAYSTACK_INLINE_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
      if (existing) {
        if (window.PaystackPop) return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Paystack inline.js")));
        return;
      }

      const script = document.createElement("script");
      script.src = PAYSTACK_INLINE_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Paystack inline.js"));
      document.head.appendChild(script);
    });
  }

  await paystackScriptPromise;
};

export const initializePaystackPayment = async (config: PaystackConfig) => {
  if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.trim().length < 5) {
    config.onError?.(
      new Error(
        "Paystack is not configured. Set `VITE_PAYSTACK_PUBLIC_KEY` in your .env."
      )
    );
    return;
  }

  try {
    await ensurePaystackInlineScript();

    const handler = window.PaystackPop?.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount,
      currency: config.currency || "NGN",
      ref: config.reference,
      channels: config.channels,
      metadata: config.metadata,
      callback: function (response: any) {
        config.onSuccess(response);
      },
      onClose: function () {
        config.onClose();
      },
    });

    if (!handler) {
      config.onError?.(new Error("Paystack inline handler not available."));
      return;
    }

    handler.openIframe();
  } catch (err: any) {
    config.onError?.(err instanceof Error ? err : new Error("Paystack initialization failed."));
  }
};
