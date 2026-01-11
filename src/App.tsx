import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PresenceTracker } from "@/components/PresenceTracker";
import { AngolaRestriction } from "@/components/geo/AngolaRestriction";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Services from "./pages/Services";
import WorkerProfile from "./pages/WorkerProfile";
import Booking from "./pages/Booking";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerVerification from "./pages/worker/WorkerVerification";
import WorkerBookings from "./pages/worker/WorkerBookings";
import WorkerSchedule from "./pages/worker/WorkerSchedule";
import WorkerEarnings from "./pages/worker/WorkerEarnings";
import WorkerSettings from "./pages/worker/WorkerSettings";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientBookings from "./pages/client/ClientBookings";
import Messages from "./pages/Messages";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import BecomeWorker from "./pages/BecomeWorker";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AngolaRestriction>
      <AuthProvider>
        <NotificationProvider>
          <PresenceTracker />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:serviceType" element={<Services />} />
                <Route path="/worker/:id" element={<WorkerProfile />} />
                <Route path="/booking/:id" element={<Booking />} />
                <Route path="/worker/dashboard" element={<WorkerDashboard />} />
                <Route path="/worker/verify" element={<WorkerVerification />} />
                <Route path="/worker/bookings" element={<WorkerBookings />} />
                <Route path="/worker/schedule" element={<WorkerSchedule />} />
                <Route path="/worker/earnings" element={<WorkerEarnings />} />
                <Route path="/worker/settings" element={<WorkerSettings />} />
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/client/bookings" element={<ClientBookings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/become-worker" element={<BecomeWorker />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </AngolaRestriction>
  </QueryClientProvider>
);

export default App;
