"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@schoolerp/ui";

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: "Confirm Action",
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "default",
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(DEFAULT_STATE);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const close = (value: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    resolver?.(value);
    setResolver(null);
  };

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
      setState({
        open: true,
        title: options.title || "Confirm Action",
        description: options.description,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        tone: options.tone || "default",
      });
    });

  const dialog = (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) close(false);
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          <DialogDescription>{state.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {state.cancelText}
          </Button>
          <Button
            variant={state.tone === "danger" ? "destructive" : "default"}
            onClick={() => close(true)}
          >
            {state.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, confirmDialog: dialog };
}
