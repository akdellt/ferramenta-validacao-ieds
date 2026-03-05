import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useValidation } from "../context/ValidationContext";
import { api } from "../services/api";
import LogTable, { type HistoryLog } from "../features/log/LogTable";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { type BackendError } from "../types/error";
import { type BackendReport } from "../features/result/types";

function LogPage() {
  const navigate = useNavigate();
  const { setReportResults } = useValidation();

  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<BackendError | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get("/logs/");
        setLogs(response.data);
      } catch (err: any) {
        setApiError(err as BackendError);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleViewDetails = (log: HistoryLog) => {
    const historicalReport: BackendReport = {
      results: [
        {
          relay_model: log.relay_model,
          parameters_list: log.result_json || [],
        },
      ],
    };

    setReportResults(historicalReport);
    navigate("/results");
  };

  return (
    <div className="mx-auto w-full max-w-400 px-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        HISTÓRICO DE VALIDAÇÕES
      </h1>

      <div className="flex w-full items-center justify-between"></div>

      <ErrorBanner error={apiError} onClose={() => setApiError(null)} />

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
