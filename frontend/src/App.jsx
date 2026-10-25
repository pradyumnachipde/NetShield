
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import UploadDetails from "./pages/UploadDetails";
import Alerts from "./pages/Alerts";
import ModelAnalytics from "./pages/ModelAnalytics";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<UploadDetails />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/model" element={<ModelAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
