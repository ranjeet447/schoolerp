
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Key } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@schoolerp/ui"
import { toast } from "sonner"

interface ResetPasswordDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("")
  const [reason, setReason] = useState("")
  // const { toast } = useToast() // This line is commented out in the original, but the instruction implies its removal.

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient(`/platform/users/${userId}/reset-password`, {
        method: "POST", // Using POST for action-like idempotent or non-idempotent updates often safer/clearer than PATCH for specific actions
        body: JSON.stringify({
          new_password: newPassword,
          reason: reason || "Admin manual reset",
        }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      return await res.json()
    },
    onSuccess: () => {
      toast.success("Password Reset Successful", {
        description: `Password for ${userName} has been updated.`,
      })
      onOpenChange(false)
      setNewPassword("")
      // The instruction included setConfirmPassword(""), but confirmPassword state is not defined.
      // Assuming this was a placeholder or intended for a future change not fully provided.
      // For now, it's omitted to avoid a runtime error.
      // setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error("Failed to reset password", {
        description: err.message || "An unknown error occurred.", // Adjusted to use `err.message` as `e.response?.data` is not guaranteed from `await res.text()`
      })
    },
  })

  // Basic validation
  // In a real app, you might want stronger password policies enforced on client side too.
  const isValid = newPassword.length >= 8

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter a new password for <span className="font-medium">{userName}</span>. This will invalidate existing sessions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. User forgot password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={!isValid || mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
