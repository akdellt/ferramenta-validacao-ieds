export const FILE_CONFIG = {
  OA: {
    maxSizeMB: 5,
    accept: ".xlsx,.xls",
    displayName: "Ordens de Ajuste",
    emptyMessage: "Nenhuma Ordem de Ajuste importada",
  },
  IED: {
    maxSizeMB: 2,
    accept: ".txt",
    displayName: "Dados de Campo (IEDs)",
    emptyMessage: "Nenhum arquivo de IED encontrado",
  },
  SCD: {
    maxSizeMB: 50,
    accept: ".scd,.xml",
    displayName: "Projeto de Topologia (SCD)",
    emptyMessage: "Nenhum arquivo SCD/XML selecionado",
  },
} as const;

export type FileType = keyof typeof FILE_CONFIG;
