import { FileText } from "lucide-react";
import DeleteButton from "../../../components/common/DeleteButton";
import FileInfo from "../../../components/common/FileInfo";

interface FileItemProps {
  arquivo: File;
  onDelete: () => void;
}

function FileItem({ arquivo, onDelete }: FileItemProps) {
  const tamanhoKB = (arquivo.size / 1024).toFixed(1);
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "file";

  const nomeArquivo = arquivo.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="border-eq-border mb-3 flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all last:mb-0 hover:shadow-md">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="text-eq-secondary">
          <FileText size={24} strokeWidth={1.5} />
        </div>

        <FileInfo
          fileName={nomeArquivo}
          extension={extensao}
          sizeKB={tamanhoKB}
          layout="column"
        />
      </div>

      <DeleteButton onClick={onDelete} size="lg" variant="icon" />
    </div>
  );
}

export default FileItem;
