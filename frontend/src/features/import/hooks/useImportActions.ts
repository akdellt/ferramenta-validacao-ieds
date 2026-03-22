import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api, iedService } from "../../../services/api";
import { useValidation } from "../../../context/ValidationContext";
import { type BackendError } from "../../../types/error";
import type { ValidationResult } from "../../../types/parameters";
import type { IedSlotData } from "../../../types/parameters";
import { performIedMatch } from "../../../features/import/iedMatcher";
import { networkService } from "../../../services/api";

export function useImportActions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { oaFiles, setOaFiles, iedSlots, setIedSlots, setReportResults } =
    useValidation();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<BackendError | null>(null);
  const [dbIeds, setDbIeds] = useState<any[]>([]);

  useEffect(() => {
    iedService
      .getAllIeds()
      .then((data) => setDbIeds(data))
      .catch((err) => console.error("Erro ao carregar banco", err));
  }, []);

  const handleLocalError = (
    message: string,
    title: string = "Arquivo Inválido",
  ) => {
    setApiError({
      error: "ValidationError",
      message: message,
      details: title,
    });
  };

  const handleAddOaFiles = async (newFiles: File[]) => {
    setLoading(true);
    setApiError(null);

    const successFiles: File[] = [];
    const successSlots: IedSlotData[] = [];
    const foundErrors: string[] = [];

    await Promise.all(
      newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("files", file);

        try {
          const response = await api.post("/relays/read-oa", formData);

          const slotsFromFile = performIedMatch(
            response.data,
            dbIeds,
            file.name,
          );

          successSlots.push(...slotsFromFile);
          successFiles.push(file);
        } catch (err: any) {
          const msgError = err.message || "Formato inválido";
          foundErrors.push(`${file.name} (${msgError})`);
        }
      }),
    );

    if (successFiles.length > 0) {
      setOaFiles((prev) => [...prev, ...successFiles]);
      setIedSlots((prev) => [...prev, ...successSlots]);
    }

    if (foundErrors.length > 0) {
      const summary =
        successFiles.length === 0
          ? `Falha na Importação: ${foundErrors.join("; ")}`
          : `Importação Parcial: ${foundErrors.length} erro(s).`;
      handleLocalError(summary, "Aviso de Processamento");
    }

    setLoading(false);
  };

  const handleRemoveOaFile = (index: number | string) => {
    if (typeof index === "number") {
      const removedFile = oaFiles[index];

      setOaFiles((prev) => prev.filter((_, i) => i !== index));

      setIedSlots((prev) =>
        prev.filter((slot) => slot.filename_oa !== removedFile.name),
      );
    }

    if (oaFiles.length <= 1) {
      setIedSlots([]);
    }
  };

  const handleBatchIedUpload = async (newFiles: File[]) => {
    if (iedSlots.length === 0) {
      handleLocalError(
        "Você precisa importar as Ordens de Ajuste (OA) primeiro para criar os slots de comparação.",
        "Fluxo Incorreto",
      );
      return;
    }

    setLoading(true);
    setApiError(null);

    const successfulIdentifications: { file: File; data: any }[] = [];
    const readErrors: string[] = [];
    const unmatchedFiles: string[] = [];
    const alreadyFilledFiles: string[] = [];

    await Promise.all(
      newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("files", file);

        try {
          const response = await api.post("/relays/read-ied", formData);

          const data = response.data[0];

          if (data) {
            successfulIdentifications.push({ file, data });
          } else {
            readErrors.push(`${file.name} (Conteúdo não identificado)`);
          }
        } catch (err: any) {
          const msgError = err.message || "Erro ao ler arquivo";
          readErrors.push(`${file.name} (${msgError})`);
        }
      }),
    );

    let anyFileAssociated = false;

    setIedSlots((prevSlots) => {
      const newSlots = [...prevSlots];

      successfulIdentifications.forEach(({ file, data }) => {
        const slotIndex = newSlots.findIndex(
          (s) => s.relay_model === data.relay_model,
        );

        if (slotIndex !== -1) {
          if (newSlots[slotIndex].file === null) {
            const fileWithData = {
              name: file.name,
              size: file.size,
              parameters: data.parameters,
              relay_model: data.relay_model,
            };

            newSlots[slotIndex] = {
              ...newSlots[slotIndex],
              file: fileWithData as any,
            };
            anyFileAssociated = true;
          } else {
            alreadyFilledFiles.push(file.name);
          }
        } else {
          unmatchedFiles.push(file.name);
        }
      });

      return newSlots;
    });

    const feedbackMessages: string[] = [...readErrors];

    if (alreadyFilledFiles.length > 0) {
      feedbackMessages.push(
        alreadyFilledFiles.length === 1
          ? `O arquivo "${alreadyFilledFiles[0]}" foi ignorado pois slot já está preenchido.`
          : `Os arquivos [${alreadyFilledFiles.join(", ")}] foram ignorados pois slots já estão preenchidos.`,
      );
    }

    if (unmatchedFiles.length > 0) {
      feedbackMessages.push(
        unmatchedFiles.length === 1
          ? `O arquivo "${unmatchedFiles[0]}" não corresponde a nenhum IED das OAs.`
          : `${unmatchedFiles.length} arquivos não têm correspondência nas OAs.`,
      );
    }

    if (feedbackMessages.length > 0) {
      const title = anyFileAssociated
        ? "Importação Parcial"
        : "Nenhum arquivo importado";
      handleLocalError(feedbackMessages.join("\n• "), title);
    }

    setLoading(false);
  };

  const handleUpdateIedSlot = async (
    id: string,
    payload: File | string | string[],
  ) => {
    setApiError(null);

    if (id === "BATCH_SEARCH") {
      const idsParaBuscar = payload as string[];
      setLoading(true);

      try {
        let slotsAtualizados = [...iedSlots];

        for (const slotId of idsParaBuscar) {
          const slot = slotsAtualizados.find((s) => s.id === slotId);
          if (slot?.name && !slot.file) {
            try {
              const networkData = await networkService.fetchIedData(slot.name);

              const virtualFile = {
                ...networkData,
                name: networkData.filename || "set_1.txt",
                size: 1024,
                isNetwork: true,
              };

              slotsAtualizados = slotsAtualizados.map((s) =>
                s.id === slotId ? { ...s, file: virtualFile } : s,
              );
            } catch (err) {
              console.error(`Falha no IED ${slot.relay_model}`, err);
              handleLocalError(
                `Não foi possível conectar ao relé ${slot.relay_model}. Verifique o IP.`,
                "Erro de Rede",
              );
            }
          }
        }

        setIedSlots(slotsAtualizados);
      } catch (err: any) {
        setApiError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    const targetSlot = iedSlots.find((s) => s.id === id);
    if (!targetSlot || targetSlot.file) return;

    setLoading(true);
    try {
      if (payload === "TRIGGER_NETWORK_SEARCH") {
        if (!targetSlot.name) return;
        const response = await networkService.fetchIedData(targetSlot.name);

        const virtualFile = {
          ...response,
          name: response.filename || "set_1.txt",
          size: 1024,
          isNetwork: true,
        };

        setIedSlots((prev) =>
          prev.map((slot) =>
            slot.id === id ? { ...slot, file: virtualFile } : slot,
          ),
        );
      } else {
        const file = payload as File;
        const formData = new FormData();
        formData.append("files", file);

        const response = await api.post("/relays/read-ied", formData);
        const identification = response.data[0];

        if (
          !identification ||
          identification.relay_model !== targetSlot.relay_model
        ) {
          handleLocalError(
            `Incompatibilidade de modelo ou arquivo inválido.`,
            "Erro de Validação",
          );
          return;
        }

        const fileWithParameters = {
          name: file.name,
          size: file.size,
          parameters: identification.parameters,
          relay_model: identification.relay_model,
        };

        setIedSlots((prev) =>
          prev.map((slot) =>
            slot.id === id
              ? { ...slot, file: fileWithParameters as any }
              : slot,
          ),
        );
      }
    } catch (err: any) {
      setApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIedFile = (id: string | number) => {
    if (typeof id === "string") {
      setIedSlots((prev) =>
        prev.map((slot) => (slot.id === id ? { ...slot, file: null } : slot)),
      );
    }
  };

  const handleVerify = async () => {
    const filledSlots = iedSlots.filter((s) => s.file !== null);

    if (filledSlots.length === 0) {
      handleLocalError(
        "Associe pelo menos um arquivo de IED a uma Ordem de Ajuste.",
        "Ação Necessária",
      );
      return;
    }

    setLoading(true);

    const formData = new FormData();
    const iedDataPayload: any[] = [];

    filledSlots.forEach((slot) => {
      const iedFile = slot.file as any;
      const oaFile = oaFiles.find((f) => f.name === slot.filename_oa);

      if (oaFile && iedFile) {
        formData.append("oa_list", oaFile);

        iedDataPayload.push({
          filename: iedFile.name || "rede_ied.txt",
          relay_model: slot.relay_model,
          parameters: iedFile.parameters || [],
        });
      }
    });

    formData.append("ied_data", JSON.stringify(iedDataPayload));

    try {
      const response = await api.post("/relays/validate-pairs", formData);
      const results = (response.data.results ||
        response.data) as ValidationResult[];

      if (Array.isArray(results)) {
        await Promise.all(
          results.map(async (result: ValidationResult) => {
            const nameSlot = iedSlots.find(
              (s) => s.relay_model === result.relay_model,
            );

            const logEntry = {
              substation: nameSlot?.substation || "N/A",
              relay_model: result.relay_model,
              filename_oa: nameSlot?.filename_oa || "desconhecido.xlsx",
              filename_ied: nameSlot?.file?.name || "desconhecido.txt",
              status: result.status || "Divergente",
              user_registration: user?.registration || "A111",
              result_json: result.parameters_list || [],
            };
            return api.post("/logs/", logEntry).catch(() => {});
          }),
        );
      }

      setReportResults(response.data);

      navigate("/results");
    } catch (err: any) {
      setLoading(false);
      setTimeout(() => {
        setApiError(err as BackendError);
      }, 10);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    apiError,
    setApiError,
    oaFiles,
    iedSlots,
    handleLocalError,
    handleAddOaFiles,
    handleVerify,
    handleRemoveOaFile,
    handleBatchIedUpload,
    handleUpdateIedSlot,
    handleRemoveIedFile,
  };
}
