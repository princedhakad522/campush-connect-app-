import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PageLoader } from "./components/ui";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Notices from "./pages/Notices";
import Timetable from "./pages/Timetable";
import Attendance from "./pages/Attendance";
import Assignments from "./pages/Assignments";
import Events from "./pages/Events";
import LostFound from "./pages/LostFound";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import Departments from "./pages/Departments";
import Canteen from "./pages/Canteen";
import HODs from "./pages/HODs";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function StaffOnly({ children }: { children: React.ReactNode }) {
  const { isStaff, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loading, user } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <Protected>
            <Layout>
              <Home />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/notes"
        element={
          <Protected>
            <Layout>
              <Notes />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/notices"
        element={
          <Protected>
            <Layout>
              <Notices />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/timetable"
        element={
          <Protected>
            <Layout>
              <Timetable />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/attendance"
        element={
          <Protected>
            <Layout>
              <Attendance />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/assignments"
        element={
          <Protected>
            <Layout>
              <Assignments />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/events"
        element={
          <Protected>
            <Layout>
              <Events />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/canteen"
        element={
          <Protected>
            <Layout>
              <Canteen />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/hods"
        element={
          <Protected>
            <Layout>
              <HODs />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/lost-found"
        element={
          <Protected>
            <Layout>
              <LostFound />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/community"
        element={
          <Protected>
            <Layout>
              <Community />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/notifications"
        element={
          <Protected>
            <Layout>
              <Notifications />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <Layout>
              <Profile />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/departments"
        element={
          <Protected>
            <Layout>
              <StaffOnly>
                <Departments />
              </StaffOnly>
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected>
            <Layout>
              <AdminOnly>
                <Admin />
              </AdminOnly>
            </Layout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}