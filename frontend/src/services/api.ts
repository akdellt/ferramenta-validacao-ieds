import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let mensagemErro = "Ocorreu um erro inesperado.";

    if (error.response) {
      mensagemErro = error.response.data?.detail || error.message;

      console.error(`Erro API [${error.response.status}]:`, mensagemErro);
    } else if (error.request) {
      mensagemErro = "Não foi possível conectar ao servidor.";
    }

    return Promise.reject(new Error(mensagemErro));
  },
);
