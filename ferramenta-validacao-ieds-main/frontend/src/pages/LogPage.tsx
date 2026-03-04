import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useValidation } from "../context/ValidationContext";
import axios from "axios";
import LogTable from "../features/log/LogTable";

export interface HistoryLog {
  id: number;
  created_at: string;
  substation: string;
  relay_model: string;
  filename_oa: string;
  status: string;
  user_id?: number | null;
  result_json?: any;
}

function LogPage() {
  const navigate = useNavigate();
  const { setReportResults } = useValidation();

  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/api/logs/");
        setLogs(response.data);
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        setError("Não foi possível carregar o histórico de validações.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleViewDetails = (log: HistoryLog) => {
    const dadosFormatados = {
      resultados: [
        {
          rele_tipo: log.relay_model,
          nome_arquivo_oa: log.filename_oa,
          lista_parametros: log.result_json,
        },
      ],
    };

    setReportResults(dadosFormatados);

    navigate("/resultados");
  };

  return (
    <div className="mx-auto w-full max-w-400 px-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        HISTÓRICO DE VALIDAÇÕES
      </h1>

      <div className="flex w-full items-center justify-between"></div>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-4 text-center text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="text-lg text-gray-500">Carregando dados...</span>
        </div>
      ) : (
        <div className="border-eq-border overflow-hidden rounded-lg border-2 shadow-lg">
          <LogTable logs={logs} onViewDetails={handleViewDetails} />
        </div>
      )}
    </div>
  );
}

export default LogPage;
