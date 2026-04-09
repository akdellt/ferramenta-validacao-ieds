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
    if (error.response?.status === 504 || error.code === "ECONNABORTED") {
      return Promise.reject({
        message: "O IED demorou muito para responder (Timeout de Rede).",
        error: "Timeout",
        isAxiosError: true,
      });
    }

    if (error.response?.data) {
      const data = error.response.data as any;

      return Promise.reject({
        response: error.response,
        message: data.detail || "Falha na operação",
        error: data.error || "Erro",
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
    const response = await api.get(`/relays/search-network/${iedName}`, {
      timeout: 90000,
    });
    return response.data;
  },
};

export const inventoryService = {
  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/inventory/import", formData);

    return response.data;
  },
};
