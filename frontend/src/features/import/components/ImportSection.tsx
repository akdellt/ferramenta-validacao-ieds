import Card from "../../../components/common/Card";
import DropzoneArea from "../../../components/common/DropzoneArea";
import FileItem from "./FileItem";
import FileSlot from "./FileSlot";
import { FILE_CONFIG, type FileType } from "../../../config/fileUpload";
import type { IedSlotData } from "../../../types/parameters";
import { Button } from "../../../components/common/Button";

interface ImportSectionProps {
  title: string;
  fileType: FileType;

  oaFiles?: File[];
  iedSlots?: IedSlotData[];

  onAddFiles?: (files: File[]) => void;
  onRemoveFile?: (id: number | string) => void;
  onUpdateSlot?: (id: string, file: File | string) => void;
  onError?: (msg: string, title?: string) => void;
}

function ImportSection({
  title,
  fileType,
  oaFiles = [],
  iedSlots = [],
  onAddFiles,
  onRemoveFile,
  onUpdateSlot,
  onError,
}: ImportSectionProps) {
  const config = FILE_CONFIG[fileType];

  const handleDropzoneReceive = (files: File[]) => {
    if (onAddFiles) {
      onAddFiles(files);
    }
  };

  const handleFetchAllFromNetwork = () => {
    const idsParaBuscar = iedSlots
      .filter((s) => s.iedId && !s.file)
      .map((s) => s.id);

    if (idsParaBuscar.length === 0) {
      onError?.("Nenhum equipamento disponível para busca.");
      return;
    }

    onUpdateSlot?.("BATCH_SEARCH", idsParaBuscar as any);
  };

  return (
    <Card title={title} className="flex h-157 w-full flex-col overflow-hidden">
      <div className="shrink-0">
        <DropzoneArea
          onFilesReceived={handleDropzoneReceive}
          accept={config.accept}
          maxSizeMB={config.maxSizeMB}
          onError={onError}
        />
      </div>

      {fileType === "IED" ? (
        <div className="my-6 flex shrink-0 items-center gap-4">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-secondary shrink-0 text-xs">
            OU procurar equipamentos na rede
          </span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
      ) : (
        <div className="my-6 shrink-0">
          <div className="h-px bg-gray-200"></div>
        </div>
      )}

      <h4 className="text-primary mb-4 shrink-0 text-center text-base font-semibold">
        Arquivos importados
      </h4>

      {fileType === "OA" ? (
        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {oaFiles.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              {config.emptyMessage}
            </p>
          ) : (
            oaFiles.map((file, index) => (
              <FileItem
                key={`oa-file-${index}`}
                file={file}
                onDelete={() => onRemoveFile?.(index)}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 flex shrink-0 justify-center">
            <Button
              variant="outline"
              onClick={handleFetchAllFromNetwork}
              disabled={iedSlots.every((s) => !s.iedId)}
              className="px-6 py-2 shadow-none"
            >
              BUSCAR NA REDE
            </Button>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {iedSlots.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Nenhum IED encontrado
                </p>
              ) : (
                iedSlots.map((slot) => (
                  <FileSlot
                    key={slot.id}
                    relay_model={slot.relay_model}
                    file={slot.file}
                    onFileSelect={(f) => onUpdateSlot?.(slot.id, f)}
                    onRemove={() => onRemoveFile?.(slot.id)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default ImportSection;
