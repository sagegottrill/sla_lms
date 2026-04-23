import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeUserRole } from "@/lib/userRole";
import StudentDashboard from "./dashboards/StudentDashboard";
import InstructorDashboard from "./dashboards/InstructorDashboard";
import ProgramManagerDashboard from "./dashboards/ProgramManagerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function DashboardHome() {
  const { appUser } = useAuth();

  if (!appUser) return <Navigate to="/" replace />;

  const dashboards = {
    student: <StudentDashboard />,
    instructor: <InstructorDashboard />,
    program_manager: <ProgramManagerDashboard />,
    admin: <AdminDashboard />,
  };

  // Normalize so we never index with a stray string (would render blank and feel like "wrong role").
  const role = normalizeUserRole(appUser.role);
  const panel = dashboards[role] ?? dashboards.student;

  return <div>{panel}</div>;
}
