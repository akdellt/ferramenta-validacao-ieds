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
      const data = error.response.data as any;

      const errorTitle = data.error || "Erro";
      const errorMessage = data.detail || "Falha na operação";

      console.error(
        `[API ${error.response.status}]: ${errorTitle} - ${errorMessage}`,
      );

      // remover depois
      if (data.detail) {
        console.debug("Detalhes da falha:", data.detail);
      }

      return Promise.reject({
        response: error.response,
        message: errorMessage,
        error: errorTitle,
        isAxiosError: true,
      });
    }

    return Promise.reject(new Error("Erro de rede: Verifique sua conexão."));
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
