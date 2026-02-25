import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import TopPage from "@/routes/TopPage";
import DiagnosePage from "@/routes/DiagnosePage";
import ResultPage from "@/routes/ResultPage";
import ModelsPage from "@/routes/ModelsPage";
import ModelDetailPage from "@/routes/ModelDetailPage";
import HistoryPage from "@/routes/HistoryPage";
import SettingsPage from "@/routes/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TopPage />} />
          <Route path="/diagnose" element={<DiagnosePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/:id" element={<ModelDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
