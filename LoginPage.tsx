import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EQ from "../assets/EQ.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z]\d+$/.test(matricula)) {
      setError("Matrícula inválida (Ex: A123).");
      return;
    }
    navigate("/"); 
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden px-4">
      
      {/* Container do Logo e Título */}
      <div className="mb-8 flex flex-col items-center">
        
        {/* 2. Logo reativado e centralizado */}
        <div className="mb-5 flex items-center justify-center">
          <img 
            src={EQ} 
            alt="Logo EQ" 
            className="h-16 w-16 object-contain" 
            onError={(e) => {
              // Se a imagem falhar, mostra o texto para não ficar vazio
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-bold text-3xl">EQ</span>';
            }}
          />
        </div>

        <h1 className="text-white text-center text-3xl font-bold tracking-widest uppercase">
          Sistema de Validação IEDs
        </h1>
      </div>

      {/* Card do Formulário */}
      <div className="bg-white w-full max-w-sm rounded-xl p-8 shadow-2xl border border-white/20">
        <h2 className="text-secondary mb-6 text-center text-lg font-semibold uppercase tracking-tighter">
          Acesso Restrito
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-2 text-center text-xs font-bold text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-xs font-bold uppercase ml-1">
              Matrícula
            </label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Digite sua matrícula"
              className="w-full rounded-lg border border-eq-border bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-xs font-bold uppercase ml-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-eq-border bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-primary mt-4 w-full rounded-lg py-3 text-sm font-black text-white hover:brightness-110 active:scale-95 transition-all shadow-lg uppercase"
          >
            ENTRAR NO SISTEMA
          </button>
        </form>
      </div>

      <footer className="mt-8 text-[10px] font-medium text-white/40 uppercase tracking-[0.2em]">
        &copy; 2026 Engenharia e Proteção
      </footer>
    </div>
  );
}
