import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/react-query";

/**
 * ============================================================================
 * PILLAR 3: EVENT-DRIVEN SYNC (SUPABASE REALTIME)
 * ============================================================================
 * Subscribes to Postgres mutation events across all core tables and forcefully
 * invalidates the relevant React Query cache tiers. This ensures all authenticated
 * users see real-time updates without manual polling.
 */
export function useGlobalDashboardSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("system_sync")
      // Listen to Course mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.courses.base });
        }
      )
      // Listen to Program mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "programs" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.programs.base });
        }
      )
      // Listen to Profile/User mutations (crucial for Admin and self-updates)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          // Broad invalidation of the profiles base cache
          queryClient.invalidateQueries({ queryKey: queryKeys.profiles.base });
          
          // Targeted invalidation if the payload contains the ID
          if (payload.new && 'id' in payload.new) {
            // Stats often change when profiles change
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.base });
          }
        }
      )
      // Listen to Enrollment mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enrollments" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.base });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.base });
        }
      )
      // Listen to Settings mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["site-config"] });
        }
      )
      // Listen to Payments mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.payments.base });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.base });
        }
      )
      // Listen to Program Applications mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "program_applications" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.programApplications.base });
        }
      )
      // Listen to Course Applications mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_applications" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.courseApplications.base });
        }
      )
      // Listen to Placement Outcomes mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "placement_outcomes" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.placementOutcomes.base });
        }
      )
      // Listen to Interview Schedules mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interview_schedules" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.interviewSchedules.base });
        }
      )
      // Listen to Lead Captures mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_captures" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.leadCaptures.base });
        }
      )
      // Listen to Skills Assessments mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skills_assessments" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.skillsAssessments.base });
        }
      )
      // Listen to Skills Results mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skills_results" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.skillsResults.base });
        }
      )
      // Listen to Saved Reports mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_reports" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.savedReports.base });
        }
      )
      // Listen to User Notification State mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_notification_state" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.userNotificationState.base });
        }
      )
      // Listen to Notification Preferences mutations
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_preferences" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notificationPreferences.base });
        }
      )
      .subscribe((status, err) => {
        if (err) console.error("Realtime sync error:", err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
