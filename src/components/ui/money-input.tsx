"use client";

import * as React from "react";
import { cn } from "@/core/utils/cn";
import { formatMoneyGroupedSpaces, parseMoneyDigits } from "@/core/utils/format-money";

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * Ô nhập tiền VNĐ: hiển thị nhóm 1 000 000 (dấu cách), chỉ nhập số.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onValueChange, onFocus, onBlur, disabled, placeholder = "0", ...props }, ref) => {
    const display = value <= 0 ? "" : formatMoneyGroupedSpaces(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(parseMoneyDigits(e.target.value));
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border/70 bg-surface/80 px-3 text-sm text-text shadow-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className
        )}
        value={display}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
    );
  }
);
MoneyInput.displayName = "MoneyInput";
