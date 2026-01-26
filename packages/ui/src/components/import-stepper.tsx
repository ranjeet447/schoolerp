import * as React from "react"
import { cn } from "../lib/utils"
import { Check } from "lucide-react"

export interface Step {
  id: number
  title: string
  description?: string
}

interface ImportStepperProps {
  steps: Step[]
  currentStep: number
}

export function ImportStepper({ steps, currentStep }: ImportStepperProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary bg-background text-primary"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-xs font-semibold",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground hidden md:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-[2px] w-full -mt-10 transition-colors",
                  currentStep > steps[index].id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
