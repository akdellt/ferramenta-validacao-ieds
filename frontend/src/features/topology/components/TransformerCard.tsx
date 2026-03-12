import { memo } from "react";
import { Plus } from "lucide-react";
import { FeederInput } from "./FeederInput";
import type { Transformer } from "../types";
import DeleteButton from "../../../components/common/DeleteButton";
import Card from "../../../components/common/Card";

interface TransformerCardProps {
  transformer: Transformer;
  index: number;
  onRemove: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onAddFeeder: (id: string) => void;
  onUpdateFeeder: (transfId: string, feederId: string, value: string) => void;
  onRemoveFeeder: (transfId: string, feederId: string) => void;
  isRemovable: boolean;
}

export const TransformerCard = memo(function TransformerCard({
  transformer,
  index,
  onRemove,
  onUpdateName,
  onAddFeeder,
  onUpdateFeeder,
  onRemoveFeeder,
  isRemovable,
}: TransformerCardProps) {
  return (
    <Card className="shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-eq-primary/20 text-eq-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
            {index + 1}
          </div>
          <h2 className="text-eq-primary text-base font-bold tracking-tight uppercase">
            Transformador
          </h2>
        </div>

        {isRemovable && (
          <DeleteButton
            onClick={() => onRemove(transformer.id)}
            size="xg"
            variant="icon"
          />
        )}
      </div>

      <div className="mb-8 flex flex-col gap-3">
        <label className="text-eq-primary text-sm font-semibold uppercase">
          Nome do Componente
        </label>
        <input
          type="text"
          value={transformer.name}
          onChange={(e) => onUpdateName(transformer.id, e.target.value)}
          placeholder="Ex: LAB_11T1"
          className="focus:border-eq-primary border-eq-border focus:ring-eq-primary/20 bg-bg-dashboard text-primary w-full rounded-lg border p-2.5 font-mono text-sm transition-all outline-none placeholder:text-gray-400 focus:ring-2"
        />
      </div>

      <div className="border-eq-border space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <span className="text-eq-primary text-sm font-semibold uppercase">
            Alimentadores Associados
          </span>
          <button
            onClick={() => onAddFeeder(transformer.id)}
            className="text-eq-primary flex items-center gap-1 text-xs font-bold transition-all hover:brightness-75 active:scale-95"
          >
            <Plus size={14} /> ADICIONAR ALIMENTADOR
          </button>
        </div>

        <div className="grid gap-3">
          {transformer.feeders.length === 0 ? (
            <p className="text-secondary py-4 text-center text-sm">
              Nenhum alimentador adicionado.
            </p>
          ) : (
            transformer.feeders.map((feeder) => (
              <FeederInput
                key={feeder.id}
                feeder={feeder}
                onUpdate={(feederId, val) =>
                  onUpdateFeeder(transformer.id, feederId, val)
                }
                onRemove={(feederId) =>
                  onRemoveFeeder(transformer.id, feederId)
                }
              />
            ))
          )}
        </div>
      </div>
    </Card>
  );
});
