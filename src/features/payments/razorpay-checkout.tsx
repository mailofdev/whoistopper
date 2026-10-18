"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/config/site";

type RazorpayCheckoutInstance = {
  open: () => void;
  close: () => void;
};

function dismissRazorpay() {
  document.querySelectorAll(".razorpay-container").forEach((node) => node.remove());
  document.body.style.overflow = "";
}

export function RazorpayCheckout({
  keyId,
  orderId,
  amountPaise,
  name,
}: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  name: string;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  const [error, setError] = useState("");

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    let checkout: RazorpayCheckoutInstance | null = null;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (cancelled) return;
      const Razorpay = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckoutInstance }).Razorpay;
      if (!Razorpay) {
        setError("The payment window did not load.");
        return;
      }
      const returnUrl = new URL("/payments/razorpay/return", window.location.origin);
      checkout = new Razorpay({
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: site.name,
        description: name,
        order_id: orderId,
        // A full navigation replaces the page, so Razorpay's success frame cannot stay open.
        callback_url: returnUrl.toString(),
        redirect: true,
        handler() {
          checkout?.close();
          dismissRazorpay();
          routerRef.current.push("/?paid=1");
          routerRef.current.refresh();
        },
      });
      checkout.open();
    };
    script.onerror = () => setError("The payment window did not load.");
    document.body.appendChild(script);
    return () => {
      cancelled = true;
      checkout?.close();
      dismissRazorpay();
      script.remove();
    };
  }, [amountPaise, keyId, name, orderId]);

  return error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-secondary">The rank appears after the payment provider confirms it. Closing this window leaves the rank unchanged.</p>;
}
