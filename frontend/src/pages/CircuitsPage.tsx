import { useState, useMemo } from "react";
import { CircuitDiagram } from "../features/topology/components/CircuitDiagram";
import { CircuitErrorModal } from "../features/topology/components/CircuitErrorModal";
import { useValidation } from "../context/ValidationContext";
import type { IedSummary, ConnectionEdge } from "../features/topology/types";

const CircuitsPage = () => {
  const { topologyReport } = useValidation();
  const [selectedIed, setSelectedIed] = useState<IedSummary | null>(null);

  const transformersFromSCD = useMemo(() => {
    if (!topologyReport || !topologyReport.ied_summary) return [];

    return topologyReport.ied_summary
      .filter((ied: IedSummary) => ied.name.toUpperCase().includes("T"))
      .map((ied: IedSummary) => ({
        id: ied.name,
        name: ied.name,
        relay_model: ied.relay_model,

        feeders: (topologyReport.connection_map || [])
          .filter((edge: ConnectionEdge) => edge.to_ied === ied.name)
          .map((edge: ConnectionEdge) => ({
            id: edge.from_ied,
            name: edge.from_ied,
          })),
      }));
  }, [topologyReport]);

  const activeErrors = useMemo(
    () =>
      topologyReport?.ied_summary
        .filter((ied) => !ied.is_healthy)
        .map((ied) => ied.name) || [],
    [topologyReport],
  );

  const handleComponentClick = (name: string) => {
    const iedInfo = topologyReport?.ied_summary.find(
      (ied) => ied.name === name,
    );

    if (iedInfo && !iedInfo.is_healthy) {
      setSelectedIed(iedInfo);
    }
  };

  if (!topologyReport) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 italic">
          Aguardando resultados da validação...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-400 px-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        RESULTADO DE VALIDAÇÕES
      </h1>

      <main className="flex h-auto min-h-150 w-full items-center justify-center overflow-auto rounded-xl border-2 border-dashed border-gray-200 bg-white p-4">
        <CircuitDiagram
          transformers={transformersFromSCD}
          errors={activeErrors}
          onComponentClick={handleComponentClick}
          topologyType={topologyReport.scenario}
        />
      </main>

      <CircuitErrorModal
        isOpen={!!selectedIed}
        onClose={() => setSelectedIed(null)}
        IedName={selectedIed?.name || ""}
        errors={selectedIed?.errors || []}
      />
    </div>
  );
};

export default CircuitsPage;
