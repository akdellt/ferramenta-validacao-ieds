import { CloudUpload, Network, ShieldCheck, Info, Trash2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import EQ from "../../assets/EQ.svg";
import { useSidebar } from "../../hooks/useSidebar";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SidebarItem({
  icon,
  label,
  isActive = false,
  onClick,
}: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      title={label}
      className={`flex aspect-square w-full cursor-pointer items-center justify-center rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-eq-primary text-white shadow-lg"
          : "text-bg-secondary hover:bg-white/10 hover:text-white"
      } `}
      aria-label={label}
    >
      {icon}
    </div>
  );
}

function Sidebar() {
  const { menuItems, handleClearData, handleHelp } = useSidebar();

  return (
    <aside className="bg-eq-primary z-50 flex h-full w-23 flex-col items-center py-6 text-white">
      <div className="mb-5 flex items-center justify-center">
        <img src={EQ} alt="Logo EQ" className="h-10 w-10" />
      </div>

      <div className="mb-6 w-full px-4">
        <div className="h-px w-full bg-white/20" />
      </div>

      <nav className="flex w-full flex-1 flex-col gap-5 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="w-full"
            end={item.path === "/"}
          >
            {({ isActive }) => (
              <SidebarItem
                icon={item.icon}
                label={item.name}
                isActive={isActive}
              />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex w-full flex-col gap-5 px-3">
        <SidebarItem
          icon={<Info size={32} />}
          label="Ajuda"
          onClick={handleHelp}
        />
        <SidebarItem
          icon={<Trash2 size={32} />}
          label="Limpar"
          onClick={handleClearData}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
