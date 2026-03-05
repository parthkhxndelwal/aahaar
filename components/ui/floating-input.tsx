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
              "block px-2.5 pb-2.5 pt-4 w-full text-sm bg-transparent rounded-lg border appearance-none dark:text-white focus:outline-none focus:ring-0 peer",
              "autofill:bg-transparent autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill]:bg-transparent [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill:hover]:bg-transparent [-webkit-autofill:hover]:text-white [-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill:focus]:bg-transparent [-webkit-autofill:focus]:text-white [-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_transparent]",
              "[-webkit-autofill:active]:bg-transparent [-webkit-autofill:active]:text-white [-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_transparent]",
              error
                ? "text-neutral-900 border-red-600 dark:border-red-500 dark:focus:border-red-500 focus:border-red-600"
                : "text-neutral-900 border-neutral-300 dark:border-neutral-600 dark:focus:border-white focus:border-white",
              className
            )}
            placeholder=" "
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2 bg-white dark:bg-neutral-950/80 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1",
              error
                ? "text-red-600 dark:text-red-500"
                : "text-neutral-500 dark:text-neutral-400 peer-focus:text-white peer-focus:dark:text-white"
            )}
          >
            {label}
          </label>
        </div>

        {error && (
          <p id={errorId} className="mt-2 text-xs text-red-600 dark:text-red-400">
            <span className="font-medium">Error:</span> {error}
          </p>
        )}
      </div>
    )
  }
)

FloatingInput.displayName = "FloatingInput"
