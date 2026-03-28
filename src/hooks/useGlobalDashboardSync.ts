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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["site-config"] });
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
