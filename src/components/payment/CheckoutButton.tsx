import React, { useState } from 'react';
import { initializePaystackPayment, PAYSTACK_NGN_CHANNELS } from '../../lib/paystack';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  email: string;
  amount: number;
  label?: string;
  onSuccess?: (reference: string) => void;
  className?: string;
}

export function CheckoutButton({ email, amount, label = "Pay Now", onSuccess, className }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    initializePaystackPayment({
      email,
      amount,
      reference: `ref_${Math.floor(Math.random() * 1000000000 + 1)}`,
      channels: [...PAYSTACK_NGN_CHANNELS],
      onSuccess: (response) => {
        setIsProcessing(false);
        if (onSuccess) {
          onSuccess(response.reference);
        }
      },
      onClose: () => {
        setIsProcessing(false);
        console.log("Payment window closed");
      },
      onError: (err) => {
        setIsProcessing(false);
        toast.error(err.message);
      },
    });
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? "Processing..." : label}
    </Button>
  );
}
