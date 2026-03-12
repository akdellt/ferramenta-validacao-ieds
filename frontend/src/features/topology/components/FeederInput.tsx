import DeleteButton from "../../../components/common/DeleteButton";
import type { Feeder } from "../types";

interface FeederInputProps {
  feeder: Feeder;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}

export function FeederInput({ feeder, onUpdate, onRemove }: FeederInputProps) {
  return (
    <div className="group animate-in fade-in slide-in-from-left-2 flex items-center gap-2 duration-200">
      <input
        type="text"
        value={feeder.name}
        onChange={(e) => onUpdate(feeder.id, e.target.value)}
        className="focus:border-eq-primary border-eq-border focus:ring-eq-primary/20 bg-bg-dashboard text-primary w-full rounded-lg border p-2.5 font-mono text-sm transition-all outline-none placeholder:text-gray-400 focus:ring-2"
        placeholder="Nome do Alimentador (Ex: LAB_21Y1)"
      />

      <DeleteButton
        onClick={() => onRemove(feeder.id)}
        size="lg"
        variant="icon"
      />
    </div>
  );
}
