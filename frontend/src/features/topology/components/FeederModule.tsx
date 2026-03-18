interface FeederModuleProps {
  x: number;
  y: number;
  name: string;
  isError: boolean;
  spacing: number;
  isLast?: boolean;
  onClick: () => void;
}

export const FeederModule = ({
  x,
  y,
  name,
  isError,
  spacing,
  onClick,
}: FeederModuleProps) => {
  const color = isError ? "var(--color-error)" : "var(--color-eq-primary)";

  const baseStrokeWidth = "3";

  const hoverClass = isError
    ? "cursor-pointer group-hover:stroke-[4px] transition-all duration-200"
    : "pointer-events-none";

  return (
    <g
      onClick={isError ? onClick : undefined}
      style={{ cursor: isError ? "pointer" : "default" }}
      className={isError ? "group" : ""}
      strokeWidth={baseStrokeWidth}
    >
      <line
        x1={x}
        y1={y - spacing / 2}
        x2={x}
        y2={y + spacing / 2}
        stroke="var(--color-eq-primary)"
        strokeWidth="4"
      />

      <line
        x1={x}
        y1={y}
        x2={x + 60}
        y2={y}
        stroke="var(--color-eq-primary)"
        className={hoverClass}
      />

      <rect
        x={x + 60}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={color}
        className={hoverClass}
        onClick={(e) => {
          if (!isError) {
            e.preventDefault();
            return;
          }
          onClick();
        }}
      />

      <text
        x={x + 100}
        y={y + 5}
        stroke="none"
        className="fill-secondary font-mono text-xs"
      >
        {name}
      </text>
    </g>
  );
};
