import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useValidation } from "../context/ValidationContext";
import { CircuitDiagram } from "../features/topology/components/CircuitDiagram";
import { CircuitErrorModal } from "../features/topology/components/CircuitErrorModal";
import type { ErrorDetail } from "../features/topology/types";

const CircuitsPage = () => {
  const { topologyReport } = useValidation();
  const [modalData, setModalData] = useState<{
    name: string;
    errors: ErrorDetail[];
  } | null>(null);
  const navigate = useNavigate();

  const transformersFromSCD = useMemo(() => {
    if (!topologyReport || !topologyReport.ied_summary) return [];

    const trafoNames = Array.from(
      new Set(topologyReport.connection_map.map((edge) => edge.to_ied)),
    );

    return trafoNames.map((name) => {
      const iedInfo = topologyReport.ied_summary.find(
        (ied) => ied.name === name,
      );

      return {
        id: name,
        name: name,
        relay_model: iedInfo?.relay_model || "N/A",
        feeders: topologyReport.connection_map
          .filter((edge) => edge.to_ied === name)
          .map((edge) => ({
            id: edge.from_ied,
            name: edge.from_ied,
          })),
      };
    });
  }, [topologyReport]);

  const handleComponentClick = (id: string) => {
    if (!topologyReport) return;

    if (id.startsWith("conn:")) {
      const iedName = id.replace("conn:", "");
      const connection = topologyReport.connection_map.find(
        (c) => c.from_ied === iedName || c.to_ied === iedName,
      );

      if (connection && connection.is_broken) {
        setModalData({
          name: connection.from_ied,
          errors: connection.errors || [],
        });
      }
    } else {
      const iedInfo = topologyReport.ied_summary.find((ied) => ied.name === id);

      if (iedInfo && !iedInfo.is_healthy) {
        setModalData({
          name: iedInfo.name,
          errors: iedInfo.errors || [],
        });
      }
    }
  };

  useEffect(() => {
    if (!topologyReport) {
      navigate("/topologies");
    }
  }, [topologyReport, navigate]);

  if (!topologyReport) return null;

  return (
    <div className="mx-auto w-full max-w-400 px-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        RESULTADO DE VALIDAÇÕES
      </h1>

      <main className="diagram-canvas min-h-[600px] w-full overflow-auto rounded-xl border-2 border-dashed border-gray-200 shadow-inner">
        <CircuitDiagram
          transformers={transformersFromSCD}
          iedSummary={topologyReport.ied_summary}
          connectionMap={topologyReport.connection_map}
          onComponentClick={handleComponentClick}
          topologyType={topologyReport.scenario}
        />
      </main>

      <CircuitErrorModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        IedName={modalData?.name || ""}
        errors={modalData?.errors || []}
      />
    </div>
  );
};

export default CircuitsPage;
