"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  className?: string
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, value, onChange, id, ...props }, ref) => {
    const inputId = id || `floating-input-${label.replace(/\s+/g, "-").toLowerCase()}`
    const errorId = `${inputId}-error`

    return (
      <div>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            value={value || ""}
            onChange={onChange}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "block px-2.5 pb-2.5 pt-4 w-full text-sm bg-transparent rounded-lg border appearance-none focus:outline-none focus:ring-0 peer",
              "autofill:bg-transparent autofill:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill]:bg-transparent [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill:hover]:bg-transparent [-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill:focus]:bg-transparent [-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill:active]:bg-transparent [-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_transparent]",
              error
                ? "border-destructive focus:border-destructive"
                : "border-border focus:border-foreground",
              className
            )}
            placeholder=" "
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2 bg-background peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1",
              error
                ? "text-destructive"
                : "text-muted-foreground peer-focus:text-foreground"
            )}
          >
            {label}
          </label>
        </div>

        {error && (
          <p id={errorId} className="mt-2 text-xs text-destructive">
            <span className="font-medium">Error:</span> {error}
          </p>
        )}
      </div>
    )
  }
)

FloatingInput.displayName = "FloatingInput"
