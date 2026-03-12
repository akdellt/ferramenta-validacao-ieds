import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useValidation } from "../../../context/ValidationContext";
import type { BackendError } from "../../../types/error";

export function useTopologySubmission() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<BackendError | null>(null);

  const {
    transformers,
    topologyType,
    scdFile,
    setTopologyReport,
    setTransformers,
    setIsLoading: setGlobalLoading,
  } = useValidation();

  const validateLocal = (): boolean => {
    const isNamesValid = transformers.every((t) => t.name.trim() !== "");
    const names = transformers.map((t) => t.name.trim().toUpperCase());
    const hasDuplicates = names.some(
      (name, index) => names.indexOf(name) !== index,
    );

    if (hasDuplicates) {
      handleLocalError("Existem transformadores com nomes duplicados.");
      return false;
    }

    if (!topologyType || !isNamesValid || !scdFile) {
      handleLocalError("Preencha todos os campos e selecione o arquivo SCD.");
      return false;
    }

    if (topologyType === "Paralelismo" && transformers.length < 2) {
      handleLocalError(
        "Para operação em Paralelismo, configure no mínimo 2 transformadores.",
        "Restrição Técnica",
      );
      return false;
    }

    return true;
  };

  const handleLocalError = (
    msg: string,
    title: string = "Erro de Validação",
  ) => {
    setApiError({
      error: "ValidationError",
      message: msg,
      details: title,
    });
  };

  const submit = async () => {
    if (!validateLocal()) return;

    setIsLoading(true);
    setGlobalLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      if (scdFile) formData.append("file", scdFile);

      const mapping: Record<string, string[]> = {};
      transformers.forEach((t) => {
        mapping[t.name] = t.feeders.map((f) => f.name);
      });

      const formPayload = {
        expected_topology: topologyType,
        transformer_count: transformers.length,
        feeder_count: transformers.reduce(
          (acc, t) => acc + t.feeders.length,
          0,
        ),
        expected_mapping: mapping,
      };

      formData.append("form_data", JSON.stringify(formPayload));

      const response = await api.post("/topology/validate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTopologyReport(response.data);
      setTransformers(transformers);

      navigate("/circuits");
    } catch (err: any) {
      setApiError(
        err.response?.data || {
          error: "NetworkError",
          message: "Falha na comunicação com o servidor.",
        },
      );
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  return { submit, isLoading, apiError, setApiError };
}
