import { TransformerBay } from "./TransformerBay";
import { FeederModule } from "./FeederModule";
import {
  type TopologyType,
  type Transformer,
  getTopologyHelpers,
} from "../types";

interface CircuitDiagramProps {
  transformers: Transformer[];
  iedSummary: any[];
  connectionMap: any[];
  topologyType: TopologyType;
  onComponentClick: (name: string) => void;
}

export const CircuitDiagram = ({
  transformers,
  iedSummary,
  connectionMap,
  topologyType,
  onComponentClick,
}: CircuitDiagramProps) => {
  const { isCommonBus, isParallel, isIndependent } =
    getTopologyHelpers(topologyType);

  const feederSpacing = 70;
  const xAnchor = 40;
  const xBusSecondary = 400;
  const feederWidth = 200;

  const dynamicWidth =
    isIndependent || isCommonBus
      ? xBusSecondary + feederWidth + 40
      : xBusSecondary + 60;

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
  } else if (isParallel) {
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
      className="circuit-svg mx-auto block h-auto w-full max-w-4xl"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={xAnchor}
        y1={50}
        x2={xAnchor}
        y2={totalHeight - 50}
        stroke="var(--color-eq-primary)"
        strokeWidth="4"
      />

      {isParallel && (
        <line
          x1={xBusSecondary}
          y1={50}
          x2={xBusSecondary}
          y2={totalHeight - 50}
          stroke="var(--color-eq-primary)"
          strokeWidth="4"
        />
      )}

      {transformers.map((tr) => {
        const iedStatus = iedSummary.find((s) => s.name === tr.name);
        const isIedError = iedStatus ? !iedStatus.is_healthy : false;

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
              isError={isIedError}
              onClick={() => onComponentClick(tr.name)}
            />

            {(isParallel || isCommonBus) && (
              <line
                x1={xAnchor + 310}
                y1={yCenter}
                x2={xBusSecondary}
                y2={yCenter}
                stroke="var(--color-eq-primary)"
                strokeWidth="2"
              />
            )}

            {isIndependent &&
              tr.feeders.map((feeder, fIdx) => {
                const feederStatus = iedSummary.find(
                  (s) => s.name === feeder.name,
                );
                const isFeederError = feederStatus
                  ? !feederStatus.is_healthy
                  : false;

                const conn = connectionMap.find(
                  (c) => c.from_ied === feeder.name && c.to_ied === tr.name,
                );

                const yFeeder =
                  startY + fIdx * feederSpacing + feederSpacing / 2;

                return (
                  <FeederModule
                    key={feeder.id}
                    x={xBusSecondary}
                    y={yFeeder}
                    spacing={feederSpacing}
                    name={feeder.name}
                    isError={isFeederError}
                    isLast={false}
                    isLineError={conn?.is_broken || false}
                    onLineClick={() => onComponentClick(`conn:${feeder.name}`)}
                    onClick={() => onComponentClick(feeder.name)}
                  />
                );
              })}
          </g>
        );
      })}

      {isCommonBus &&
        uniqueFeeders.map((feeder, fIdx) => {
          const feederStatus = iedSummary.find((s) => s.name === feeder.name);
          const isFeederError = feederStatus ? !feederStatus.is_healthy : false;

          const conn = connectionMap.find((c) => c.from_ied === feeder.name);

          return (
            <FeederModule
              key={feeder.id}
              x={xBusSecondary}
              y={50 + fIdx * feederSpacing + feederSpacing / 2}
              spacing={feederSpacing}
              name={feeder.name}
              isError={isFeederError}
              isLast={fIdx === uniqueFeeders.length - 1}
              isLineError={conn?.is_broken || false}
              onLineClick={() => onComponentClick(`conn:${feeder.name}`)}
              onClick={() => onComponentClick(feeder.name)}
            />
          );
        })}
    </svg>
  );
};
