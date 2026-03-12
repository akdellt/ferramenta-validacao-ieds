import { useCallback } from "react";
import type { Transformer } from "../types";
import { useValidation } from "../../../context/ValidationContext";

function useTopologyActions() {
  const { transformers, setTransformers } = useValidation();

  const addTransformer = useCallback(() => {
    const newTransformer: Transformer = {
      id: crypto.randomUUID(),
      name: "",
      relay_model: "",
      feeders: [],
    };
    setTransformers((prev) => [...prev, newTransformer]);
  }, [setTransformers]);

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
      setTransformers((prev) =>
        prev.map((t) =>
          t.id === transformerId
            ? {
                ...t,
                feeders: [...t.feeders, { id: crypto.randomUUID(), name: "" }],
              }
            : t,
        ),
      );
    },
    [setTransformers],
  );

  const updateFeeder = useCallback(
    (transfId: string, feederId: string, value: string) => {
      setTransformers((prev) =>
        prev.map((t) => {
          if (t.id === transfId) {
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
    [setTransformers],
  );

  const removeFeeder = useCallback(
    (transfId: string, feederId: string) => {
      setTransformers((prev) =>
        prev.map((t) =>
          t.id === transfId
            ? { ...t, feeders: t.feeders.filter((f) => f.id !== feederId) }
            : t,
        ),
      );
    },
    [setTransformers],
  );

  return {
    transformers,
    addTransformer,
    removeTransformer,
    updateTransformerName,
    addFeeder,
    updateFeeder,
    removeFeeder,
  };
}

export default useTopologyActions;
