import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useValidation } from "../context/ValidationContext";

import CardFilter, {
  type FilterStatus,
} from "../features/result/components/CardFilter";
import DropdownFilter from "../features/result/components/DropdownFilter";
import ResultTable from "../features/result/components/ResultTable";

import type {
  BackendReport,
  Parameter,
  IedResult,
} from "../features/result/types";

function ResultPage() {
  const navigate = useNavigate();
  const { reportResults } = useValidation();

  const report = reportResults as BackendReport | undefined;

  const [selectedIed, setSelectedIed] = useState<string | null>(null);

  const hasDivergences = useMemo(() => {
    return report?.results.some(
      (ied) =>
        ied.parameters_list?.some((p) =>
          ["Divergente", "Não encontrado"].includes(p.status),
        ) ?? false,
    );
  }, [report]);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>(
    hasDivergences ? "divergente" : "total",
  );

  useEffect(() => {
    if (!report) {
      navigate("/");
    }
  }, [report, navigate]);

  if (!report) return null;

  const iedNames = report.results.map((r) => r.relay_model);

  const visibleIeds = report.results.filter((ied) =>
    selectedIed ? ied.relay_model === selectedIed : true,
  );

  const metrics = useMemo(() => {
    let total = 0;
    let conforme = 0;
    let divergente = 0;

    const negativeStatus = ["Divergente", "Não encontrado"];

    visibleIeds.forEach((ied) => {
      ied.parameters_list?.forEach((p) => {
        total++;
        if (p.status === "Conforme") {
          conforme++;
        } else if (negativeStatus.includes(p.status)) {
          divergente++;
        }
      });
    });

    return { total, conforme, divergente };
  }, [visibleIeds]);

  return (
    <div className="mx-auto w-full max-w-400 px-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        RESULTADO DE VALIDAÇÕES
      </h1>

      <div className="flex w-full items-center justify-between">
        <div className="w-72">
          <DropdownFilter
            options={iedNames}
            selected={selectedIed}
            onSelect={setSelectedIed}
            placeholder="Todos os IEDs"
          />
        </div>
        <CardFilter
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          counts={metrics}
        />
      </div>

      <div className="bg-eq-border pt-0.5">
        {visibleIeds.map((ied: IedResult) => {
          const filteredParameters = (ied.parameters_list ?? []).filter(
            (p: Parameter) => {
              if (statusFilter === "total") return true;
              if (statusFilter === "divergente") {
                return (
                  p.status === "Divergente" || p.status === "Não encontrado"
                );
              }
              return p.status.toLowerCase() === statusFilter.toLowerCase();
            },
          );

          if (filteredParameters.length === 0) return null;

          const iedData: IedResult = {
            ...ied,
            parameters_list: filteredParameters,
          };

          return <ResultTable key={ied.relay_model} data={iedData} />;
        })}

        {metrics.total === 0 && (
          <div className="border-eq-border bg-bg-dashboard text-secondary mt-10 rounded-lg border border-dashed p-10 text-center">
            Nenhum dado encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
