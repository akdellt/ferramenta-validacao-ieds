import { Eye, FileText } from "lucide-react";

export interface HistoryLog {
  id: number;
  created_at: string;
  substation: string;
  relay_model: string;
  filename_oa: string;
  status: string;
  user_id?: number | null;
}

interface LogTableProps {
  logs: HistoryLog[];
  onViewDetails: (log: HistoryLog) => void;
}

function LogTable({ logs, onViewDetails }: LogTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-base">
        <thead className="text-primary border-eq-border bg-bg-dashboard border-b font-bold tracking-wider whitespace-nowrap uppercase">
          <tr>
            <th className="w-50 px-6 py-2">Data</th>
            <th className="w-30 px-6 py-2">Subestação</th>
            <th className="w-30 px-6 py-2">IED</th>
            <th className="w-70 px-6 py-2">Arquivo OA</th>
            <th className="w-30 px-6 py-2 text-center">Resultado</th>
            <th className="w-20 px-6 py-2 text-center">Detalhes</th>
          </tr>
        </thead>

        <tbody className="divide-bg-dashboard divide-y">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-primary px-6 py-8 text-center">
                Nenhuma validação encontrada no histórico.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr
                key={log.id}
                className="border-eq-border hover:bg-eq-border/50 bg-white transition-colors"
              >
                <td className="text-primary px-6 py-4 font-medium whitespace-nowrap">
                  {formatDate(log.created_at)}
                </td>

                <td className="text-primary px-6 py-4 font-medium">
                  {log.substation}
                </td>

                <td className="text-primary px-6 py-4 font-medium">
                  {log.relay_model}
                </td>

                <td className="text-primary flex items-center gap-2 px-6 py-4">
                  <FileText size={16} />
                  <span
                    className="max-w-70 truncate font-medium"
                    title={log.filename_oa}
                  >
                    {log.filename_oa}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      log.status === "SUCESSO" || log.status === "SUCCESS"
                        ? "text-success bg-bg-dashboard"
                        : "text-error bg-bg-dashboard"
                    }`}
                  >
                    {log.status === "SUCCESS" ? "CONFORME" : "DIVERGENTE"}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(log);
                    }}
                    className="text-eq-secondary cursor-pointer transition-colors"
                    title="Ver Detalhes"
                  >
                    <Eye size={24} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default LogTable;
