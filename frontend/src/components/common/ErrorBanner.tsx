import { AlertCircle, X, FileWarning } from "lucide-react";
import { useEffect } from "react";
import { type BackendError } from "../../types/error";
import Card from "./Card";

interface ErrorBannerProps {
  error: BackendError | null;
  onClose: () => void;
}

export function ErrorBanner({ error, onClose }: ErrorBannerProps) {
  if (!error) return null;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-200">
      <Card>
        <div className="flex items-start justify-between p-1">
          <div className="flex items-start gap-3">
            <div className="text-error mt-0.5">
              <AlertCircle size={24} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-error text-lg font-semibold">
                {error.details || "Erro no Processamento"}
              </h3>
              <p className="text-secondary whitespace-pre-wrap">
                {error.message}
              </p>

              {error.filename && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <FileWarning size={16} className="text-secondary" />
                  <span className="text-primary rounded border border-red-400 bg-white px-2 py-0.5 font-mono">
                    {error.filename}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-muted hover:bg-bg-primary hover:text-primary focus:ring-eq-secondary ml-4 shrink-0 cursor-pointer rounded-md p-1 transition-colors focus:ring-2 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
      </Card>
    </div>
  );
}
