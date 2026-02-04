import { createContext, useContext, useState, type ReactNode } from "react";
import { type IedSlotData } from "../features/importacao/components/ImportSection";

interface ValidationContextData {
  oaFiles: File[];
  iedSlots: IedSlotData[];
  relatorioResultados: any | null;

  setOaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setIedSlots: React.Dispatch<React.SetStateAction<IedSlotData[]>>;
  setRelatorioResultados: (dados: any) => void;

  limparSessao: () => void;
}

const ValidationContext = createContext({} as ValidationContextData);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [oaFiles, setOaFiles] = useState<File[]>([]);
  const [iedSlots, setIedSlots] = useState<IedSlotData[]>([]);
  const [relatorioResultados, setRelatorioResultados] = useState<any | null>(
    null,
  );

  const limparSessao = () => {
    setOaFiles([]);
    setIedSlots([]);
    setRelatorioResultados(null);
    window.location.href = "/";
  };

  return (
    <ValidationContext.Provider
      value={{
        oaFiles,
        setOaFiles,
        iedSlots,
        setIedSlots,
        relatorioResultados,
        setRelatorioResultados,
        limparSessao,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

export const useValidation = () => useContext(ValidationContext);
