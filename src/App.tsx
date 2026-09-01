import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import EasterEggs from "@/components/site/EasterEggs";
import { LoadingScreen } from "@/components/site/LoadingScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isExpertEnabled } from "@contracts/features";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Mentors from "./pages/Mentors";
import MentorDetail from "./pages/MentorDetail";
import PublicMentorProfile from "./pages/PublicMentorProfile";
import PublicServiceDetail from "./pages/PublicServiceDetail";
import Playbooks from "./pages/Playbooks";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Colleges from "./pages/Colleges";
import CandidateDashboard from "./pages/CandidateDashboard";
import MyBookings from "./pages/MyBookings";
import MentorDashboard from "./pages/MentorDashboard";
import ExpertOnboarding from "./pages/ExpertOnboarding";
import ExpertDashboard from "./pages/ExpertDashboard";
import ExpertProfileEdit from "./pages/ExpertProfileEdit";
import ExpertPageBuilder from "./pages/ExpertPageBuilder";
import ExpertServices from "./pages/ExpertServices";
import ExpertServiceEditor from "./pages/ExpertServiceEditor";
import ExpertServicePackageEditor from "./pages/ExpertServicePackageEditor";
import PublicPackageDetail from "./pages/PublicPackageDetail";
import StudentBookingDetail from "./pages/StudentBookingDetail";
import ExpertCalendar from "./pages/ExpertCalendar";
import ExpertBookings from "./pages/ExpertBookings";
import ExpertBookingDetail from "./pages/ExpertBookingDetail";
import ExpertCustomers from "./pages/ExpertCustomers";
import ExpertCustomerDetail from "./pages/ExpertCustomerDetail";
import ExpertReviews from "./pages/ExpertReviews";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import CampusDashboard from "./pages/CampusDashboard";
import GuestLecturer from "./pages/GuestLecturer";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";


const expertRoutes = isExpertEnabled() ? (
  <>
    <Route path="/m/:slug/services/:serviceSlug" element={<PublicServiceDetail />} />
    <Route path="/m/:slug/packages/:packageSlug" element={<PublicPackageDetail />} />
    <Route
      path="/expert/onboarding"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertOnboarding />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/dashboard"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/profile/edit"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertProfileEdit />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/page"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertPageBuilder />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/services"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertServices />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/services/:id"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertServiceEditor />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/service-packages/:id"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertServicePackageEditor />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/calendar"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertCalendar />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/bookings"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertBookings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/bookings/:id"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertBookingDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/customers"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertCustomers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/customers/:id"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertCustomerDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expert/reviews"
      element={
        <ProtectedRoute roles={["expert"]}>
          <ExpertReviews />
        </ProtectedRoute>
      }
    />
  </>
) : null;
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
          path="/dashboard/orders/:id"
          element={
            <ProtectedRoute roles={["candidate"]}>
              <StudentBookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={["candidate"]}>
              <MyBookings />
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
                {expertRoutes}
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
