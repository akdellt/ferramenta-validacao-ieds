import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { useValidation } from "../../../context/ValidationContext";
import type { BackendError } from "../../../types/error";
import { getTopologyHelpers, type ErrorDetail } from "../types";

export function useTopologySubmission() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<BackendError | null>(null);

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [consistencyErrors, setConsistencyErrors] = useState<ErrorDetail[]>([]);

  const [isSuccess, setIsSuccess] = useState(false);

  const {
    transformers,
    topologyType,
    scdFile,
    setTopologyReport,
    setTransformers,
    setIsLoading: setGlobalLoading,
  } = useValidation();

  const validateLocal = (): boolean => {
    const { isParallel, isCommonBus } = getTopologyHelpers(topologyType);

    const transformerNames = transformers.map((t) =>
      t.name.trim().toUpperCase(),
    );

    const hasDuplicateTransformers = transformerNames.some(
      (name, index) => transformerNames.indexOf(name) !== index && name !== "",
    );

    if (hasDuplicateTransformers) {
      handleLocalError("Existem transformadores com nomes duplicados.");
      return false;
    }

    if (isCommonBus) {
      const hasLocalDuplicates = transformers.some((t) => {
        const names = t.feeders
          .map((f) => f.name.trim().toUpperCase())
          .filter((n) => n !== "");
        return names.some((name, index) => names.indexOf(name) !== index);
      });

      if (hasLocalDuplicates) {
        handleLocalError(
          "Um transformador não pode ter dois alimentadores com o mesmo nome.",
        );
        return false;
      }
    } else if (!isParallel) {
      const allFeederNames = transformers
        .flatMap((t) => t.feeders.map((f) => f.name.trim().toUpperCase()))
        .filter((name) => name !== "");

      const hasGlobalDuplicates = allFeederNames.some(
        (name, index) => allFeederNames.indexOf(name) !== index,
      );

      if (hasGlobalDuplicates) {
        handleLocalError(
          "Na seletividade independente, cada alimentador deve ter um nome exclusivo.",
        );
        return false;
      }
    }

    const isNamesValid = transformers.every((t) => t.name.trim() !== "");
    if (!topologyType || !isNamesValid || !scdFile) {
      handleLocalError("Preencha todos os campos e selecione o arquivo SCD.");
      return false;
    }

    if (isParallel && transformers.length < 2) {
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
      detail: title,
    });
  };

  const submit = async () => {
    if (!validateLocal()) return;

    setIsLoading(true);
    setGlobalLoading(true);
    setApiError(null);
    setIsSuccess(false);

    try {
      const formData = new FormData();
      if (scdFile) formData.append("file", scdFile);

      const mapping: Record<string, string[]> = {};
      transformers.forEach((t) => {
        mapping[t.name] = t.feeders.map((f) => f.name);
      });

      const uniqueFeederNames = new Set(
        transformers.flatMap((t) =>
          t.feeders.map((f) => f.name.trim().toUpperCase()),
        ),
      );

      const formPayload = {
        expected_topology: topologyType,
        transformer_count: transformers.length,
        feeder_count: uniqueFeederNames.size,
        expected_mapping: mapping,
      };

      formData.append("form_data", JSON.stringify(formPayload));

      const response = await api.post("/topology/validate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const report = response.data;

      const hasConsistency =
        report.consistency_errors && report.consistency_errors.length > 0;
      const hasCommunication =
        report.communication_errors && report.communication_errors.length > 0;
      const hasLogic = report.logic_errors && report.logic_errors.length > 0;

      const isAbsoluteSuccess =
        !hasConsistency && !hasCommunication && !hasLogic;

      if (isAbsoluteSuccess) {
        setTopologyReport(report);
        setTransformers(transformers);
        setConsistencyErrors([]);
        setIsSuccess(true);
        setIsErrorModalOpen(true);
        return;
      }

      if (hasConsistency) {
        setConsistencyErrors(report.consistency_errors);
        setIsSuccess(false);
        setIsErrorModalOpen(true);
      } else {
        setTopologyReport(report);
        setTransformers(transformers);
        navigate("/circuits");
      }
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

  return {
    submit,
    isLoading,
    apiError,
    setApiError,
    handleLocalError,
    isErrorModalOpen,
    setIsErrorModalOpen,
    consistencyErrors,
    isSuccess,
  };
}
