import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentDashboard from "./dashboards/StudentDashboard";
import InstructorDashboard from "./dashboards/InstructorDashboard";
import ProgramManagerDashboard from "./dashboards/ProgramManagerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function DashboardHome() {
  const { appUser } = useAuth();

  if (!appUser) return <Navigate to="/login" replace />;

  const dashboards = {
    student: <StudentDashboard />,
    instructor: <InstructorDashboard />,
    program_manager: <ProgramManagerDashboard />,
    admin: <AdminDashboard />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {dashboards[appUser.role]}
    </motion.div>
  );
}
