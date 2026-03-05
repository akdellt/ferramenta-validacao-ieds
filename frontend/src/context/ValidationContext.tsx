import { createContext, useContext, useState, type ReactNode } from "react";
import { type IedSlotData } from "../features/import/components/ImportSection";
import { type BackendReport } from "../features/result/types";
import { useNavigate } from "react-router-dom";

interface ValidationContextData {
  oaFiles: File[];
  iedSlots: IedSlotData[];
  reportResults: BackendReport | null;

  setOaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setIedSlots: React.Dispatch<React.SetStateAction<IedSlotData[]>>;
  setReportResults: React.Dispatch<React.SetStateAction<BackendReport | null>>;

  clearSession: () => void;
}

const ValidationContext = createContext<ValidationContextData | undefined>(
  undefined,
);

export function ValidationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [oaFiles, setOaFiles] = useState<File[]>([]);
  const [iedSlots, setIedSlots] = useState<IedSlotData[]>([]);
  const [reportResults, setReportResults] = useState<BackendReport | null>(
    null,
  );

  const clearSession = () => {
    setOaFiles([]);
    setIedSlots([]);
    setReportResults(null);
    navigate("/");
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

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error(
      "useValidation deve ser usado dentro de um ValidationProvider",
    );
  }
  return context;
};
