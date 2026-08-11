import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import SessionGuard from "@/components/SessionGuard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Assessment from "@/pages/Assessment";
import Result from "@/pages/Result";
import Safety from "@/pages/Safety";

function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <p className="font-serif text-2xl italic">
        Beranda Aluna — assessment menyusul.
      </p>
    </main>
  );
}

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
