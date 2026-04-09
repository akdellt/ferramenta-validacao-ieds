import {
  CloudUpload,
  Network,
  ShieldCheck,
  LogsIcon,
  Component,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useValidation } from "../context/ValidationContext";

export const useSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession } = useValidation();

  const menuItems = [
    {
      name: "Importação",
      icon: <CloudUpload size={32} />,
      path: "/",
    },
    {
      name: "Resultados",
      icon: <ShieldCheck size={32} />,
      path: "/results",
    },
    {
      name: "Topologia",
      icon: <Component size={32} />,
      path: "/topologies",
    },
    {
      name: "Circuito",
      icon: <Network size={32} />,
      path: "/circuits",
    },
    {
      name: "Histórico",
      icon: <LogsIcon size={32} />,
      path: "/logs",
    },
  ];

  const handleClearData = () => {
    clearSession();
    navigate("/");
  };

  return {
    menuItems,
    handleClearData,
    currentPath: location.pathname,
  };
};
