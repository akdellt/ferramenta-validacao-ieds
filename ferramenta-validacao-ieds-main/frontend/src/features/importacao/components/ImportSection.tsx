import Card from "../../../components/common/Card";
import DropzoneArea from "./DropzoneArea";
import FileItem from "./FileItem";
import FileSlot from "./FileSlot";
import { FILE_CONFIG } from "../../../config/fileUpload";

interface ImportSectionProps {
  title: string;
  tipoArquivo: "OA" | "IED";

  arquivosOA?: File[];
  slotsIED?: IedSlotData[];

  onAddFiles?: (files: File[]) => void;
  onRemoveFile?: (id: number | string) => void;
  onUpdateSlot?: (id: string, file: File) => void;
  onError?: (msg: string, title?: string) => void;
}

export interface IedSlotData {
  id: string;
  nome: string;
  arquivo: File | null;
  nomeArquivo: string;
  subestacao: string;
}

function ImportSection({
  title,
  tipoArquivo,
  arquivosOA = [],
  slotsIED = [],
  onAddFiles,
  onRemoveFile,
  onUpdateSlot,
  onError,
}: ImportSectionProps) {
  const config = FILE_CONFIG[tipoArquivo];

  const handleDropzoneReceive = (arquivos: File[]) => {
    if (onAddFiles) {
      onAddFiles(arquivos);
    }
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

      {tipoArquivo === "IED" ? (
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

      {tipoArquivo === "OA" ? (
        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {arquivosOA.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Nenhum arquivo importado
            </p>
          ) : (
            arquivosOA.map((file, index) => (
              <FileItem
                key={`arquivo-oa-${index}`}
                arquivo={file}
                onDelete={() => onRemoveFile && onRemoveFile(index)}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 flex shrink-0 justify-center">
            <button
              className="border-eq-secondary text-eq-secondary hover:bg-eq-secondary rounded-md border-2 px-6 py-2 text-sm font-medium transition-colors hover:text-white"
              title="Funcionalidade em desenvolvimento"
            >
              BUSCAR NA REDE
            </button>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {slotsIED.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  Nenhum IED encontrado
                </p>
              ) : (
                slotsIED.map((slot) => (
                  <FileSlot
                    key={slot.id}
                    iedNome={slot.nome}
                    arquivo={slot.arquivo}
                    onFileSelect={(f) =>
                      onUpdateSlot && onUpdateSlot(slot.id, f)
                    }
                    onRemove={() => onRemoveFile && onRemoveFile(slot.id)}
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
