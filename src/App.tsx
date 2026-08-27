import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import EasterEggs from "@/components/site/EasterEggs";
import { LoadingScreen } from "@/components/site/LoadingScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Mentors from "./pages/Mentors";
import MentorDetail from "./pages/MentorDetail";
import PublicMentorProfile from "./pages/PublicMentorProfile";
import Playbooks from "./pages/Playbooks";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Colleges from "./pages/Colleges";
import CandidateDashboard from "./pages/CandidateDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import CampusDashboard from "./pages/CampusDashboard";
import GuestLecturer from "./pages/GuestLecturer";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <LoadingScreen />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/mentors/:id" element={<MentorDetail />} />
        <Route path="/m/:slug" element={<PublicMentorProfile />} />
        <Route path="/playbooks" element={<Playbooks />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/colleges" element={<Colleges />} />
        <Route path="/guest-lecturer" element={<GuestLecturer />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["candidate"]}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/dashboard"
          element={
            <ProtectedRoute roles={["mentor"]}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campus/dashboard"
          element={
            <ProtectedRoute roles={["campus"]}>
              <CampusDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "superadmin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute roles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <EasterEggs />
      <Toaster richColors position="top-center" />
    </>
  );
}
