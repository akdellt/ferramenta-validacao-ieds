import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import ImportPage from "./pages/ImportPage";
import ResultPage from "./pages/ResultPage";
import TopologyPage from "./pages/TopologyPage";
import CircuitsPage from "./pages/CircuitsPage";
import LogPage from "./pages/LogPage";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

const MainLayout = () => {
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
      <Route element={<MainLayout />}>
        <Route index element={<ImportPage />} />
        <Route path="results" element={<ResultPage />} />
        <Route path="logs" element={<LogPage />} />
        <Route path="topologies" element={<TopologyPage />} />
        <Route path="circuits" element={<CircuitsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
