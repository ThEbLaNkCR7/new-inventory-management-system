"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ProductApprovalDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  approvalReason: string
  onApprovalReasonChange: (reason: string) => void
  onSubmit: () => void
}

export default function ProductApprovalDialog({
  isOpen,
  onOpenChange,
  approvalReason,
  onApprovalReasonChange,
  onSubmit,
}: ProductApprovalDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for Approval</DialogTitle>
          <DialogDescription>Please provide a reason for this product request</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Request</Label>
            <Textarea
              id="reason"
              value={approvalReason}
              onChange={(e) => onApprovalReasonChange(e.target.value)}
              placeholder="Explain why this change should be made..."
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="neutralOutline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!approvalReason.trim()}>
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
