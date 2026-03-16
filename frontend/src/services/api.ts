import axios, { AxiosError } from "axios";
import type { BackendError } from "../types/error";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendError>) => {
    if (error.response && error.response.data) {
      const data = error.response.data;

      const errorTitle = data.error || "Erro";
      const errorMessage = data.message || data.details || "Falha na operação";

      console.error(
        `[API ${error.response.status}]: ${errorTitle} - ${errorMessage}`,
      );

      // remover depois
      if (data.details) {
        console.debug("Detalhes da falha:", data.details);
      }

      return Promise.reject({
        error: errorTitle,
        message: errorMessage,
        details: data.details,
      });
    }

    const networkError: BackendError = {
      error: "NetworkError",
      message:
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
      path: error.config?.url,
    };

    return Promise.reject(networkError);
  },
);

export const iedService = {
  getAllIeds: async () => {
    const response = await api.get("/relays/network-ieds");
    return response.data;
  },
};

export const networkService = {
  fetchIedData: async (iedName: string) => {
    const response = await api.get(`/relays/search-network/${iedName}`);
    return response.data;
  },
};
