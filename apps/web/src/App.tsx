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
import Booking from "@/pages/Booking";
import Payment from "@/pages/Payment";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PackageBooking from "@/pages/PackageBooking";
import PackagePayment from "@/pages/PackagePayment";
import PackageSuccess from "@/pages/PackageSuccess";

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
