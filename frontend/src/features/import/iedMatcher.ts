import type { IedSlotData } from "../../types/parameters";

export const performIedMatch = (
  oaData: any[],
  dbIeds: any[],
  fileName: string,
): IedSlotData[] => {
  return oaData.map((item) => {
    const matchedIed = dbIeds.find((db) => {
      const dbModel = String(db.relay_model).trim().toUpperCase();
      const oaModel = String(item.relay_model).trim().toUpperCase();

      const isMatch = dbModel === oaModel;

      return isMatch;
    });

    return {
      id: crypto.randomUUID(),
      relay_model: item.relay_model,
      substation: item.substation || "",
      name: matchedIed ? matchedIed.name : "",
      filename_oa: fileName,
      file: null,
    };
  });
};
