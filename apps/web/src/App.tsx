import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import SessionGuard from "@/components/SessionGuard";
import Home from "@/pages/Home";
import Roadmap from "@/pages/Roadmap";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Assessment from "@/pages/Assessment";
import Result from "@/pages/Result";
import Safety from "@/pages/Safety";
import Therapists from "@/pages/Therapists";
import TherapistDetail from "@/pages/TherapistDetail";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/result" element={<Result />} />
        <Route path="/safety" element={<Safety />} />
        <Route
          path="/roadmap"
          element={
            <SessionGuard>
              <Roadmap />
            </SessionGuard>
          }
        />
        <Route
          path="/therapists"
          element={
            <SessionGuard>
              <Therapists />
            </SessionGuard>
          }
        />
        <Route
          path="/therapists/:id"
          element={
            <SessionGuard>
              <TherapistDetail />
            </SessionGuard>
          }
        />
        <Route
          path="/"
          element={
            <SessionGuard>
              <Home />
            </SessionGuard>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}
