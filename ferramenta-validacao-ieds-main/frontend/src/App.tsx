import { Routes, Route, Navigate } from "react-router-dom";

import ImportPage from "./pages/ImportPage";
import ResultPage from "./pages/ResultPage";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import TopologyPage from "./pages/TopologyPage"; 
import CircuitsPage from "./pages/CircuitsPage";

function App() {
  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />

        <main className="h-full flex-1 overflow-y-auto">
          <Routes>
            <Route path="/resultados" element={<CircuitsPage />} />
            <Route path="/topologia" element={<TopologyPage />} />
            <Route path="/" element={<ImportPage />} />
            <Route path="/resultados" element={<ResultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
