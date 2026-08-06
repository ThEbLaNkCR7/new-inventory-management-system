"use client"

import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface ProcessingOverlayProps {
  isLoading: boolean
  currentStep: string
  progress: number
  totalSteps: number
}

export default function ProcessingOverlay({
  isLoading,
  currentStep,
  progress,
  totalSteps,
}: ProcessingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <h3 className="form-section-title mb-0">Processing...</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{currentStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="text-xs text-muted-foreground text-center">
            Step {Math.ceil((progress / 100) * totalSteps)} of {totalSteps}
          </div>
        </div>
      </div>
    </div>
  )
}
