import {
  CloudUpload,
  Network,
  ShieldCheck,
  LogsIcon,
  Component,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useValidation } from "../context/ValidationContext";

export const useSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession } = useValidation();
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    {
      name: "Importação",
      icon: <CloudUpload size={32} />,
      path: "/",
    },
    {
      name: "Topologia",
      icon: <Component size={32} />,
      path: "/topologies",
    },
    {
      name: "Resultados",
      icon: <ShieldCheck size={32} />,
      path: "/results",
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

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
  };

  const handleLogout = () => {
    clearSession();
    logout();
    navigate("/login");
  };

  return {
    menuItems,
    handleClearData,
    isProfileOpen,
    toggleProfile,
    handleLogout,
    currentPath: location.pathname,
  };
};
