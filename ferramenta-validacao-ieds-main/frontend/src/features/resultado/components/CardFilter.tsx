import { FileText, CheckCircle, AlertCircle } from "lucide-react";

interface CardFilterProps {
  activeFilter: "total" | "conforme" | "divergente";
  onFilterChange: (filtro: "total" | "conforme" | "divergente") => void;
  counts: {
    total: number;
    conforme: number;
    divergente: number;
  };
}

function CardFilter({ activeFilter, onFilterChange, counts }: CardFilterProps) {
  const baseClass =
    "border-eq-border hover:bg-bg-dashboard flex h-12 min-w-fit flex-1 cursor-pointer items-center justify-center gap-3 border border-r-0 px-4 whitespace-nowrap transition-all duration-200 first:rounded-tl-lg last:rounded-tr-lg last:border-r";

  return (
    <div className="flex items-center">
      <button
        onClick={() => onFilterChange("total")}
        className={`${baseClass} ${
          activeFilter === "total"
            ? "bg-eq-secondary border-eq-primary hover:bg-eq-primary text-white shadow-md"
            : "border-eq-border text-secondary hover:bg-bg-dashboard bg-white"
        }`}
      >
        <FileText
          size={20}
          className={
            activeFilter === "total" ? "text-white" : "text-eq-secondary"
          }
        />
        <span className="font-bold">TOTAL: {counts.total}</span>
      </button>

      <button
        onClick={() => onFilterChange("conforme")}
        className={`${baseClass} ${
          activeFilter === "conforme"
            ? "bg-success border-success/70 hover:bg-success/70 text-white shadow-md"
            : "border-eq-border text-secondary hover:bg-bg-dashboard bg-white"
        }`}
      >
        <CheckCircle
          size={20}
          className={
            activeFilter === "conforme" ? "text-white" : "text-success"
          }
        />
        <span className="font-bold">CONFORME: {counts.conforme}</span>
      </button>

      <button
        onClick={() => onFilterChange("divergente")}
        className={`${baseClass} ${
          activeFilter === "divergente"
            ? "bg-error border-error/70 hover:bg-error/70 text-white shadow-md"
            : "border-eq-border text-secondary hover:bg-bg-dashboard bg-white"
        }`}
      >
        <AlertCircle
          size={20}
          className={
            activeFilter === "divergente" ? "text-white" : "text-error"
          }
        />
        <span className="font-bold">DIVERGENTE: {counts.divergente}</span>
      </button>
    </div>
  );
}

export default CardFilter;
