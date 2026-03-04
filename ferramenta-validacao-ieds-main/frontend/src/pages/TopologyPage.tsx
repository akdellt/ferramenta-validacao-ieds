import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CloudUpload } from "lucide-react";

import { api } from "../services/api";
import { useValidation } from "../context/ValidationContext";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { type BackendError } from "../types";

interface Transformador {
  id: string;
  nome: string;
  alimentadores: { id: string; nome: string }[];
}

function TopologyPage() {
const { setReportResults } = useValidation();
 const navigate = useNavigate();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [erroApi, setErroApi] = useState<BackendError | null>(null);
  const [topologia, setTopologia] = useState("");
  const [arquivoScd, setArquivoScd] = useState<File | null>(null);
  const [transformadores, setTransformadores] = useState<Transformador[]>([
    { id: crypto.randomUUID(), nome: "", alimentadores: [] }
  ]);

  const handleLocalError = (msg: string, titulo: string = "Erro de Validação") => {
    setErroApi({
      erro: "ValidationError",
      mensagem: msg,
      detalhes: titulo,
    });
  };

  // Gerenciamento de Transformadores
  const handleAddTransformador = () => {
    setTransformadores([...transformadores, { id: crypto.randomUUID(), nome: "", alimentadores: [] }]);
  };

  const handleRemoveTransformador = (id: string) => {
    setTransformadores(transformadores.filter(t => t.id !== id));
  };

  const handleUpdateTransfNome = (id: string, novoNome: string) => {
    setTransformadores(transformadores.map(t => t.id === id ? { ...t, nome: novoNome } : t));
  };

  // Gerenciamento de Alimentadores
  const handleAddAlimentador = (transfId: string) => {
    setTransformadores(transformadores.map(t => {
      if (t.id === transfId) {
        return { ...t, alimentadores: [...t.alimentadores, { id: crypto.randomUUID(), nome: "" }] };
      }
      return t;
    }));
  };

  const handleUpdateAlimentador = (transfId: string, alimId: string, valor: string) => {
    setTransformadores(transformadores.map(t => {
      if (t.id === transfId) {
        const novosAlims = t.alimentadores.map(a => a.id === alimId ? { ...a, nome: valor } : a);
        return { ...t, alimentadores: novosAlims };
      }
      return t;
    }));
  };

  const handleRemoveAlimentador = (transfId: string, alimId: string) => {
    setTransformadores(transformadores.map(t => {
      if (t.id === transfId) {
        return { ...t, alimentadores: t.alimentadores.filter(a => a.id !== alimId) };
      }
      return t;
    }));
  };

  const handleConcluir = async () => {
    const nomesPreenchidos = transformadores.every(t => t.nome.trim() !== "");
    
    if (!topologia || !nomesPreenchidos || !arquivoScd) {
      handleLocalError("Preencha a topologia, transformadores e selecione o arquivo SCD.");
      return;
    }

    if (topologia === "PARALLELISM" && transformadores.length < 2) {
      handleLocalError("Para Paralelismo, configure no mínimo 2 transformadores.", "Restrição de Engenharia");
      return;
    }

    setLoading(true);
    setErroApi(null);

    try {
      const formData = new FormData();
      formData.append("file", arquivoScd);

      // Mapeamento exato para o ValidationForm do Python
      const formPayload = {
        expected_topology: topologia,
        transformers: transformadores.map(t => ({
          name: t.nome,
          feeders: t.alimentadores.map(a => a.nome)
        }))
      };
      
      formData.append("form_data", JSON.stringify(formPayload));

      // Chamada para a rota /topologies/validate
      const response = await api.post("/topologies/validate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

     setReportResults(response.data);
      navigate("/circuits"); // Navegação para a nova tela de Circuitos
      
    } catch (err: any) {
      setErroApi(err.response?.data || { erro: "NetworkError", mensagem: "Falha ao processar arquivo SCD." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide uppercase">
        CONFIGURAÇÃO DE TOPOLOGIA
      </h1>

      <ErrorBanner error={erroApi} onClose={() => setErroApi(null)} />

      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* BLOCO FIXO: TOPOLOGIA */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-600 uppercase">Tipo de Topologia</label>
          <select 
            value={topologia}
            onChange={(e) => setTopologia(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-eq-primary bg-gray-50"
          >
            <option value="">Selecione...</option>
            <option value="RADIAL">Radial</option>
            <option value="ANEL">Em Anel</option>
            <option value="PARALLELISM">Paralelismo</option>
          </select>

          {topologia === "PARALLELISM" && transformadores.length < 2 && (
            <p className="mt-2 text-xs font-bold text-amber-600 animate-pulse">
              ⚠️ Adicione pelo menos mais um transformador para operar em paralelismo.
            </p>
          )}
        </div>

        {/* LISTA DE TRANSFORMADORES */}
        {transformadores.map((transf, index) => (
          <div key={transf.id} className="bg-white p-8 rounded-xl shadow-md border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-eq-primary uppercase">Transformador #{index + 1}</h2>
              {transformadores.length > 1 && (
                <button onClick={() => handleRemoveTransformador(transf.id)} className="text-red-500 hover:text-red-700 transition-colors">
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm font-bold text-gray-600 uppercase">Nome do Transformador</label>
              <input 
                type="text"
                value={transf.nome}
                onChange={(e) => handleUpdateTransfNome(transf.id, e.target.value)}
                placeholder="Ex: TR-01"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-eq-primary bg-gray-50 font-mono"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alimentadores</span>
                <button onClick={() => handleAddAlimentador(transf.id)} className="text-xs font-bold text-eq-primary hover:underline">
                  + ADICIONAR ALIMENTADOR
                </button>
              </div>

              {transf.alimentadores.map((alim, aIdx) => (
                <div key={alim.id} className="flex gap-2 items-center">
                  <input 
                    type="text"
                    value={alim.nome}
                    onChange={(e) => handleUpdateAlimentador(transf.id, alim.id, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-eq-primary"
                    placeholder={`Nome do alimentador ${aIdx + 1}`}
                  />
                  <button onClick={() => handleRemoveAlimentador(transf.id, alim.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddTransformador}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-eq-primary hover:text-eq-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={24} /> ADICIONAR NOVO TRANSFORMADOR
        </button>

        {/* ÁREA DE UPLOAD */}
        <div className="bg-white p-8 rounded-xl shadow-md border-2 border-dashed border-eq-primary/30 flex flex-col items-center gap-4">
          <h3 className="text-sm font-bold text-gray-600 uppercase">Projeto de Engenharia (SCD / XML)</h3>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <CloudUpload className={`w-10 h-10 mb-3 ${arquivoScd ? 'text-green-500' : 'text-gray-400'}`} />
              <p className="mb-2 text-sm text-gray-500 font-semibold px-4">
                {arquivoScd ? arquivoScd.name : "Clique para selecionar o arquivo SCD"}
              </p>
              <p className="text-xs text-gray-400">Padrão IEC 61850 (.scd, .xml)</p>
            </div>
            <input type="file" className="hidden" accept=".scd,.xml" onChange={(e) => setArquivoScd(e.target.files?.[0] || null)} />
          </label>
          {arquivoScd && <button onClick={() => setArquivoScd(null)} className="text-xs text-red-500 font-bold hover:underline">Remover arquivo</button>}
        </div>

        {/* BOTÃO FINAL */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleConcluir}
            disabled={loading || !topologia || !arquivoScd || (topologia === "PARALLELISM" && transformadores.length < 2)}
            className={`rounded-lg px-12 py-4 text-sm font-bold tracking-wider text-white shadow-lg transition-all ${
              loading || !topologia || !arquivoScd || (topologia === "PARALLELISM" && transformadores.length < 2)
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-eq-primary hover:bg-eq-primary/90 cursor-pointer hover:-translate-y-1"
            }`}
          >
            {loading ? "PROCESSANDO VALIDAÇÃO..." : "EXECUTAR VALIDAÇÃO TÉCNICA"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopologyPage;