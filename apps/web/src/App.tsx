import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import SessionGuard from "@/components/SessionGuard";
import Home from "@/pages/Home";
import Roadmap from "@/pages/Roadmap";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Assessment from "@/pages/Assessment";
import Result from "@/pages/Result";
import Safety from "@/pages/Safety";
import Therapists from "@/pages/Therapists";
import TherapistDetail from "@/pages/TherapistDetail";
import Booking from "@/pages/Booking";
import Payment from "@/pages/Payment";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PackageBooking from "@/pages/PackageBooking";
import PackagePayment from "@/pages/PackagePayment";
import PackageSuccess from "@/pages/PackageSuccess";
import Admin from "@/pages/Admin";
import Redeem from "@/pages/Redeem";
import Journal from "@/pages/Journal";
import Profile from "@/pages/Profile";
import { getSession } from "@/lib/auth";

// ponytail: guest lands on login; assessment offered via popup on the login page
function RootGate() {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </div>
    );
  }

  if (data?.user) return <Home />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
          path="/booking"
          element={
            <SessionGuard>
              <Booking />
            </SessionGuard>
          }
        />
        <Route
          path="/payment"
          element={
            <SessionGuard>
              <Payment />
            </SessionGuard>
          }
        />
        <Route
          path="/payment-success"
          element={
            <SessionGuard>
              <PaymentSuccess />
            </SessionGuard>
          }
        />
        <Route
          path="/booking-package"
          element={
            <SessionGuard>
              <PackageBooking />
            </SessionGuard>
          }
        />
        <Route
          path="/package-payment"
          element={
            <SessionGuard>
              <PackagePayment />
            </SessionGuard>
          }
        />
        <Route
          path="/package-success"
          element={
            <SessionGuard>
              <PackageSuccess />
            </SessionGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <SessionGuard>
              <Admin />
            </SessionGuard>
          }
        />
        <Route
          path="/redeem"
          element={
            <SessionGuard>
              <Redeem />
            </SessionGuard>
          }
        />
        <Route
          path="/journal"
          element={
            <SessionGuard>
              <Journal />
            </SessionGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <SessionGuard>
              <Profile />
            </SessionGuard>
          }
        />
        <Route
          path="/"
          element={<RootGate />}
        />
      </Routes>
      <Toaster />
    </>
  );
}
