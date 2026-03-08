import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CloudUpload, CheckCircle2, Settings2 } from "lucide-react";

import { api } from "../services/api";
import { useValidation } from "../context/ValidationContext";
import { ErrorBanner } from "../components/common/ErrorBanner";
import type { BackendError } from "../types/error";

interface Transformer {
  id: string;
  name: string;
  feeders: { id: string; name: string }[];
}

// Definição das topologias suportadas pelo Backend
const SUPPORTED_TOPOLOGIES = [
  { value: "PARALLELISM", label: "Paralelismo (Parallelism)" },
  { value: "LOGICAL_SELECTIVITY_COUPLED", label: "Seletividade Lógica Acoplada (Coupled)" },
  { value: "LOGICAL_SELECTIVITY_ISOLATED", label: "Seletividade Lógica Isolada (Isolated)" },
  { value: "GENERIC", label: "Configuração Genérica (Generic)" },
];

function TopologyPage() {
  const navigate = useNavigate();
  const validationContext = useValidation() as any;

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<BackendError | null>(null);
  const [topologyType, setTopologyType] = useState("");
  const [scdFile, setScdFile] = useState<File | null>(null);
  
  const [transformers, setTransformers] = useState<Transformer[]>([
    { id: crypto.randomUUID(), name: "", feeders: [] }
  ]);

  const handleLocalError = (msg: string, title: string = "Erro de Validação") => {
    setApiError({
      error: "ValidationError",
      message: msg,
      details: title,
    });
  };

  // --- Lógica de Gerenciamento ---

  const handleAddTransformer = () => {
    setTransformers(prev => [...prev, { id: crypto.randomUUID(), name: "", feeders: [] }]);
  };

  const handleRemoveTransformer = (id: string) => {
    if (transformers.length > 1) {
      setTransformers(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateTransformerName = (id: string, newName: string) => {
    setTransformers(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleAddFeeder = (transformerId: string) => {
    setTransformers(prev => prev.map(t => 
      t.id === transformerId 
        ? { ...t, feeders: [...t.feeders, { id: crypto.randomUUID(), name: "" }] } 
        : t
    ));
  };

  const handleUpdateFeeder = (transformerId: string, feederId: string, value: string) => {
    setTransformers(prev => prev.map(t => {
      if (t.id === transformerId) {
        return {
          ...t,
          feeders: t.feeders.map(f => f.id === feederId ? { ...f, name: value } : f)
        };
      }
      return t;
    }));
  };

  const handleRemoveFeeder = (transformerId: string, feederId: string) => {
    setTransformers(prev => prev.map(t => 
      t.id === transformerId 
        ? { ...t, feeders: t.feeders.filter(f => f.id !== feederId) } 
        : t
    ));
  };

  /**
   * Envia os dados para o Backend e redireciona para CIRCUITO
   */
  const handleProcessValidation = async () => {
    const isNamesValid = transformers.every(t => t.name.trim() !== "");
    
    if (!topologyType || !isNamesValid || !scdFile) {
      handleLocalError("Preencha a topologia, os nomes dos ativos e selecione o arquivo SCD.");
      return;
    }

    // Regra de negócio: Paralelismo exige multi-transformadores
    if (topologyType === "PARALLELISM" && transformers.length < 2) {
        handleLocalError("A operação em PARALLELISM exige no mínimo 2 transformadores configurados.");
        return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("file", scdFile);

      const formPayload = {
        expected_topology: topologyType,
        transformers: transformers.map(t => ({
          name: t.name,
          feeders: t.feeders.map(f => f.name)
        }))
      };
      
      formData.append("form_data", JSON.stringify(formPayload));

      const response = await api.post("/topologies/validate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updateContext = validationContext.setReportResults || validationContext.setRelatorioResultados;
      if (updateContext) updateContext(response.data);
      
      navigate("/circuito");
      
    } catch (err: any) {
      setApiError(err.response?.data || { 
        erro: "NetworkError", 
        mensagem: "Erro ao processar validação técnica da topologia." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-8 py-12 bg-slate-50">
      <h1 className="text-primary mb-10 text-center text-3xl font-black tracking-tight uppercase">
        Configuração de Topologia
      </h1>

      <ErrorBanner error={apiError} onClose={() => setApiError(null)} />

      <div className="mx-auto w-full max-w-5xl space-y-8">
        
        {/* SEÇÃO: SELEÇÃO DE TOPOLOGIA SUPORTADA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-eq-primary">
            <Settings2 size={18} />
            <label className="text-xs font-bold uppercase tracking-widest">Modelo de Operação do Sistema</label>
          </div>
          <select 
            value={topologyType}
            onChange={(e) => setTopologyType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-4 outline-none focus:ring-2 focus:ring-eq-primary/20 focus:border-eq-primary bg-white transition-all font-semibold text-gray-700"
          >
            <option value="">Selecione a topologia alvo...</option>
            {SUPPORTED_TOPOLOGIES.map(top => (
                <option key={top.value} value={top.value}>{top.label}</option>
            ))}
          </select>
        </div>

        {/* LISTA DE TRANSFORMADORES */}
        {transformers.map((transf, index) => (
          <div key={transf.id} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-eq-primary flex items-center gap-2">
                <span className="bg-eq-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                TRANSFORMADOR / ATIVO
              </h2>
              {transformers.length > 1 && (
                <button 
                  onClick={() => handleRemoveTransformer(transf.id)} 
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Identificação (SCD Name)</label>
                <input 
                  type="text"
                  value={transf.name}
                  onChange={(e) => handleUpdateTransformerName(transf.id, e.target.value)}
                  placeholder="Ex: TR01"
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-eq-primary bg-gray-50 font-mono text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase">Alimentadores Associados</label>
                  <button 
                    onClick={() => handleAddFeeder(transf.id)} 
                    className="text-[10px] font-black text-eq-primary hover:underline"
                  >
                    + ADICIONAR
                  </button>
                </div>

                <div className="space-y-2">
                  {transf.feeders.map((feeder, fIdx) => (
                    <div key={feeder.id} className="flex gap-2 items-center group">
                      <input 
                        type="text"
                        value={feeder.name}
                        onChange={(e) => handleUpdateFeeder(transf.id, feeder.id, e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-eq-primary"
                        placeholder={`Nome do alimentador ${fIdx + 1}`}
                      />
                      <button 
                        onClick={() => handleRemoveFeeder(transf.id, feeder.id)} 
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddTransformer}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-eq-primary hover:text-eq-primary transition-all flex items-center justify-center gap-2 group"
        >
          <Plus size={20} /> ADICIONAR NOVO ATIVO
        </button>

        {/* UPLOAD SCD */}
        <div className={`p-1 rounded-xl transition-all ${scdFile ? 'bg-green-100 shadow-inner' : ''}`}>
          <div className={`bg-white p-8 rounded-xl shadow-sm border-2 border-dashed transition-all flex flex-col items-center gap-4 ${
            scdFile ? 'border-green-500' : 'border-gray-300 hover:border-eq-primary/50'
          }`}>
            <label className="flex flex-col items-center justify-center w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center text-center">
                {scdFile ? (
                  <CheckCircle2 className="w-12 h-12 mb-3 text-green-500 animate-pulse" />
                ) : (
                  <CloudUpload className="w-12 h-12 mb-3 text-gray-300" />
                )}
                <p className={`mb-1 text-sm font-bold ${scdFile ? 'text-green-700' : 'text-gray-500'}`}>
                  {scdFile ? scdFile.name : "Clique para selecionar o arquivo SCD"}
                </p>
                <p className="text-xs text-gray-400">Padronização IEC 61850 (.scd, .xml)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".scd,.xml" 
                onChange={(e) => setScdFile(e.target.files?.[0] || null)} 
              />
            </label>
          </div>
        </div>

        {/* BOTÃO FINAL */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleProcessValidation}
            disabled={isLoading || !topologyType || !scdFile}
            className={`rounded-xl px-16 py-5 text-sm font-black tracking-widest text-white shadow-xl transition-all ${
              isLoading || !topologyType || !scdFile
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-eq-primary hover:bg-eq-primary/90 hover:-translate-y-1 active:scale-95 shadow-eq-primary/20"
            }`}
          >
            {isLoading ? "PROCESSANDO ENGENHARIA..." : "INICIAR VALIDAÇÃO DE CIRCUITO"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopologyPage;