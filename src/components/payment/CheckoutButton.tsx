import React, { useState } from 'react';
import { initializePaystackPayment } from '../../lib/paystack';
import { Button } from '../ui/button';

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
      onSuccess: (response) => {
        setIsProcessing(false);
        if (onSuccess) {
          onSuccess(response.reference);
        }
      },
      onClose: () => {
        setIsProcessing(false);
        console.log("Payment window closed");
      }
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
