import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ImportPage from "./pages/ImportPage";
import ResultPage from "./pages/ResultPage";
import LoginPage from "./pages/LoginPage";
import LogPage from "./pages/LogPage";
import TopologyPage from "./pages/TopologyPage";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const PrivateLayout = () => {
  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="h-full flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route index element={<ImportPage />} />
          <Route path="resultados" element={<ResultPage />} />
          <Route path="logs" element={<LogPage />} />
          <Route path="topologies" element={<TopologyPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
