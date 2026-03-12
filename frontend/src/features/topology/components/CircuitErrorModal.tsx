import { X } from "lucide-react";
import Card from "../../../components/common/Card";
import type { ErrorDetail, ErrorCategory } from "../types";

interface CircuitErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  IedName: string | null;
  errors: ErrorDetail[];
}

const categoryStyles: Record<ErrorCategory, string> = {
  Formulário: "bg-eq-secondary",
  Comunicação: "bg-[#3883da]",
  Lógica: "bg-primary",
};

export const CircuitErrorModal = ({
  isOpen,
  onClose,
  IedName,
  errors,
}: CircuitErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card
        title={`ERROS: ${IedName}`}
        className="border-t-error relative max-h-[90vh] w-full max-w-2xl border-t-4 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="text-text-muted hover:text-error absolute top-6 right-6 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
          {errors.length === 0 ? (
            <p className="text-text-muted py-8 text-center text-sm">
              Nenhum erro encontrado.
            </p>
          ) : (
            errors.map((err, idx) => (
              <div
                key={idx}
                className="border-eq-border hover:border-error/30 rounded-lg border bg-white p-4 shadow-sm transition-colors"
              >
                <div className="mb-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-black tracking-widest text-white uppercase ${categoryStyles[err.category as ErrorCategory] || "bg-eq-primary"}`}
                  >
                    {err.category}
                  </span>
                </div>

                <p className="text-primary mb-4 text-sm leading-snug font-semibold">
                  {err.message}
                </p>

                {(err.expected || err.found) && (
                  <div className="border-eq-border flex overflow-hidden rounded border">
                    <div className="border-eq-border flex-1 border-r bg-green-50/30 p-3">
                      <span className="mb-1 block text-xs font-bold tracking-tighter text-green-700/60 uppercase">
                        Esperado
                      </span>
                      <code className="font-mono text-sm font-bold break-all text-green-700">
                        {err.expected || "N/A"}
                      </code>
                    </div>
                    <div className="bg-error/5 flex-1 p-3">
                      <span className="text-error/60 mb-1 block text-xs font-bold tracking-tighter uppercase">
                        Encontrado
                      </span>
                      <code className="text-error font-mono text-sm font-bold break-all italic">
                        {err.found || "N/A"}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
