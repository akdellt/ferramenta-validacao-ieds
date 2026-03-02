import { createContext, useContext, useState, type ReactNode } from "react";
import { type IedSlotData } from "../features/importacao/components/ImportSection";

interface ValidationContextData {
  oaFiles: File[];
  iedSlots: IedSlotData[];
  reportResults: any | null;

  setOaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setIedSlots: React.Dispatch<React.SetStateAction<IedSlotData[]>>;
  setReportResults: (data: any) => void;

  clearSession: () => void;
}

const ValidationContext = createContext({} as ValidationContextData);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [oaFiles, setOaFiles] = useState<File[]>([]);
  const [iedSlots, setIedSlots] = useState<IedSlotData[]>([]);
  const [reportResults, setReportResults] = useState<any | null>(null);

  const clearSession = () => {
    setOaFiles([]);
    setIedSlots([]);
    setReportResults(null);
    window.location.href = "/";
  };

  return (
    <ValidationContext.Provider
      value={{
        oaFiles,
        setOaFiles,
        iedSlots,
        setIedSlots,
        reportResults,
        setReportResults,
        clearSession,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

export const useValidation = () => useContext(ValidationContext);
