import { Paperclip, FileText } from "lucide-react";
import { useRef } from "react";
import DeleteButton from "../../../components/common/DeleteButton";
import FileInfo from "../../../components/common/FileInfo";
import { FILE_CONFIG } from "../../../config/fileUpload";

interface FileSlotProps {
  relay_model: string;
  file?: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function FileSlot({
  relay_model,
  file,
  onFileSelect,
  onRemove,
}: FileSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeKB = file ? (file.size / 1024).toFixed(0) : "0";
  const extension = file?.name.split(".").pop()?.toLowerCase() || "file";
  const filename_ied = file?.name.replace(/\.[^/.]+$/, "") || "";

  const handleClick = () => {
    if (!file) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className="border-eq-border mb-3 flex h-14 w-full overflow-hidden rounded-md border shadow-sm transition-shadow hover:shadow-md">
      <div className="border-eq-border flex w-36 shrink-0 items-center border-r bg-white px-4">
        <span
          className="text-primary text-sm font-semibold"
          title={relay_model}
        >
          {relay_model}
        </span>
      </div>
      <div
        onClick={handleClick}
        className={`flex flex-1 items-center justify-between px-4 transition-colors ${
          file
            ? "cursor-default bg-white"
            : "bg-eq-border hover:bg-eq-border/60 cursor-pointer"
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={FILE_CONFIG.IED.accept}
          onChange={handleFileChange}
        />
        {file ? (
          <>
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText
                size={20}
                className="text-eq-secondary shrink-0"
                strokeWidth={1.5}
              />

              <FileInfo
                fileName={filename_ied}
                extension={extension}
                sizeKB={sizeKB}
                layout="row"
              />
            </div>

            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              size="md"
              variant="outlined"
            />
          </>
        ) : (
          <>
            <span className="text-secondary text-sm font-medium">
              Nenhum arquivo vinculado
            </span>

            <Paperclip
              size={20}
              className="text-eq-secondary shrink-0"
              strokeWidth={2}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default FileSlot;
