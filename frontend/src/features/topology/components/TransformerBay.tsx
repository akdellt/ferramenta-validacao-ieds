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
  const mainColor = isError ? "var(--color-error)" : "var(--color-eq-primary)";

  const hoverClass = isError
    ? "cursor-pointer group-hover:stroke-[3px] transition-all duration-200"
    : "pointer-events-none";

  return (
    <g
      className={isError ? "group" : ""}
      onClick={isError ? onClick : undefined}
      style={{ cursor: isError ? "pointer" : "default" }}
    >
      <line
        x1={x}
        y1={y}
        x2={x + 80}
        y2={y}
        stroke="var(--color-eq-primary)"
        strokeWidth="2"
        className={hoverClass}
      />

      <rect
        x={x + 80}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={mainColor}
        strokeWidth="2"
        className={hoverClass}
      />
      <line
        x1={x + 110}
        y1={y}
        x2={x + 160}
        y2={y}
        stroke="var(--color-eq-primary)"
        strokeWidth="2"
        className={hoverClass}
      />

      <g className={isError ? "cursor-pointer" : ""}>
        <circle
          cx={x + 180}
          cy={y}
          r="20"
          fill="transparent"
          stroke={mainColor}
          className={`stroke-[2px] transition-all duration-200 ${
            isError ? "group-hover:stroke-[3px]" : ""
          }`}
        />
        <circle
          cx={x + 205}
          cy={y}
          r="20"
          fill="transparent"
          stroke={mainColor}
          className={`stroke-[2px] transition-all duration-200 ${
            isError ? "group-hover:stroke-[3px]" : ""
          }`}
        />
        <text
          x={x + 175}
          y={y - 35}
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
        strokeWidth="2"
        className={hoverClass}
      />
      <rect
        x={x + 280}
        y={y - 15}
        width="30"
        height="30"
        fill="white"
        stroke={mainColor}
        strokeWidth="2"
        className={hoverClass}
      />

      <line
        x1={x + 310}
        y1={y}
        x2={x + 360}
        y2={y}
        stroke="var(--color-eq-primary)"
        strokeWidth="2"
        className={hoverClass}
      />
    </g>
  );
};
