import { Plus } from "lucide-react";

import { useValidation } from "../context/ValidationContext";
import { ErrorBanner } from "../components/common/ErrorBanner";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTopologySubmission } from "../features/topology/hooks/useTopologySubmission";
import { TransformerCard } from "../features/topology/components/TransformerCard";
import { TopologyTypeSelector } from "../features/topology/components/TopologyTypeSelector";
import DropzoneArea from "../components/common/DropzoneArea";
import { FILE_CONFIG } from "../config/fileUpload";
import useTopologyActions from "../features/topology/hooks/useTopologyActions";
import Card from "../components/common/Card";
import { Button } from "../components/common/Button";
import { getTopologyHelpers } from "../features/topology/types";
import { CircuitErrorModal } from "../features/topology/components/CircuitErrorModal";

function TopologyPage() {
  const {
    transformers,
    addTransformer,
    removeTransformer,
    updateTransformerName,
    addFeeder,
    updateFeeder,
    removeFeeder,
    resetTopologyState,
  } = useTopologyActions();

  const { topologyType, setTopologyType, scdFile, setScdFile } =
    useValidation();

  const {
    submit,
    isLoading,
    apiError,
    setApiError,
    handleLocalError,
    isErrorModalOpen,
    setIsErrorModalOpen,
    consistencyErrors,
    isSuccess,
  } = useTopologySubmission();

  const navigate = useNavigate();

  const { isCommonBus, isParallel } = getTopologyHelpers(topologyType);

  const transformerNames = transformers.map((t) => t.name.trim().toUpperCase());
  const duplicateTrafos = transformerNames.filter(
    (name, idx) => name !== "" && transformerNames.indexOf(name) !== idx,
  );

  const duplicateFeederNames = (() => {
    if (isCommonBus || isParallel) {
      return transformers.flatMap((t) => {
        const names = t.feeders
          .map((f) => f.name.trim().toUpperCase())
          .filter((n) => n !== "");
        return names.filter((name, index) => names.indexOf(name) !== index);
      });
    }

    const allNames = transformers
      .flatMap((t) => t.feeders.map((f) => f.name.trim().toUpperCase()))
      .filter((name) => name !== "");

    return allNames.filter((name, index) => allNames.indexOf(name) !== index);
  })();

  const isFormInvalid =
    !topologyType ||
    !scdFile ||
    (isCommonBus && transformers.length < 2) ||
    (isParallel && transformers.length < 2) ||
    transformers.some((t) => t.name.trim() === "") ||
    duplicateTrafos.length > 0 ||
    duplicateFeederNames.length > 0;

  const handleCloseModal = () => {
    setIsErrorModalOpen(false);
    if (isSuccess) navigate("/circuits");
  };

  useEffect(() => {
    if (topologyType) {
      resetTopologyState(topologyType);
    }
  }, [topologyType, resetTopologyState]);

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
            topologyType={topologyType}
            duplicateNames={duplicateFeederNames}
            isNameDuplicate={duplicateTrafos.includes(
              transf.name.trim().toUpperCase(),
            )}
            canEditFeeders={isCommonBus ? index === 0 : true}
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
            disabled={isFormInvalid}
          >
            VERIFICAR
          </Button>
        </div>

        <CircuitErrorModal
          isOpen={isErrorModalOpen}
          onClose={handleCloseModal}
          IedName="Consistência do Projeto"
          errors={consistencyErrors}
          isSuccess={isSuccess}
        />
      </div>
    </div>
  );
}

export default TopologyPage;
