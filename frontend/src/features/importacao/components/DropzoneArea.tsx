import { useRef, useState } from "react";
import { Upload, Info } from "lucide-react";

interface DropzoneAreaProps {
  onFilesReceived: (files: File[]) => void;
  onError?: (mensagem: string, titulo?: string) => void;
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
      validarEEnviar(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validarEEnviar(Array.from(e.target.files));
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

  const validarEEnviar = (listaArquivos: File[]) => {
    const arquivosInvalidos: { nome: string; motivo: string }[] = [];

    const arquivosValidos = listaArquivos.filter((file) => {
      const sizeInMB = file.size / (1024 * 1024);

      if (sizeInMB > maxSizeMB) {
        arquivosInvalidos.push({
          nome: file.name,
          motivo: `Tamanho: ${sizeInMB.toFixed(2)}MB (máx. ${maxSizeMB}MB)`,
        });
        return false;
      }

      if (accept) {
        const extensoesPermitidas = accept
          .split(",")
          .map((ext) => ext.trim().toLowerCase());
        const extensaoArquivo = `.${file.name.split(".").pop()?.toLowerCase()}`;

        if (!extensoesPermitidas.includes(extensaoArquivo)) {
          arquivosInvalidos.push({
            nome: file.name,
            motivo: `Tipo não permitido (aceita: ${formatExtensions(accept)})`,
          });
          return false;
        }
      }

      return true;
    });

    if (arquivosInvalidos.length > 0) {
      if (onError) {
        const msg = arquivosInvalidos
          .map((a) => `${a.nome}: ${a.motivo}`)
          .join("; ");
        onError(
          `Alguns arquivos foram rejeitados: ${msg}`,
          "Erro de Validação Local",
        );
      }
    }

    if (arquivosValidos.length > 0) {
      onFilesReceived(arquivosValidos);
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
          Arquivo: {extensionsText} e tamanho máximo: {maxSizeMB}MB
        </span>
      </div>
    </div>
  );
}

export default DropzoneArea;
