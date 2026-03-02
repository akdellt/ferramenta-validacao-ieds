import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { api } from "../services/api";
import ImportSection, {
  type IedSlotData,
} from "../features/importacao/components/ImportSection";
import { useValidation } from "../context/ValidationContext";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { type BackendError } from "../types";

function ImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { oaFiles, setOaFiles, iedSlots, setIedSlots, setReportResults } =
    useValidation();

  const [loading, setLoading] = useState(false);
  const [erroApi, setErroApi] = useState<BackendError | null>(null);

  const handleLocalError = (
    msg: string,
    titulo: string = "Arquivo Inválido",
  ) => {
    setErroApi({
      erro: "ValidationError",
      mensagem: msg,
      detalhes: titulo,
    });
  };

  const handleAddOaFiles = async (novosArquivos: File[]) => {
    setLoading(true);
    setErroApi(null);

    const arquivosSucesso: File[] = [];
    const slotsSucesso: IedSlotData[] = [];
    const errosEncontrados: string[] = [];

    await Promise.all(
      novosArquivos.map(async (file) => {
        const formData = new FormData();
        formData.append("arquivos", file);

        try {
          const response = await api.post(
            "api/processamento/ler-oas",
            formData,
          );

          arquivosSucesso.push(file);

          const slotsDoArquivo: IedSlotData[] = response.data.map(
            (item: any) => ({
              id: crypto.randomUUID(),
              nome: item.rele_tipo,
              arquivo: null,
              nomeArquivo: item.nome_arquivo,
              subestacao: item.subestacao,
            }),
          );

          slotsSucesso.push(...slotsDoArquivo);
        } catch (err: any) {
          const msgErro = err.response?.data?.mensagem || "Formato inválido";
          errosEncontrados.push(`${file.name} (${msgErro})`);
        }
      }),
    );

    if (arquivosSucesso.length > 0) {
      setOaFiles((prev) => [...prev, ...arquivosSucesso]);
      setIedSlots((prev) => [...prev, ...slotsSucesso]);
    }

    if (errosEncontrados.length > 0) {
      if (arquivosSucesso.length === 0) {
        handleLocalError(
          "Nenhum arquivo foi importado.\n\n• " + errosEncontrados.join("\n• "),
          "Falha na Importação",
        );
      } else {
        handleLocalError(
          `Foram importados ${arquivosSucesso.length} arquivos, mas ${errosEncontrados.length} falharam:\n\n• ${errosEncontrados.join("\n• ")}`,
          "Importação Parcial",
        );
      }
    }

    setLoading(false);
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
      handleLocalError(
        "Você precisa importar as Ordens de Ajuste (OA) primeiro para criar os slots de comparação.",
        "Fluxo Incorreto",
      );
      return;
    }

    setLoading(true);
    setErroApi(null);

    const identificacoesSucesso: { file: File; dados: any }[] = [];
    const errosDeLeitura: string[] = [];
    const arquivosSemPar: string[] = [];

    await Promise.all(
      novosArquivos.map(async (file) => {
        const formData = new FormData();
        formData.append("arquivos", file);

        try {
          const response = await api.post(
            "/api/processamento/ler-ieds",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );

          const dados = response.data[0];

          if (dados) {
            identificacoesSucesso.push({ file, dados });
          } else {
            errosDeLeitura.push(`${file.name} (Conteúdo não identificado)`);
          }
        } catch (err: any) {
          const msgErro = err.response?.data?.mensagem || "Erro ao ler arquivo";
          errosDeLeitura.push(`${file.name} (${msgErro})`);
        }
      }),
    );

    let algumArquivoAssociado = false;

    setIedSlots((prevSlots) => {
      const newSlots = [...prevSlots];

      identificacoesSucesso.forEach(({ file, dados }) => {
        const slotIndex = newSlots.findIndex((s) => s.nome === dados.rele_tipo);

        if (slotIndex !== -1) {
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            arquivo: file,
          };
          algumArquivoAssociado = true;
        } else {
          arquivosSemPar.push(file.name);
        }
      });

      return newSlots;
    });

    const mensagensDeErro: string[] = [];

    if (errosDeLeitura.length > 0) {
      mensagensDeErro.push(...errosDeLeitura);
    }

    if (arquivosSemPar.length > 0) {
      mensagensDeErro.push(
        arquivosSemPar.length === 1
          ? `O arquivo "${arquivosSemPar[0]}" não tem correspondência nas OAs.`
          : `${arquivosSemPar.length} arquivos não têm correspondência nas OAs.`,
      );
    }

    if (mensagensDeErro.length > 0) {
      if (!algumArquivoAssociado && identificacoesSucesso.length === 0) {
        handleLocalError(
          "Falha completa. Erros:\n\n• " + mensagensDeErro.join("\n• "),
          "Nenhum arquivo importado",
        );
      } else {
        handleLocalError(
          `Importação parcial. \n\n• ${mensagensDeErro.join("\n• ")}`,
          "Atenção",
        );
      }
    } else if (
      !algumArquivoAssociado &&
      identificacoesSucesso.length > 0 &&
      arquivosSemPar.length === 0
    ) {
      handleLocalError(
        "Arquivos processados mas nenhum slot correspondente foi encontrado.",
        "Aviso",
      );
    }

    setLoading(false);
  };

  const handleUpdateIedSlot = async (id: string, file: File) => {
    const slotAlvo = iedSlots.find((s) => s.id === id);
    if (!slotAlvo) return;

    setLoading(true);
    setErroApi(null);

    try {
      const formData = new FormData();
      formData.append("arquivos", file);

      const response = await api.post("/api/processamento/ler-ieds", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const identificacao = response.data[0];

      if (!identificacao) {
        handleLocalError(
          `Não foi possível identificar o tipo de IED no arquivo "${file.name}".`,
          "Arquivo Desconhecido",
        );
        return;
      }

      if (identificacao.rele_tipo !== slotAlvo.nome) {
        handleLocalError(
          `Este slot pede um arquivo sobre "${slotAlvo.nome}", mas o arquivo enviado é "${identificacao.rele_tipo}".`,
          "Arquivo Incorreto",
        );
        return;
      }

      setIedSlots((prev) =>
        prev.map((slot) =>
          slot.id === id ? { ...slot, arquivo: file } : slot,
        ),
      );
    } catch (err: any) {
      if (err.response?.data) {
        const dadosErro = err.response.data as BackendError;
        setErroApi(dadosErro);
      } else {
        setErroApi({
          erro: "NetworkError",
          mensagem: "Erro ao validar o arquivo individual.",
        });
      }
    } finally {
      setLoading(false);
    }
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
      handleLocalError(
        "Nenhum par completo encontrado. Associe pelo menos um arquivo de IED a uma Ordem de Ajuste.",
        "Validação Impossível",
      );
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

      const listaResultados = response.data.resultados || response.data;

      if (Array.isArray(listaResultados)) {
        await Promise.all(
          listaResultados.map(async (resultado: any) => {
            const nameSlot = iedSlots.find(
              (s) => s.nome === resultado.rele_tipo,
            );
            const OAFileName =
              nameSlot?.nomeArquivo || resultado.nome_arquivo_oa;

            const temErro = resultado.lista_parametros.some(
              (p: any) =>
                p.status === "DIVERGENTE" || p.status === "NAO_ENCONTRADO",
            );

            const logData = {
              relay_model: resultado.rele_tipo,
              substation:
                iedSlots.find((s) => s.nome === resultado.rele_tipo)
                  ?.subestacao || "N/A",

              filename_oa: OAFileName,
              filename_ied: resultado.nome_arquivo_ied || "arquivo_ied.txt",

              result_json: resultado.lista_parametros,
              status: temErro ? "Divergente" : "Conforme",

              user_registration: user?.registration || null,
            };

            return api
              .post("/api/logs/", logData)
              .catch((err) =>
                console.error("Erro silencioso ao salvar histórico:", err),
              );
          }),
        );
      }

      setReportResults(response.data);

      navigate("/resultados");
    } catch (err: any) {
      if (err.response?.data) {
        const dadosErro = err.response.data as BackendError;
        setErroApi(dadosErro);
      } else {
        setErroApi({
          erro: "NetworkError",
          mensagem:
            "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
        });
      }
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

      <ErrorBanner error={erroApi} onClose={() => setErroApi(null)} />

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ImportSection
            title="Ordens de Ajuste"
            tipoArquivo="OA"
            arquivosOA={oaFiles}
            onAddFiles={handleAddOaFiles}
            onRemoveFile={handleRemoveOaFile}
            onError={handleLocalError}
          />
          <ImportSection
            title="Dados de Campo (IEDs)"
            tipoArquivo="IED"
            slotsIED={iedSlots}
            onUpdateSlot={handleUpdateIedSlot}
            onRemoveFile={handleRemoveIedFile}
            onAddFiles={handleBatchIedUpload}
            onError={handleLocalError}
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
