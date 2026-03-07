import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CloudUpload } from "lucide-react";

import { api } from "../services/api";
import { useValidation } from "../context/ValidationContext";
import { ErrorBanner } from "../components/common/ErrorBanner";

/**
 * Operacional: Importação de tipos. 
 * Se o arquivo ../types ainda der erro 2307, verifique se ele possui 'export interface BackendError'
 */
import type { BackendError } from "../types/error";

interface Transformer {
  id: string;
  name: string;
  feeders: { id: string; name: string }[];
}

function TopologyPage() {
  const navigate = useNavigate();
  
  // Bypass de tipagem para suportar múltiplas versões do Contexto (Inglês/Português)
  const validationContext = useValidation() as any;

  // States: Operational English
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<BackendError | null>(null);
  const [topologyType, setTopologyType] = useState("");
  const [scdFile, setScdFile] = useState<File | null>(null);
  
  const [transformers, setTransformers] = useState<Transformer[]>([
    { id: crypto.randomUUID(), name: "", feeders: [] }
  ]);

  // Interação: Mensagens em Português
  const handleLocalError = (msg: string, title: string = "Erro de Validação") => {
    setApiError({
      error: "ValidationError",
      message: msg,
      details: title,
    });
  };

  // Logic: Transformer Management
  const handleAddTransformer = () => {
    setTransformers([...transformers, { id: crypto.randomUUID(), name: "", feeders: [] }]);
  };

  const handleRemoveTransformer = (id: string) => {
    setTransformers(transformers.map(t => t.id === id ? null : t).filter(Boolean) as Transformer[]);
  };

  const handleUpdateTransformerName = (id: string, newName: string) => {
    setTransformers(transformers.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  // Logic: Feeder Management
  const handleAddFeeder = (transformerId: string) => {
    setTransformers(transformers.map(t => {
      if (t.id === transformerId) {
        return { ...t, feeders: [...t.feeders, { id: crypto.randomUUID(), name: "" }] };
      }
      return t;
    }));
  };

  const handleUpdateFeeder = (transformerId: string, feederId: string, value: string) => {
    setTransformers(transformers.map(t => {
      if (t.id === transformerId) {
        const newFeeders = t.feeders.map(f => f.id === feederId ? { ...f, name: value } : f);
        return { ...t, feeders: newFeeders };
      }
      return t;
    }));
  };

  const handleRemoveFeeder = (transformerId: string, feederId: string) => {
    setTransformers(transformers.map(t => {
      if (t.id === transformerId) {
        return { ...t, feeders: t.feeders.filter(f => f.id !== feederId) };
      }
      return t;
    }));
  };

  /**
   * Main Execution: Process technical validation
   */
  const handleProcessValidation = async () => {
    const isNamesValid = transformers.every(t => t.name.trim() !== "");
    
    if (!topologyType || !isNamesValid || !scdFile) {
      handleLocalError("Preencha a topologia, os nomes dos transformadores e selecione o arquivo SCD.");
      return;
    }

    if (topologyType === "PARALLELISM" && transformers.length < 2) {
      handleLocalError("Para operação em Paralelismo, configure no mínimo 2 transformadores.", "Restrição Técnica");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("file", scdFile);

      // Payload mapping for Python Backend
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

      // Suporte para setReportResults (EN) ou setRelatorioResultados (PT)
      const updateContext = validationContext.setReportResults || validationContext.setRelatorioResultados;
      if (updateContext) updateContext(response.data);
      
      navigate("/resultados");
      
    } catch (err: any) {
      setApiError(err.response?.data || { 
        erro: "NetworkError", 
        mensagem: "Falha na comunicação com o servidor ao processar arquivo SCD." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide uppercase">
        Configuração de Topologia
      </h1>

      <ErrorBanner error={apiError} onClose={() => setApiError(null)} />

      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* SEÇÃO: TIPO DE TOPOLOGIA */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-600 uppercase">Tipo de Topologia</label>
          <select 
            value={topologyType}
            onChange={(e) => setTopologyType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-eq-primary bg-gray-50"
          >
            <option value="">Selecione a configuração...</option>
            <option value="RADIAL">Radial</option>
            <option value="ANEL">Em Anel</option>
            <option value="PARALLELISM">Paralelismo</option>
          </select>
        </div>

        {/* LISTA DINÂMICA DE TRANSFORMADORES */}
        {transformers.map((transf, index) => (
          <div key={transf.id} className="bg-white p-8 rounded-xl shadow-md border border-gray-100 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-eq-primary uppercase">Transformador #{index + 1}</h2>
              {transformers.length > 1 && (
                <button 
                  onClick={() => handleRemoveTransformer(transf.id)} 
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm font-bold text-gray-600 uppercase">Identificação (Nome)</label>
              <input 
                type="text"
                value={transf.name}
                onChange={(e) => handleUpdateTransformerName(transf.id, e.target.value)}
                placeholder="Ex: TR-01"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-eq-primary bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alimentadores Associados</span>
                <button 
                  onClick={() => handleAddFeeder(transf.id)} 
                  className="text-xs font-bold text-eq-primary hover:underline"
                >
                  + ADICIONAR ALIMENTADOR
                </button>
              </div>

              {transf.feeders.map((feeder, fIdx) => (
                <div key={feeder.id} className="flex gap-2 items-center">
                  <input 
                    type="text"
                    value={feeder.name}
                    onChange={(e) => handleUpdateFeeder(transf.id, feeder.id, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-eq-primary"
                    placeholder={`Nome do alimentador ${fIdx + 1}`}
                  />
                  <button 
                    onClick={() => handleRemoveFeeder(transf.id, feeder.id)} 
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddTransformer}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-eq-primary hover:text-eq-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={24} /> ADICIONAR NOVO TRANSFORMADOR
        </button>

        {/* ÁREA DE UPLOAD DE ARQUIVO SCD */}
        <div className="bg-white p-8 rounded-xl shadow-md border-2 border-dashed border-eq-primary/30 flex flex-col items-center gap-4">
          <h3 className="text-sm font-bold text-gray-600 uppercase">Arquivo de Engenharia (SCD / XML)</h3>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <CloudUpload className={`w-10 h-10 mb-3 ${scdFile ? 'text-green-500' : 'text-gray-400'}`} />
              <p className="mb-2 text-sm text-gray-500 font-semibold px-4">
                {scdFile ? scdFile.name : "Clique para selecionar o arquivo SCD"}
              </p>
              <p className="text-xs text-gray-400">Suporte a arquivos IEC 61850 (.scd, .xml)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".scd,.xml" 
              onChange={(e) => setScdFile(e.target.files?.[0] || null)} 
            />
          </label>
        </div>

        {/* BOTÃO DE SUBMISSÃO */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleProcessValidation}
            disabled={isLoading || !topologyType || !scdFile}
            className={`rounded-lg px-12 py-4 text-sm font-bold tracking-wider text-white shadow-lg transition-all ${
              isLoading || !topologyType || !scdFile
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-eq-primary hover:bg-eq-primary/90 cursor-pointer hover:-translate-y-1"
            }`}
          >
            {isLoading ? "PROCESSANDO ENGENHARIA..." : "EXECUTAR VALIDAÇÃO TÉCNICA"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopologyPage;