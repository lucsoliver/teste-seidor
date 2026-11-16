import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import TicketDashboardPage from "../pages/TicketDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/perfil/c1" replace />} />
        <Route path="/perfil/:perfilId" element={<TicketDashboardPage />} />
        <Route path="*" element={<Navigate to="/perfil/c1" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
