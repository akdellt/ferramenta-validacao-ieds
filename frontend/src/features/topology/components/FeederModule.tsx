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

  return (
    <g>
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
        strokeWidth="2"
      />

      <rect
        x={x + 60}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={color}
        strokeWidth="2"
        className={
          isError ? "cursor-pointer hover:stroke-[3px]" : "cursor-default"
        }
        onClick={(e) => {
          if (!isError) {
            e.preventDefault();
            return;
          }
          onClick();
        }}
      />

      <text x={x + 100} y={y + 5} className="fill-secondary font-mono text-xs">
        {name}
      </text>
    </g>
  );
};
