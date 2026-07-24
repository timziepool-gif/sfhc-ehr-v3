import { useEffect, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} aria-hidden />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-scale-in">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 rounded-xl p-2.5 ${destructive ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button className="btn-secondary btn-sm" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={destructive ? "btn-danger btn-sm" : "btn-primary btn-sm"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog(): { node: ReactNode; confirm: (opts: Omit<ConfirmDialogProps, "open" | "onCancel">) => Promise<boolean> } {
  // Helper hook kept simple — callers usually manage their own state. Re-export type only.
  throw new Error("useConfirmDialog is a placeholder — manage ConfirmDialog state inline.");
}
