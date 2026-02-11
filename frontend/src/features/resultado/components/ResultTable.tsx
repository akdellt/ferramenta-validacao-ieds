import { useState } from "react";
import { ChevronDown, ChevronUp, Circle } from "lucide-react";
import { type StatusValidacao } from "../types";

export interface ParametroTabela {
  id: string;
  parametro: string;
  descricao: string;
  faixa: string;
  valorRef: string;
  valorLido: string;
  status: StatusValidacao;
  grupo: string;
}

interface ResultTableProps {
  iedNome: string;
  parametros: ParametroTabela[];
}

const getStatusWeight = (status: string) => {
  switch (status) {
    case "Divergente":
    case "Não encontrado":
      return 1;
    case "Conforme":
      return 3;
    default:
      return 2;
  }
};

function ResultTable({ iedNome, parametros }: ResultTableProps) {
  const [isOpen, setIsOpen] = useState(true);

  const grupos = parametros.reduce(
    (acc, item) => {
      if (!acc[item.grupo]) {
        acc[item.grupo] = [];
      }
      acc[item.grupo].push(item);
      return acc;
    },
    {} as Record<string, ParametroTabela[]>,
  );

  const nomesGrupos = Object.keys(grupos);

  return (
    <div className="border-eq-border mb-6 w-full overflow-hidden rounded-b-lg border-2 bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border-eq-border hover:bg-eq-border/50 flex w-full items-center justify-between border-b bg-white px-6 py-4 transition-colors"
      >
        <span className="text-primary text-lg font-bold uppercase">
          {iedNome}
        </span>
        {isOpen ? (
          <ChevronUp className="text-primary" />
        ) : (
          <ChevronDown className="text-primary" />
        )}
      </button>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base text-[16px]">
            <thead className="text-primary border-eq-border bg-bg-dashboard border-b font-bold tracking-wider whitespace-nowrap uppercase">
              <tr>
                <th className="w-50 px-6 py-2">Parâmetro</th>
                <th className="px-6 py-2">Descrição</th>
                <th className="w-50 px-6 py-2">Faixa</th>
                <th className="w-50 px-6 py-2 text-right">Valor Ref. (OA)</th>
                <th className="w-50 px-6 py-2 text-right">Valor Lido (IED)</th>
                <th className="w-75 px-6 py-2">Resultado</th>
              </tr>
            </thead>

            <tbody>
              {nomesGrupos.map((nomeGrupo) => (
                <>
                  <tr
                    key={nomeGrupo}
                    className="border-eq-border bg-bg-dashboard border-t-2 border-b"
                  >
                    <td
                      colSpan={6}
                      className="text-primary px-6 py-2 font-bold tracking-wide uppercase"
                    >
                      {nomeGrupo}
                    </td>
                  </tr>

                  {grupos[nomeGrupo]
                    .sort(
                      (a, b) =>
                        getStatusWeight(a.status) - getStatusWeight(b.status),
                    )
                    .map((item) => (
                      <tr
                        key={item.id}
                        className="border-eq-border hover:bg-eq-border/50 border-b last:border-0"
                      >
                        <td className="text-primary px-6 py-4 font-medium">
                          {item.parametro}
                        </td>
                        <td
                          className="text-primary px-6 py-4 font-medium"
                          title={item.descricao}
                        >
                          {item.descricao}
                        </td>
                        <td className="text-primary px-6 py-4 text-right font-mono">
                          {item.faixa}
                        </td>

                        <td className="text-primary px-6 py-4 text-right font-mono">
                          {item.valorRef}
                        </td>

                        <td
                          className={`px-6 py-4 text-right font-mono ${
                            item.status === "Divergente"
                              ? "text-error"
                              : "text-primary"
                          }`}
                        >
                          {item.valorLido}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Circle
                              size={16}
                              fill="currentColor"
                              className={
                                item.status === "Conforme"
                                  ? "text-success"
                                  : item.status === "Divergente"
                                    ? "text-error"
                                    : "text-warning"
                              }
                            />
                            <span className={"text-primary"}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ResultTable;
