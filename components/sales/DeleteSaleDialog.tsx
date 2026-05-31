"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Trash2 } from "lucide-react";
import React from "react";

interface DeleteSaleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteReason: string;
  onDeleteReasonChange: (reason: string) => void;
  userRole?: string;
  onConfirm: (e: React.FormEvent) => Promise<void>;
}

export default function DeleteSaleDialog({
  isOpen,
  onOpenChange,
  deleteReason,
  onDeleteReasonChange,
  userRole,
  onConfirm,
}: DeleteSaleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5" />
            <span>Delete Sale</span>
          </DialogTitle>
          <DialogDescription>
            {userRole === "admin"
              ? "Confirm sale deletion"
              : "Submit sale deletion for admin approval"}
          </DialogDescription>
        </DialogHeader>
        {userRole !== "admin" && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your changes will be submitted for admin approval before being
              applied.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={onConfirm} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-reason">
              Reason for Deletion {userRole !== "admin" && "*"}
            </Label>
            <Textarea
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => onDeleteReasonChange(e.target.value)}
              placeholder="Explain why you're deleting this sale..."
              rows={3}
              required={userRole !== "admin"}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="neutralOutline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              {userRole === "admin" ? "Delete Sale" : "Submit Deletion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
