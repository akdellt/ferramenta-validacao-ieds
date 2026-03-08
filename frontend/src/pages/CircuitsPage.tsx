import { useValidation } from "../context/ValidationContext";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Cpu, 
  Network, 
  ArrowLeft,
  FileText,
  Activity
} from "lucide-react";

// --- INTERFACES (DEFINIDAS FORA DA FUNÇÃO PARA EVITAR ERRO 1184) ---

export interface ErrorDetail {
  code: string;
  message: string;
  location?: string;
}

export interface IedSummary {
  name: string;      // Ajustado para bater com seu .map((ied: any) => ied.name)
  status: string;
  errors: string[];  // Ajustado para bater com seu ied.errors.length
}

export interface BackendReport {
  filename: string;
  scenario: string;
  is_valid: boolean;
  summary: {
    integrity_errors_count: number;
    network_errors_count: number;
    logic_errors_count: number;
    total_errors: number;
  };
  ied_summary: IedSummary[];
}

// --- COMPONENTE PRINCIPAL ---

function CircuitsPage() {
  const navigate = useNavigate();
  // Tipagem forçada para garantir que o TS reconheça os campos do reportResults
  const { reportResults } = useValidation() as { reportResults: BackendReport | null };

  if (!reportResults) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Activity size={48} className="text-gray-300 animate-pulse" />
        <p className="text-gray-500 font-medium">Aguardando dados de validação...</p>
        <button onClick={() => navigate("/topologies")} className="text-eq-primary font-bold hover:underline">
          Voltar para Configuração
        </button>
      </div>
    );
  }

  // --- DESESTRUTURAÇÃO (RESOLVE OS ERROS 2304 "Cannot find name") ---
  const { filename, scenario, is_valid, summary, ied_summary } = reportResults;

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-y-auto p-8 py-12 bg-gray-50/30">
      <div className="mx-auto w-full max-w-6xl">
        
        {/* HEADER DA PÁGINA */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Análise de Circuitos
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                <FileText size={14} className="text-eq-primary" /> {filename}
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 uppercase">
                <Network size={14} className="text-eq-primary" /> {scenario}
              </span>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white shadow-xl transition-transform hover:scale-105 ${
            is_valid ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"
          }`}>
            {is_valid ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
            <span className="tracking-wider">{is_valid ? "CIRCUITO ÍNTEGRO" : "ERROS DETECTADOS"}</span>
          </div>
        </div>

        {/* RESUMO TÉCNICO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Falhas de Integridade" count={summary.integrity_errors_count} type="danger" />
          <StatCard title="Inconformidades de Rede" count={summary.network_errors_count} type="warning" />
          <StatCard title="Erros de Seletividade" count={summary.logic_errors_count} type="info" />
          <StatCard title="Total de Ocorrências" count={summary.total_errors} type="neutral" />
        </div>

        {/* LISTA DE IEDS (EQUIPAMENTOS) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Cpu size={22} className="text-gray-400" />
            <h2 className="text-xl font-bold text-gray-800">Status dos Dispositivos (IEDs)</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {ied_summary.map((ied) => (
              <div key={ied.name} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-eq-primary/30 transition-all overflow-hidden">
                <div className={`p-5 flex justify-between items-center ${ied.errors.length > 0 ? "bg-rose-50/30" : "bg-emerald-50/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ied.errors.length > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                       <Cpu size={20} />
                    </div>
                    <span className="font-bold text-gray-800 text-lg">{ied.name}</span>
                  </div>
                  <span className={`text-[10px] tracking-widest px-3 py-1 rounded-full font-black uppercase ${
                    ied.errors.length > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {ied.errors.length > 0 ? `${ied.errors.length} Falhas` : "Operacional"}
                  </span>
                </div>
                
                {ied.errors.length > 0 && (
                  <div className="p-5 bg-white">
                    <ul className="space-y-3">
                      {ied.errors.map((error, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600">
                          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AÇÕES FINAIS */}
        <div className="mt-12 flex items-center justify-between border-t pt-8">
          <button 
            onClick={() => navigate("/topologies")}
            className="flex items-center gap-2 text-gray-500 hover:text-eq-primary font-bold transition-all px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} /> EDITAR TOPOLOGIA
          </button>
          
          <button 
            onClick={() => window.print()}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-all shadow-md"
          >
            EXPORTAR PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-componente de Card
function StatCard({ title, count, type }: { title: string, count: number, type: 'danger' | 'warning' | 'info' | 'neutral' }) {
  const styles: any = {
    danger: "text-rose-600 border-rose-100",
    warning: "text-orange-600 border-orange-100",
    info: "text-blue-600 border-blue-100",
    neutral: "text-gray-800 border-gray-200"
  };

  return (
    <div className={`p-6 rounded-3xl border-2 shadow-sm flex flex-col items-center transition-transform hover:-translate-y-1 bg-white ${styles[type]}`}>
      <span className="text-4xl font-black leading-none mb-2">{count}</span>
      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">{title}</span>
    </div>
  );
}

export default CircuitsPage;