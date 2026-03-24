import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { api } from "../../services/api";

function Header() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const response = await api.get("/health/network", { timeout: 5000 });
        setIsOnline(response.data.online);
      } catch {
        setIsOnline(false);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-eq-primary flex h-12 w-full items-center justify-between px-8">
      <h1 className="text-lg font-bold tracking-wider text-white">
        SISTEMA DE VALIDAÇÃO DE IEDS
      </h1>
      <div className="bg-card/10 flex items-center gap-2 rounded-full border border-white px-3 py-1">
        {isOnline ? (
          <>
            <Wifi size={24} className="text-green-500" />
            <span className="text-xs font-bold tracking-wide text-green-500">
              ONLINE
            </span>
          </>
        ) : (
          <>
            <WifiOff size={24} className="text-white/70" />
            <span className="text-xs font-bold tracking-wide text-white">
              OFFLINE
            </span>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
