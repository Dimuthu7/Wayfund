"use client";

import { useId, useState } from "react";
import { formatMoney, parseAmount, toDecimalString, type CurrencyCode } from "@/lib/money";
import { cn } from "@/lib/utils";
import { inputClassName } from "./input";

/**
 * Money input. Shows the decimal keypad on phones, accepts "1,250.50" style input and
 * reports integer minor units through `onValueChange` (null when empty or invalid).
 * A hidden input with `name` posts the minor units in forms.
 */
export function AmountInput({
  currency,
  value,
  onValueChange,
  name,
  id,
  className,
  autoFocus,
  ...aria
}: {
  currency: CurrencyCode;
  value?: number | null;
  onValueChange?: (minor: number | null) => void;
  name?: string;
  id?: string;
  className?: string;
  autoFocus?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [text, setText] = useState(() =>
    value === null || value === undefined ? "" : toDecimalString(value, currency),
  );
  const minor = parseAmount(text, currency);
  const invalid = text.trim() !== "" && minor === null;

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">
        {currency}
      </span>
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        autoFocus={autoFocus}
        placeholder="0.00"
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          onValueChange?.(parseAmount(next, currency));
        }}
        onBlur={() => {
          if (minor !== null) setText(toDecimalString(minor, currency));
        }}
        aria-invalid={aria["aria-invalid"] ?? (invalid || undefined)}
        aria-describedby={aria["aria-describedby"]}
        aria-label={aria["aria-label"]}
        className={cn(inputClassName, "tabular pl-14 text-right text-lg font-semibold")}
      />
      {name ? <input type="hidden" name={name} value={minor ?? ""} /> : null}
      <span className="sr-only" aria-live="polite">
        {minor !== null ? formatMoney(minor, currency) : ""}
      </span>
    </div>
  );
}
