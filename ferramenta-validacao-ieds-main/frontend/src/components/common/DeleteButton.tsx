import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "outlined";
  className?: string;
}

function DeleteButton({
  onClick,
  size = "md",
  variant = "outlined",
  className = "",
}: DeleteButtonProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const baseClasses =
    variant === "outlined"
      ? "flex cursor-pointer shrink-0 items-center justify-center rounded-full border border-gray-200 text-eq-secondary transition-all hover:border-red-300 hover:bg-red-50 hover:text-error"
      : "flex cursor-pointer shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-error";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      title="Remover arquivo"
      aria-label="Remover arquivo"
    >
      <Trash2 size={iconSizes[size]} strokeWidth={2} />
    </button>
  );
}

export default DeleteButton;
