"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface FloatingSelectProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  error?: string
  className?: string
}

export const FloatingSelect = ({ 
  label, 
  value, 
  onValueChange, 
  options, 
  error, 
  className 
}: FloatingSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const hasValue = Boolean(value)
  const selectedOption = options.find(option => option.value === value)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "block px-2.5 pb-2.5 pt-4 w-full text-sm bg-transparent rounded-lg border appearance-none focus:outline-none focus:ring-0 peer text-left flex items-center justify-between",
          error 
            ? "border-destructive focus:border-destructive" 
            : "border-border focus:border-foreground",
          className
        )}
      >
        <span className={cn(!hasValue && "text-transparent")}>
          {selectedOption?.label || ""}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200 ml-2",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      <label
        className={cn(
          "absolute text-sm duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2 start-1",
          hasValue || isOpen ? "-translate-y-4 scale-75 top-2" : "scale-100 -translate-y-1/2 top-1/2",
          error 
            ? "text-destructive bg-background" 
            : "text-muted-foreground bg-background peer-focus:text-foreground"
        )}
      >
        {label}
      </label>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-muted transition-colors duration-150 first:rounded-t-md last:rounded-b-md",
                value === option.value && "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {error && (
          <p className="mt-2 text-xs text-destructive">
          <span className="font-medium">Oh, snapp!</span> {error}
        </p>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  )
}
