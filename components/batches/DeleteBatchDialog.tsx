"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Batch } from "@/contexts/BatchContext"
import { Trash2 } from "lucide-react"

interface DeleteBatchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  batch: Batch | null
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteBatchDialog({
  isOpen,
  onOpenChange,
  batch,
  onConfirm,
  onCancel,
}: DeleteBatchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5" />
            <span>Delete Batch</span>
          </DialogTitle>
          <DialogDescription>
            Confirm batch deletion. Product stock added by this batch will be reversed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete batch{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{batch?.batchNumber}</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <Button type="button" variant="neutralOutline" onClick={onCancel} className="px-6">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirm} className="px-6">
              Delete Batch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
