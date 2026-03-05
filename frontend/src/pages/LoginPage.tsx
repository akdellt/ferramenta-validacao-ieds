import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import { type BackendError } from "../types/error";
import { type User } from "../types/auth";
import EQ from "../assets/EQ.svg";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [registration, setRegistration] = useState("");
  const [password, setPassword] = useState("");
  const [apiError, setApiError] = useState<BackendError | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setApiError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        registration: registration.toUpperCase(),
        password: password,
      });

      const userData: User = response.data;

      login(userData);
      navigate("/");
    } catch (err: any) {
      setApiError(err as BackendError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-5 flex items-center justify-center">
          <img src={EQ} alt="Logo EQ" className="h-16 w-16 object-contain" />
        </div>

        <h1 className="text-primary text-center text-3xl font-bold tracking-widest uppercase">
          Sistema de Validação IEDs
        </h1>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white p-8 shadow-2xl">
        <h2 className="text-secondary mb-6 text-center text-lg font-semibold tracking-tighter uppercase">
          Acesso Restrito
        </h2>

        {apiError && (
          <div className="mb-4 rounded-md border border-red-100 bg-red-50 p-3 text-center transition-all">
            <p className="text-error text-xs font-black uppercase">
              {apiError.error || "Erro de Login"}
            </p>
            <p className="text-error text-[10px] font-medium">
              {apiError.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-secondary ml-1 text-xs font-bold uppercase">
              Matrícula
            </label>
            <input
              id="registration"
              name="registration"
              type="text"
              autoComplete="username"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              placeholder="Ex: A123"
              disabled={isLoading}
              className="border-eq-border focus:ring-primary/20 text-primary w-full rounded-lg border bg-white p-3 transition-all outline-none focus:ring-2"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-secondary ml-1 text-xs font-bold uppercase">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="border-eq-border focus:ring-primary/20 text-primary w-full rounded-lg border bg-white p-3 transition-all outline-none focus:ring-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-black text-white uppercase shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                ENTRANDO...
              </>
            ) : (
              "ENTRAR NO SISTEMA"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
