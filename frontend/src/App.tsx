import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { api } from "./lib/api";
import Apply from "./pages/Apply";
import Dashboard from "./pages/Dashboard";
import FounderDetail from "./pages/FounderDetail";

export default function App() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  useEffect(() => {
    api.health()
      .then((health) => setApiStatus(health.status === "ok" ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);
  return <Routes><Route element={<AppShell apiStatus={apiStatus} />}><Route index element={<Dashboard />} /><Route path="apply" element={<Apply />} /><Route path="founders/:id" element={<FounderDetail />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
