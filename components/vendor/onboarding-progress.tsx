"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface OnboardingProgressProps {
  currentStep: string
  steps: string[]
}

export function OnboardingProgress({ currentStep, steps }: OnboardingProgressProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(steps.length).fill(false))

  useEffect(() => {
    const stepIndex = steps.findIndex(step => step === currentStep)
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex)
      
      // Mark previous steps as completed
      const newCompletedSteps = [...completedSteps]
      for (let i = 0; i < stepIndex; i++) {
        newCompletedSteps[i] = true
      }
      setCompletedSteps(newCompletedSteps)
    }
  }, [currentStep, steps])

  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-muted border-border">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <Image
                src="/Spinner_dark_275x275.svg"
                alt="Loading"
                width={80}
                height={80}
                className="animate-spin"
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Setting Up Your Vendor Account</h2>
            <p className="text-muted-foreground">Please wait while we configure your account...</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-foreground h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = completedSteps[index]
              const isCurrent = index === currentStepIndex
              const isPending = index > currentStepIndex

              return (
                <div
                  key={index}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${{
                    completed: "bg-muted border",
                    current: "bg-muted border",
                    pending: "bg-muted border border-border"
                  }[isCompleted ? "completed" : isCurrent ? "current" : "pending"]}`}
                >
                  {/* Step Icon */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${{
                      completed: "bg-foreground",
                      current: "bg-foreground",
                      pending: "bg-muted-foreground/30"
                    }[isCompleted ? "completed" : isCurrent ? "current" : "pending"]}`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      <div className="w-2 h-2 bg-background rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full" />
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${{
                        completed: "text-foreground",
                        current: "text-foreground",
                        pending: "text-muted-foreground"
                      }[isCompleted ? "completed" : isCurrent ? "current" : "pending"]}`}
                    >
                      {step}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  {isCurrent && !isLastStep && (
                    <div className="flex-shrink-0">
                      <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Current Step Indicator */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-foreground font-medium text-center">
              {isLastStep ? (
                <span className="text-foreground flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {currentStep}
                </span>
              ) : (
                currentStep
              )}
            </p>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              This process may take a few moments. Please do not close this window.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
