import { CloudUpload, Network, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useValidation } from "../context/ValidationContext";

export const useSidebar = () => {
  const navigate = useNavigate();
  const { limparSessao } = useValidation();

  const menuItems = [
    {
      name: "Importação",
      icon: <CloudUpload size={32} />,
      path: "/",
    },
    {
      name: "Topologia",
      icon: <Network size={32} />,
      path: "/topologia",
    },
    {
      name: "Resultados",
      icon: <ShieldCheck size={32} />,
      path: "/resultados",
    },
  ];

  const handleClearData = () => {
    limparSessao();
    navigate("/");
  };

  const handleHelp = () => {
    alert("Fazer depois");
  };

  return {
    menuItems,
    handleClearData,
    handleHelp,
  };
};
