import { useImportActions } from "../features/import/hooks/useImportActions";
import { ErrorBanner } from "../components/common/ErrorBanner";
import ImportSection from "../features/import/components/ImportSection";
import { Button } from "../components/common/Button";

function ImportPage() {
  const {
    loading,
    apiError,
    setApiError,
    oaFiles,
    iedSlots,
    handleLocalError,
    handleAddOaFiles,
    handleVerify,
    handleRemoveOaFile,
    handleBatchIedUpload,
    handleUpdateIedSlot,
    handleRemoveIedFile,
  } = useImportActions();

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        IMPORTAÇÃO DE ARQUIVOS
      </h1>

      <ErrorBanner error={apiError} onClose={() => setApiError(null)} />

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ImportSection
            title="Ordens de Ajuste (Excel)"
            fileType="OA"
            oaFiles={oaFiles}
            onAddFiles={handleAddOaFiles}
            onRemoveFile={handleRemoveOaFile}
            onError={handleLocalError}
          />
          <ImportSection
            title="Arquivos de Campo (IEDs)"
            fileType="IED"
            iedSlots={iedSlots}
            onUpdateSlot={handleUpdateIedSlot}
            onRemoveFile={handleRemoveIedFile}
            onAddFiles={handleBatchIedUpload}
            onError={handleLocalError}
          />
        </div>

        <div className="mt-10 flex justify-end">
          <Button
            onClick={handleVerify}
            isLoading={loading}
            disabled={!iedSlots.some((s) => s.file)}
          >
            VERIFICAR
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImportPage;
