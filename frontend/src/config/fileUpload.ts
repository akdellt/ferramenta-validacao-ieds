export const FILE_CONFIG = {
  OA: {
    maxSizeMB: 5,
    accept: ".xlsx",
    emptyMessage: "Nenhuma Ordem de Ajuste importada",
  },
  IED: {
    maxSizeMB: 2,
    accept: ".txt",
    emptyMessage: "Nenhum arquivo de IED encontrado",
  },
  SCD: {
    maxSizeMB: 50,
    accept: ".scd,.xml",
    emptyMessage: "Nenhum arquivo SCD/XML selecionado",
  },
} as const;

export type FileType = keyof typeof FILE_CONFIG;
