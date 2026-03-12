import { Plus } from "lucide-react";

import { useValidation } from "../context/ValidationContext";
import { ErrorBanner } from "../components/common/ErrorBanner";

import { useTopologySubmission } from "../features/topology/hooks/useTopologySubmission";
import { TransformerCard } from "../features/topology/components/TransformerCard";
import { TopologyTypeSelector } from "../features/topology/components/TopologyTypeSelector";
import DropzoneArea from "../components/common/DropzoneArea";
import { FILE_CONFIG } from "../config/fileUpload";
import useTopologyActions from "../features/topology/hooks/useTopologyActions";
import Card from "../components/common/Card";
import { Button } from "../components/common/Button";

function TopologyPage() {
  const {
    transformers,
    addTransformer,
    removeTransformer,
    updateTransformerName,
    addFeeder,
    updateFeeder,
    removeFeeder,
  } = useTopologyActions();

  const { topologyType, setTopologyType, scdFile, setScdFile } =
    useValidation();

  const { submit, isLoading, apiError, setApiError } = useTopologySubmission();

  const handleLocalError = (
    msg: string,
    title: string = "Erro de Validação",
  ) => {
    setApiError({
      error: "ValidationError",
      message: msg,
      details: title,
    });
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide uppercase">
        Configuração de Topologia
      </h1>

      <ErrorBanner error={apiError} onClose={() => setApiError(null)} />

      <div className="mx-auto w-full max-w-5xl space-y-8">
        <Card className="shadow-md">
          <TopologyTypeSelector
            value={topologyType}
            onChange={setTopologyType}
          />
        </Card>

        {transformers.map((transf, index) => (
          <TransformerCard
            key={transf.id}
            index={index}
            transformer={transf}
            isRemovable={transformers.length > 1}
            onRemove={removeTransformer}
            onUpdateName={updateTransformerName}
            onAddFeeder={addFeeder}
            onUpdateFeeder={updateFeeder}
            onRemoveFeeder={removeFeeder}
          />
        ))}

        <button
          onClick={addTransformer}
          className="hover:border-eq-primary hover:text-eq-primary border-eq-border text-text-muted flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 font-bold transition-all"
        >
          <Plus size={24} /> ADICIONAR NOVO TRANSFORMADOR
        </button>

        <Card className="shadow-md">
          <div className="mb-3">
            <h2 className="text-eq-primary text-base font-bold tracking-tight uppercase">
              Arquivo de Engenharia (SCD/XML)
            </h2>
          </div>
          <DropzoneArea
            multiple={false}
            currentFile={scdFile}
            onFilesReceived={(files) => setScdFile(files[0])}
            onClearFile={() => setScdFile(null)}
            accept={FILE_CONFIG.SCD.accept}
            maxSizeMB={FILE_CONFIG.SCD.maxSizeMB}
            onError={handleLocalError}
          />
        </Card>

        <div className="mt-10 flex justify-end">
          <Button
            onClick={submit}
            isLoading={isLoading}
            disabled={!topologyType || !scdFile}
          >
            VERIFICAR
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TopologyPage;
