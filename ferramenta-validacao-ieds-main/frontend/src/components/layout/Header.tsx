import { WifiOff } from "lucide-react";

function Header() {
  return (
    <header className="bg-eq-primary flex h-12 w-full items-center justify-between px-8">
      <h1 className="text-lg font-bold tracking-wider text-white">
        SISTEMA DE VALIDAÇÃO DE IEDS
      </h1>

      <div className="bg-card/10 flex items-center gap-2 rounded-full border border-white px-3 py-1">
        <WifiOff size={24} className="text-white/70" />
        <span className="text-xs font-bold tracking-wide text-white">
          OFFLINE
        </span>
      </div>
    </header>
  );
}

export default Header;
