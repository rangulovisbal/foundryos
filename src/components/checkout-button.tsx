"use client";

import { useState } from "react";

import type { PlanId } from "@/lib/pricing";

export function CheckoutButton({
  planId,
  children
}: {
  planId: PlanId;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ planId })
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout is not available.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout is not available."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="w-full rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={handleCheckout}
        type="button"
      >
        {isLoading ? "Opening checkout..." : children}
      </button>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}
