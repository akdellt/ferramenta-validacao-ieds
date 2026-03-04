import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  user: { registration: string; name: string } | null;
  login: (registration: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(() => {
    const savedRegistration = localStorage.getItem("user_registration");
    const savedName = localStorage.getItem("user_name");

    if (savedRegistration && savedName) {
      return { registration: savedRegistration, name: savedName };
    }
    return null;
  });

  const login = (registration: string, name: string) => {
    const userData = { registration, name };
    setUser(userData);
    localStorage.setItem("user_registration", registration);
    localStorage.setItem("user_name", name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user_registration");
    localStorage.removeItem("user_name");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};
