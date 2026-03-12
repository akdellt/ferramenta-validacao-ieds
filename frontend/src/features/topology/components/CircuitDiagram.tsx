import { TransformerBay } from "./TransformerBay";
import { FeederModule } from "./FeederModule";
import type { TopologyType, Transformer } from "../types";

interface CircuitDiagramProps {
  transformers: Transformer[];
  errors: string[];
  topologyType: TopologyType;
  onComponentClick: (name: string) => void;
}

export const CircuitDiagram = ({
  transformers,
  errors,
  topologyType,
  onComponentClick,
}: CircuitDiagramProps) => {
  const isCommonBus = topologyType === "Seletividade Lógica com Barra Comum";
  const isParallelism = topologyType === "Paralelismo";
  const isIndependent = topologyType === "Seletividade Lógica Independente";

  const feederSpacing = 70;
  const xAnchor = 40;
  const xBusSecundario = 400;
  const feederWidth = 200;

  const dynamicWidth =
    isIndependent || isCommonBus
      ? xBusSecundario + feederWidth + 40
      : xBusSecundario + 60;

  const bayGap = isIndependent ? 15 : 0;

  const allFeeders = transformers.flatMap((t) => t.feeders);
  const uniqueFeeders = isCommonBus
    ? allFeeders.filter(
        (f, i, self) => self.findIndex((t) => t.name === f.name) === i,
      )
    : [];

  let totalHeight = 100;
  if (isCommonBus) {
    totalHeight =
      100 +
      Math.max(transformers.length * 120, uniqueFeeders.length * feederSpacing);
  } else if (isParallelism) {
    totalHeight = 100 + transformers.length * 150;
  } else {
    totalHeight = transformers.reduce(
      (acc, tr) =>
        acc + Math.max(120, tr.feeders.length * feederSpacing) + bayGap,
      100,
    );
  }

  let currentY = 50;

  return (
    <svg
      height={totalHeight}
      viewBox={`0 0 ${dynamicWidth} ${totalHeight}`}
      className="mx-auto block h-auto w-full max-w-4xl"
    >
      <line
        x1={xAnchor}
        y1={50}
        x2={xAnchor}
        y2={totalHeight - 50}
        stroke="var(--color-eq-primary)"
        strokeWidth="4"
      />

      {isParallelism && (
        <line
          x1={xBusSecundario}
          y1={50}
          x2={xBusSecundario}
          y2={totalHeight - 50}
          stroke="var(--color-eq-primary)"
          strokeWidth="4"
        />
      )}

      {transformers.map((tr) => {
        const feedersHeight = tr.feeders.length * feederSpacing;
        let bayHeight = isIndependent ? Math.max(120, feedersHeight) : 150;

        if (isCommonBus) bayHeight = (totalHeight - 100) / transformers.length;

        const yCenter = currentY + bayHeight / 2;
        const startY = currentY;

        currentY += bayHeight + bayGap;

        return (
          <g key={tr.id}>
            <TransformerBay
              x={xAnchor}
              y={yCenter}
              name={tr.name}
              relayModel={tr.relay_model}
              isError={errors.includes(tr.name)}
              onClick={() => onComponentClick(tr.name)}
            />

            {isParallelism && (
              <line
                x1={xAnchor + 310}
                y1={yCenter}
                x2={xBusSecundario}
                y2={yCenter}
                stroke="var(--color-eq-primary)"
                strokeWidth="2"
              />
            )}

            {isIndependent &&
              tr.feeders.map((feeder, fIdx) => {
                const yFeeder =
                  startY + fIdx * feederSpacing + feederSpacing / 2;

                return (
                  <FeederModule
                    key={feeder.id}
                    x={xBusSecundario}
                    y={yFeeder}
                    spacing={feederSpacing}
                    name={feeder.name}
                    isError={errors.includes(feeder.name)}
                    isLast={false}
                    onClick={() => onComponentClick(feeder.name)}
                  />
                );
              })}
          </g>
        );
      })}

      {isCommonBus &&
        uniqueFeeders.map((feeder, fIdx) => (
          <FeederModule
            key={feeder.id}
            x={xBusSecundario}
            y={50 + fIdx * feederSpacing + feederSpacing / 2}
            spacing={feederSpacing}
            name={feeder.name}
            isError={errors.includes(feeder.name)}
            isLast={fIdx === uniqueFeeders.length - 1}
            onClick={() => onComponentClick(feeder.name)}
          />
        ))}
    </svg>
  );
};
