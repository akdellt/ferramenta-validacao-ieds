interface TransformerBayProps {
  x: number;
  y: number;
  name: string;
  isError: boolean;
  relayModel: string;
  onClick: () => void;
}

export const TransformerBay = ({
  x,
  y,
  name,
  isError,
  onClick,
}: TransformerBayProps) => {
  const color = isError ? "var(--color-error)" : "var(--color-eq-primary)";

  const baseStrokeWidth = "3";

  const hoverClass = isError
    ? "cursor-pointer group-hover:stroke-[4px] transition-all duration-200"
    : "pointer-events-none";

  return (
    <g
      className={isError ? "group" : ""}
      onClick={isError ? onClick : undefined}
      style={{ cursor: isError ? "pointer" : "default" }}
      stroke={color}
      strokeWidth={baseStrokeWidth}
    >
      <line
        x1={x}
        y1={y}
        x2={x + 80}
        y2={y}
        stroke="var(--color-eq-primary)"
        className={hoverClass}
      />

      <rect
        x={x + 80}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={color}
        className={hoverClass}
      />
      <line
        x1={x + 110}
        y1={y}
        x2={x + 160}
        y2={y}
        stroke="var(--color-eq-primary)"
        className={hoverClass}
      />

      <g className={isError ? "cursor-pointer" : ""}>
        <circle
          cx={x + 180}
          cy={y}
          r="20"
          fill="transparent"
          stroke={color}
          className={`transition-all duration-200 ${
            isError ? "group-hover:stroke-[4px]" : ""
          }`}
        />
        <circle
          cx={x + 205}
          cy={y}
          r="20"
          fill="transparent"
          stroke={color}
          className={`transition-all duration-200 ${
            isError ? "group-hover:stroke-[4px]" : ""
          }`}
        />
        <text
          x={x + 192.5}
          y={y - 35}
          stroke="none"
          textAnchor="middle"
          className="fill-secondary text-xs font-bold select-none"
        >
          {name}
        </text>
      </g>

      <line
        x1={x + 225}
        y1={y}
        x2={x + 280}
        y2={y}
        stroke="var(--color-eq-primary)"
        className={hoverClass}
      />
      <rect
        x={x + 280}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={color}
        className={hoverClass}
      />

      <line
        x1={x + 310}
        y1={y}
        x2={x + 360}
        y2={y}
        stroke="var(--color-eq-primary)"
        className={hoverClass}
      />
    </g>
  );
};
