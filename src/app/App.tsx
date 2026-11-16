import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DEFAULT_PROFILE_ID } from "../data/seed";
import TicketDashboardPage from "../pages/TicketDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={`/perfil/${DEFAULT_PROFILE_ID}`} replace />}
        />
        <Route path="/perfil/:perfilId" element={<TicketDashboardPage />} />
        <Route
          path="*"
          element={<Navigate to={`/perfil/${DEFAULT_PROFILE_ID}`} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
