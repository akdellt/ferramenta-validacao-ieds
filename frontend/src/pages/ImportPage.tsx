import { useState } from "react";
import ImportSection, {
  type IedSlotData,
} from "../features/importacao/components/ImportSection";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useValidation } from "../context/ValidationContext";

function ImportPage() {
  const navigate = useNavigate();

  const { oaFiles, setOaFiles, iedSlots, setIedSlots, setRelatorioResultados } =
    useValidation();

  const [loading, setLoading] = useState(false);

  const handleAddOaFiles = async (novosArquivos: File[]) => {
    setOaFiles((prev) => [...prev, ...novosArquivos]);
    setLoading(true);

    const formData = new FormData();
    novosArquivos.forEach((f) => formData.append("arquivos", f));

    try {
      const response = await api.post("api/processamento/ler-oas", formData);

      const novosSlots: IedSlotData[] = response.data.map((item: any) => ({
        id: crypto.randomUUID(),
        nome: item.rele_tipo,
        arquivo: null,
        nomeArquivo: item.nome_arquivo,
      }));

      setIedSlots((prev) => [...prev, ...novosSlots]);
    } catch (error) {
      alert("Erro ao ler OAs");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOaFile = (index: number | string) => {
    if (typeof index === "number") {
      const arquivoRemovido = oaFiles[index];

      setOaFiles((prev) => prev.filter((_, i) => i !== index));

      setIedSlots((prev) =>
        prev.filter((slot) => slot.nomeArquivo !== arquivoRemovido.name),
      );
    }
  };

  const handleBatchIedUpload = async (novosArquivos: File[]) => {
    if (iedSlots.length === 0) {
      alert("Importe as Ordens de Ajuste primeiro para criar os slots.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      novosArquivos.forEach((file) => formData.append("arquivos", file));

      const response = await api.post("/api/processamento/ler-ieds", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const identificacoes = response.data;

      setIedSlots((prevSlots) =>
        prevSlots.map((slot) => {
          const match = identificacoes.find(
            (item: any) => item.rele_tipo === slot.nome,
          );

          if (match) {
            const arquivoOriginal = novosArquivos.find(
              (f) => f.name === match.nome_arquivo,
            );

            if (arquivoOriginal) {
              return { ...slot, arquivo: arquivoOriginal };
            }
          }

          return slot;
        }),
      );
    } catch (error) {
      console.error("Erro ao identificar IEDs:", error);
      alert("Erro ao processar arquivos de IED.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIedSlot = (id: string, file: File) => {
    setIedSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, arquivo: file } : slot)),
    );
  };

  const handleRemoveIedFile = (id: number | string) => {
    if (typeof id === "string") {
      setIedSlots((prev) =>
        prev.map((slot) =>
          slot.id === id ? { ...slot, arquivo: null } : slot,
        ),
      );
    }
  };

  const handleVerificar = async () => {
    const slotsPreenchidos = iedSlots.filter((s) => s.arquivo !== null);

    if (slotsPreenchidos.length === 0) {
      alert("Nenhum par OA + IED completo encontrado.");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    slotsPreenchidos.forEach((slot) => {
      const arquivoIed = slot.arquivo!;
      const arquivoOa = oaFiles.find((f) => f.name === slot.nomeArquivo);

      if (arquivoOa && arquivoIed) {
        formData.append("lista_oas", arquivoOa);
        formData.append("lista_ieds", arquivoIed);
      }
    });

    try {
      const response = await api.post(
        "/api/processamento/validar-pares",
        formData,
      );

      setRelatorioResultados(response.data);

      navigate("/resultados");
    } catch (error) {
      console.error("Erro na validação:", error);
      alert("Erro ao validar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const parValido = iedSlots.some((slot) => slot.arquivo !== null);

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto p-8 py-12">
      <h1 className="text-primary mb-10 text-center text-3xl font-bold tracking-wide">
        IMPORTAÇÃO DE ARQUIVOS
      </h1>

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ImportSection
            title="Ordens de Ajuste"
            tipoArquivo="OA"
            arquivosOA={oaFiles}
            onAddFiles={handleAddOaFiles}
            onRemoveFile={handleRemoveOaFile}
          />
          <ImportSection
            title="Dados de Campo (IEDs)"
            tipoArquivo="IED"
            slotsIED={iedSlots}
            onUpdateSlot={handleUpdateIedSlot}
            onRemoveFile={handleRemoveIedFile}
            onAddFiles={handleBatchIedUpload}
          />
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleVerificar}
            disabled={loading || !parValido}
            className={`rounded-lg px-12 py-3 text-sm font-bold tracking-wider text-white shadow-lg transition-all ${
              loading || !parValido
                ? "cursor-not-allowed bg-gray-400 opacity-70"
                : "bg-eq-primary hover:bg-eq-primary/90 cursor-pointer"
            } `}
          >
            {loading ? "PROCESSANDO..." : "VERIFICAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportPage;
