import { FileText } from "lucide-react";
import DeleteButton from "../../../components/common/DeleteButton";
import FileInfo from "../../../components/common/FileInfo";

interface FileItemProps {
  file: File;
  onDelete: () => void;
}

function FileItem({ file, onDelete }: FileItemProps) {
  const sizeKB = file.size;
  const extension = file.name.split(".").pop()?.toLowerCase() || "file";

  const filename_oa = file.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="border-eq-border mb-3 flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all last:mb-0 hover:shadow-md">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="text-eq-secondary">
          <FileText size={24} strokeWidth={1.5} />
        </div>

        <FileInfo
          fileName={filename_oa}
          extension={extension}
          sizeBytes={sizeKB}
          layout="column"
        />
      </div>

      <DeleteButton onClick={onDelete} size="lg" variant="icon" />
    </div>
  );
}

export default FileItem;
