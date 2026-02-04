export const FILE_CONFIG = {
  OA: {
    maxSizeMB: 5,
    accept: ".xlsx,.xls",
    displayName: "Ordens de Ajuste",
    emptyMessage: "Nenhum arquivo importado",
  },
  IED: {
    maxSizeMB: 2,
    accept: ".txt",
    displayName: "Dados de Campo (IEDs)",
    emptyMessage: "Nenhum IED encontrado",
  },
} as const;

export type FileType = keyof typeof FILE_CONFIG;
