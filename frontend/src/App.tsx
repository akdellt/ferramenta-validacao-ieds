import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Páginas
import LoginPage from "./pages/LoginPage";
import ImportPage from "./pages/ImportPage";
import ResultPage from "./pages/ResultPage";
import LogPage from "./pages/LogPage";
import TopologyPage from "./pages/TopologyPage";

// Componentes de Layout
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

/**
 * Operacional: Componente de proteção de rota com estado de carregamento
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Funcionalidade do Código 1: Evita redirecionar antes do Firebase/Auth validar o token
  if (loading) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="border-eq-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * Operacional: Wrapper de layout privado (Sidebar + Header)
 */
const PrivateLayout = () => {
  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="h-full flex-1 overflow-y-auto bg-gray-50/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Rota Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Autenticadas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          {/* Rota Inicial após Login */}
          <Route index element={<ImportPage />} />
          
          {/* Funcionalidade do Código 2: Mapeamento de Rotas */}
          <Route path="resultados" element={<ResultPage />} />
          <Route path="results" element={<Navigate to="/resultados" replace />} />
          
          <Route path="logs" element={<LogPage />} />
          
          {/* Compatibilidade de caminhos (Topologia) */}
          <Route path="topologies" element={<TopologyPage />} />
          <Route path="topologia" element={<Navigate to="/topologies" replace />} />
        </Route>
      </Route>

      {/* Fallback de Segurança */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;