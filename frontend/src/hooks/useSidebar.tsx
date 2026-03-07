import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, Network, ShieldCheck, LogsIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useValidation } from "../context/ValidationContext";

export const useSidebar = () => {
  const navigate = useNavigate();
  const { clearSession } = useValidation(); // Operacional em inglês
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Consolidação de todos os itens de menu
  const menuItems = [
    {
      name: "Importação",
      icon: <CloudUpload size={32} />,
      path: "/",
    },
    {
      name: "Topologia",
      icon: <Network size={32} />,
      path: "/topologies",
    },
    {
      name: "Resultados",
      icon: <ShieldCheck size={32} />,
      path: "/resultados",
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
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    clearSession();
    logout();
    navigate("/login");
  };

  const handleHelp = () => {
    // Interação com o usuário em português
    alert("Funcionalidade de ajuda: Em desenvolvimento.");
  };

  return {
    menuItems,
    isProfileOpen,
    handleClearData,
    toggleProfile,
    handleLogout,
    handleHelp,
  };
};