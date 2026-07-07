"use client";

import { useEffect, useRef, useState } from "react";

import { Check, Copy } from "lucide-react";

export function CopyTextButton({
  text,
  label,
  copiedLabel
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions or insecure context); keep the button usable.
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-[18px] border border-[color:var(--border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-sand/60"
      onClick={handleCopy}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
