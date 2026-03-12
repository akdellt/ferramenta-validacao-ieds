import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  children: React.ReactNode;
}

export function Button({
  isLoading,
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "flex items-center justify-center gap-2 rounded-lg text-sm font-bold tracking-wider shadow-lg transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70";

  const variants = {
    primary:
      "px-12 py-3 bg-eq-primary text-white hover:bg-eq-primary/90 active:scale-95 disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0",
    secondary:
      "px-12 py-3 bg-eq-secondary text-white hover:bg-eq-secondary/90 active:scale-95",
    outline:
      "border-2 border-eq-secondary text-eq-secondary bg-transparent font-medium hover:bg-eq-secondary hover:text-white active:scale-95",
    danger: "px-12 py-3 bg-error text-white hover:bg-error/90",
  };

  const spinnerColor =
    variant === "outline" ? "border-eq-secondary" : "border-white";

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <div
            className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${spinnerColor}`}
          />
          <span>PROCESSANDO...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
