import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { IedSlotData } from "../types/parameters";
import type {
  TopologyValidationResponse,
  Transformer,
} from "../features/topology/types";
import type { BackendReport } from "../features/result/types";
import { useNavigate } from "react-router-dom";

interface ValidationContextData {
  oaFiles: File[];
  iedSlots: IedSlotData[];
  reportResults: BackendReport | null;

  topologyType: string;
  formData: any;
  scdFile: File | null;

  topologyReport: TopologyValidationResponse | null;
  transformers: Transformer[];
  isLoading: boolean;

  setOaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setIedSlots: React.Dispatch<React.SetStateAction<IedSlotData[]>>;
  setReportResults: React.Dispatch<React.SetStateAction<BackendReport | null>>;

  setTopologyType: (type: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setScdFile: (file: File | null) => void;

  setTopologyReport: React.Dispatch<
    React.SetStateAction<TopologyValidationResponse | null>
  >;
  setTransformers: React.Dispatch<React.SetStateAction<Transformer[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

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

  const [topologyType, setTopologyType] = useState("");
  const [formData, setFormData] = useState<any>(null);
  const [scdFile, setScdFile] = useState<File | null>(null);

  const [topologyReport, setTopologyReport] =
    useState<TopologyValidationResponse | null>(null);
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTransformers([]);
  }, [topologyType, setTransformers]);

  const clearSession = () => {
    setOaFiles([]);
    setIedSlots([]);
    setReportResults(null);
    setTopologyReport(null);
    setTransformers([]);
    setTopologyType("");
    setFormData(null);
    setScdFile(null);
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
        topologyReport,
        setTopologyReport,
        transformers,
        setTransformers,
        topologyType,
        setTopologyType,
        formData,
        setFormData,
        scdFile,
        setScdFile,
        isLoading,
        setIsLoading,
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
