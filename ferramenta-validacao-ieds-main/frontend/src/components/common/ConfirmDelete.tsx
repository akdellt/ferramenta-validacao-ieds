import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import Card from "./Card";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

function ConfirmDelete({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-200">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-error mt-0.5">
                <AlertTriangle size={24} />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-error text-lg font-semibold">{title}</h3>
                <p className="text-secondary whitespace-pre-wrap">{message}</p>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="text-text-muted hover:bg-bg-primary hover:text-primary focus:ring-eq-secondary ml-4 shrink-0 cursor-pointer rounded-md p-1 transition-colors focus:ring-2 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-2 flex justify-end gap-3 p-1">
            <button
              onClick={onCancel}
              className="focus:ring-eq-secondary cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="bg-error focus:ring-error cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ConfirmDelete;
