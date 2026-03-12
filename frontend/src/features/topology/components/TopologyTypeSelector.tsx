import { Info } from "lucide-react";

interface TopologyTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TopologyTypeSelector({
  value,
  onChange,
}: TopologyTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center">
        <h2 className="text-eq-primary text-base font-bold tracking-tight uppercase">
          Selecione Topologia
        </h2>
      </div>

      <div className="group relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-bg-dashboard w-full cursor-pointer appearance-none rounded-lg border p-3 font-sans text-sm font-medium transition-all outline-none ${
            value
              ? "border-eq-primary text-primary focus:ring-eq-primary/10 focus:ring-2"
              : "border-eq-border text-text-muted hover:border-eq-secondary"
          } `}
        >
          <option value="" disabled>
            Selecione a configuração técnica
          </option>
          <option value="Seletividade Lógica Independente">
            Seletividade Lógica Independente
          </option>
          <option value="Seletividade Lógica com Barra Comum">
            Seletividade Lógica com Barra Comum
          </option>
          <option value="Paralelismo">Paralelismo</option>
        </select>

        <div className="text-eq-primary pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {value && (
        <div className="animate-in fade-in zoom-in-95 flex items-start gap-2 rounded-md bg-blue-50/50 p-3 duration-300">
          <Info size={14} className="text-eq-secondary mt-0.5 shrink-0" />
          <p className="text-secondary text-xs leading-relaxed italic">
            {value === "Paralelismo" &&
              "Requer a configuração de pelo menos 2 transformadores."}
            {value === "Seletividade Lógica Independente" &&
              "Alimentadores devem ser únicos para cada Transformador."}
            {value === "Seletividade Lógica com Barra Comum" &&
              "Adicione os mesmos nomes de Alimentadores para cada Transformador."}
          </p>
        </div>
      )}
    </div>
  );
}
