import { Routes, Route, Navigate } from "react-router-dom";

import ImportPage from "./pages/ImportPage";
import ResultPage from "./pages/ResultPage";
import Login from './pages/LoginPage';

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

function App() {

  return (

    <>
      <div className="container-geral">
        {/* O Login será o único conteúdo renderizado */}
        <Login />
      </div>
      <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
        <div className="shrink-0">
          <Header />
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar />

          <main className="h-full flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/" element={<ImportPage />} />
              <Route path="/resultados" element={<ResultPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
