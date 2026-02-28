import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useValidation } from "../context/ValidationContext";

import CardFilter from "../features/resultado/components/CardFilter";
import DropdownFilter from "../features/resultado/components/DropdownFilter";
import ResultTable, {
  type ParametroTabela,
} from "../features/resultado/components/ResultTable";

import type {
  RelatorioBackend,
  ParametroBackend,
  ResultadoIED,
} from "../features/resultado/types";

function ResultPage() {
  const navigate = useNavigate();
  const { relatorioResultados } = useValidation();
  const relatorio = relatorioResultados as RelatorioBackend | undefined;

  const [iedSelecionado, setIedSelecionado] = useState<string | null>(null);

  const possuiDivergencias = relatorio?.resultados.some((ied) =>
    ied.lista_parametros.some((p) =>
      ["Divergente", "Não encontrado"].includes(p.status),
    ),
  );

  const [filtroStatus, setFiltroStatus] = useState<
    "total" | "conforme" | "divergente"
  >(possuiDivergencias ? "divergente" : "total");

  useEffect(() => {
    if (!relatorio) {
      navigate("/");
    }
  }, [relatorio, navigate]);

  if (!relatorio) return null;

  const nomesIeds = relatorio.resultados.map((r: ResultadoIED) => r.rele_tipo);

  const iedsVisiveis = relatorio.resultados.filter((ied: ResultadoIED) =>
    iedSelecionado ? ied.rele_tipo === iedSelecionado : true,
  );

  const metricas = useMemo(() => {
    let total = 0;
    let conforme = 0;
    let divergente = 0;

    const statusNegativos = ["Divergente", "Não encontrado"];

    iedsVisiveis.forEach((ied: ResultadoIED) => {
      ied.lista_parametros.forEach((p: ParametroBackend) => {
        total++;
        if (p.status === "Conforme") {
          conforme++;
        } else if (statusNegativos.includes(p.status)) {
          divergente++;
        }
      });
    });

    return { total, conforme, divergente };
  }, [iedsVisiveis]);

  return (
    <div className="mx-auto w-full max-w-400 px-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        RESULTADO DE VALIDAÇÕES
      </h1>

      <div className="flex w-full items-center justify-between">
        <div className="w-72">
          <DropdownFilter
            options={nomesIeds}
            selected={iedSelecionado}
            onSelect={setIedSelecionado}
            placeholder="Todos os IEDs"
          />
        </div>
        <CardFilter
          activeFilter={filtroStatus}
          onFilterChange={setFiltroStatus}
          counts={metricas}
        />
      </div>

      <div className="bg-eq-border pt-0.5">
        {iedsVisiveis.map((ied: ResultadoIED) => {
          const parametrosFiltrados = ied.lista_parametros.filter(
            (p: ParametroBackend) => {
              if (filtroStatus === "total") return true;
              if (filtroStatus === "divergente") {
                return (
                  p.status === "Divergente" || p.status === "Não encontrado"
                );
              }
              return p.status.toLowerCase() === filtroStatus;
            },
          );

          if (parametrosFiltrados.length === 0) return null;

          const dadosFormatados: ParametroTabela[] = parametrosFiltrados.map(
            (p: ParametroBackend) => ({
              id: crypto.randomUUID(),
              grupo: p.grupo || "GERAL",
              parametro: p.parametro,
              descricao: p.descricao,
              faixa: p.faixa_ajuste || "-",
              valorRef: p.ajuste_referencia || "-",
              valorLido: p.valor_atual || "-",
              status: p.status,
            }),
          );

          return (
            <ResultTable
              key={ied.rele_tipo}
              iedNome={ied.rele_tipo}
              parametros={dadosFormatados}
            />
          );
        })}

        {metricas.total === 0 && (
          <div className="border-eq-border bg-bg-dashboard text-secondary mt-10 rounded-lg border border-dashed p-10 text-center">
            Nenhum dado encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
