import { Database, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { inventoryService } from "../../services/api";
import Card from "./Card";
import { Button } from "./Button";
import DropzoneArea from "./DropzoneArea";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const result = await inventoryService.importExcel(file);
      setSuccessMessage(result.message || "Inventário atualizado com sucesso!");
      setFile(null);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-200">
      <Card>
        <div className="flex w-full max-w-lg flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-eq-primary mt-0.5">
                <Database size={24} />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-eq-primary text-lg font-semibold">
                  Importar Inventário de IEDs
                </h3>
                <p className="text-secondary whitespace-pre-wrap">
                  Selecione o arquivo Excel (.xlsx) da subestação para atualizar
                  o banco de dados local dos IEDs.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-text-muted hover:bg-bg-primary hover:text-eq-primary focus:ring-eq-secondary ml-4 shrink-0 cursor-pointer rounded-full p-1 transition-colors focus:ring-2 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>

          <div className="py-2">
            <DropzoneArea
              onFilesReceived={(files) => {
                setFile(files[0]);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              onClearFile={() => {
                setFile(null);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              currentFile={file}
              multiple={false}
              accept=".xlsx"
              maxSizeMB={10}
            />

            {errorMessage && (
              <div className="bg-error/10 text-error animate-in slide-in-from-top-1 mt-3 flex items-center gap-2 rounded-lg p-3 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-success/10 text-success animate-in slide-in-from-top-1 mt-3 flex items-center gap-2 rounded-lg p-3 text-sm">
                <CheckCircle2 size={16} className="shrink-0" />
                <p className="font-medium">{successMessage}</p>
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-3 p-1">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="px-6! py-2! shadow-none"
            >
              {successMessage ? "Sair" : "Cancelar"}
            </Button>

            {!successMessage && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                isLoading={isUploading}
                disabled={!file}
                className="px-6! py-2! shadow-none"
              >
                Confirmar Importação
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default InventoryModal;
