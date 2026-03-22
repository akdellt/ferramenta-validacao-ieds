import { useCallback } from "react";
import { type Transformer, TOPOLOGY_MAP } from "../types";
import { useValidation } from "../../../context/ValidationContext";

function useTopologyActions() {
  const { transformers, setTransformers, topologyType } = useValidation();

  const resetTopologyState = useCallback(
    (newType: string) => {
      const isParallel = newType === TOPOLOGY_MAP.PARALLELISM;
      const isCommonBus = newType === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_COUPLED;

      setTransformers((prev) => {
        if (prev.length > 0 && prev[0].name !== "") {
          return prev;
        }

        let reseted = [
          {
            id: crypto.randomUUID(),
            name: "",
            relay_model: "",
            feeders: [],
          },
        ];

        if (isParallel || isCommonBus) {
          reseted.push({
            id: crypto.randomUUID(),
            name: "",
            relay_model: "",
            feeders: [],
          });
        }
        return reseted;
      });
    },
    [setTransformers],
  );

  const addTransformer = useCallback(() => {
    const isCommonBus =
      topologyType === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_COUPLED;
    const newTransformer: Transformer = {
      id: crypto.randomUUID(),
      name: "",
      relay_model: "",
      feeders:
        isCommonBus && transformers.length > 0
          ? JSON.parse(JSON.stringify(transformers[0].feeders))
          : [],
    };
    setTransformers((prev) => [...prev, newTransformer]);
  }, [setTransformers, topologyType, transformers]);

  const removeTransformer = useCallback(
    (id: string) => {
      setTransformers((prev) =>
        prev.length > 1 ? prev.filter((t) => t.id !== id) : prev,
      );
    },
    [setTransformers],
  );

  const updateTransformerName = useCallback(
    (id: string, newName: string) => {
      setTransformers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name: newName } : t)),
      );
    },
    [setTransformers],
  );

  const addFeeder = useCallback(
    (transformerId: string) => {
      const isCommonBus =
        topologyType === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_COUPLED;
      const commonId = crypto.randomUUID();
      setTransformers((prev) =>
        prev.map((t) => {
          if (isCommonBus || t.id === transformerId) {
            return {
              ...t,
              feeders: [...t.feeders, { id: commonId, name: "" }],
            };
          }
          return t;
        }),
      );
    },
    [setTransformers, topologyType],
  );

  const updateFeeder = useCallback(
    (transfId: string, feederId: string, value: string) => {
      const isCommonBus =
        topologyType === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_COUPLED;
      setTransformers((prev) =>
        prev.map((t) => {
          if (isCommonBus || t.id === transfId) {
            return {
              ...t,
              feeders: t.feeders.map((f) =>
                f.id === feederId ? { ...f, name: value } : f,
              ),
            };
          }
          return t;
        }),
      );
    },
    [setTransformers, topologyType],
  );

  const removeFeeder = useCallback(
    (transfId: string, feederId: string) => {
      const isCommonBus =
        topologyType === TOPOLOGY_MAP.LOGICAL_SELECTIVITY_COUPLED;
      setTransformers((prev) =>
        prev.map((t) => {
          if (isCommonBus || t.id === transfId) {
            return {
              ...t,
              feeders: t.feeders.filter((f) => f.id !== feederId),
            };
          }
          return t;
        }),
      );
    },
    [setTransformers, topologyType],
  );

  return {
    transformers,
    addTransformer,
    removeTransformer,
    updateTransformerName,
    addFeeder,
    updateFeeder,
    removeFeeder,
    resetTopologyState,
  };
}

export default useTopologyActions;
