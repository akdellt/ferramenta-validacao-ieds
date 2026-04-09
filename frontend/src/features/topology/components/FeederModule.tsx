interface FeederModuleProps {
  x: number;
  y: number;
  name: string;
  isError: boolean;
  spacing: number;
  isLast?: boolean;
  onClick: () => void;
  isLineError?: boolean;
  onLineClick?: () => void;
}

export const FeederModule = ({
  x,
  y,
  name,
  isError,
  spacing,
  onClick,
  isLineError,
  onLineClick,
}: FeederModuleProps) => {
  const iedColor = isError ? "var(--color-error)" : "var(--color-eq-primary)";
  const lineColor = isLineError
    ? "var(--color-error)"
    : "var(--color-eq-primary)";

  const baseStrokeWidth = "3";

  return (
    <g strokeWidth={baseStrokeWidth}>
      <line
        x1={x}
        y1={y - spacing / 2}
        x2={x}
        y2={y + spacing / 2}
        stroke="var(--color-eq-primary)"
        strokeWidth="4"
      />

      <g
        onClick={(e) => {
          e.stopPropagation();
          if (isLineError && onLineClick) onLineClick();
        }}
        className={
          isLineError ? "group/line cursor-pointer" : "pointer-events-none"
        }
      >
        <line
          x1={x + 2}
          y1={y}
          x2={x + 60}
          y2={y}
          stroke="transparent"
          strokeWidth="20"
        />

        <line
          x1={x + 2}
          y1={y}
          x2={x + 60}
          y2={y}
          stroke={lineColor}
          className={`${isLineError ? "cursor-pointer transition-all duration-200 group-hover/line:stroke-[4px]" : ""}`}
        />
      </g>

      <rect
        x={x + 60}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={iedColor}
        className={`${isError ? "cursor-pointer transition-all duration-200 hover:stroke-[4px]" : "pointer-events-none"}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isError) onClick();
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
