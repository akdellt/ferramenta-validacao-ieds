import { useRef, useState } from "react";
import { Upload, Info } from "lucide-react";

interface DropzoneAreaProps {
  onFilesReceived: (files: File[]) => void;
  onError?: (message: string, title?: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

function DropzoneArea({
  onFilesReceived,
  onError,
  accept,
  maxSizeMB = 5,
}: DropzoneAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const formatExtensions = (acceptString?: string) => {
    if (!acceptString) return null;

    return acceptString
      .split(",")
      .map((ext) => ext.trim().replace(".", "").toUpperCase())
      .join(", ");
  };

  const validateAndUpload = (fileList: File[]) => {
    const invalidFiles: { name: string; reason: string }[] = [];

    const validFiles = fileList.filter((file) => {
      const sizeInMB = file.size / (1024 * 1024);

      if (sizeInMB > maxSizeMB) {
        invalidFiles.push({
          name: file.name,
          reason: `Tamanho: ${sizeInMB.toFixed(2)}MB (máx. ${maxSizeMB}MB)`,
        });
        return false;
      }

      if (accept) {
        const allowedExtensions = accept
          .split(",")
          .map((ext) => ext.trim().toLowerCase());
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

        if (!allowedExtensions.includes(fileExtension)) {
          invalidFiles.push({
            name: file.name,
            reason: `Tipo não permitido (aceita: ${formatExtensions(accept)})`,
          });
          return false;
        }
      }

      return true;
    });

    if (invalidFiles.length > 0) {
      if (onError) {
        const msg = invalidFiles
          .map((f) => `${f.name}: ${f.reason}`)
          .join("; ");
        onError(
          `Alguns arquivos foram rejeitados: ${msg}`,
          "Erro de Validação Local",
        );
      }
    }

    if (validFiles.length > 0) {
      onFilesReceived(validFiles);
    }
  };

  const extensionsText = formatExtensions(accept);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex min-h-50 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? "border-eq-secondary bg-blue-50"
          : "border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={accept}
        onChange={handleFileInput}
      />

      <div className="text-secondary">
        <Upload size={48} strokeWidth={1.5} />
      </div>

      <div className="text-center">
        <p className="text-secondary text-sm">
          <span className="text-secondary font-medium">
            Arraste ou clique para escolher arquivos
          </span>
        </p>
      </div>

      <div className="text-secondary/60 flex items-center gap-1.5 text-xs">
        <Info size={14} />
        <span>
          Aceitos: {extensionsText} (Máx: {maxSizeMB}MB)
        </span>
      </div>
    </div>
  );
}

export default DropzoneArea;
