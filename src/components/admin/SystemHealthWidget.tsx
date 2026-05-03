import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthIndicatorProps {
  label: string;
  status?: "healthy" | "degraded" | "down" | "unknown";
  responseTime?: number;
}

function HealthIndicator({ label, status = "unknown", responseTime }: HealthIndicatorProps) {
  const statusConfig = {
    healthy: {
      color: "bg-emerald-500",
      icon: CheckCircle,
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    degraded: {
      color: "bg-amber-500",
      icon: AlertCircle,
      textColor: "text-amber-600 dark:text-amber-400",
    },
    down: {
      color: "bg-red-500",
      icon: XCircle,
      textColor: "text-red-600 dark:text-red-400",
    },
    unknown: {
      color: "bg-gray-400",
      icon: Activity,
      textColor: "text-muted-foreground",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", config.color)} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {responseTime !== undefined && (
          <span className="text-xs text-muted-foreground">
            {responseTime}ms
          </span>
        )}
        <Icon className={cn("w-3.5 h-3.5", config.textColor)} />
      </div>
    </div>
  );
}

export function SystemHealthWidget() {
  const { data: health, isLoading } = useQuery({
    queryKey: ["system_health"],
    queryFn: api.getSystemHealth,
    refetchInterval: 30000, // 30 seconds
    select: (response) => response.data,
  });

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-base text-foreground">System Health</h2>
        {isLoading && (
          <Activity className="w-4 h-4 text-muted-foreground animate-pulse" />
        )}
      </div>
      <div className="space-y-1">
        <HealthIndicator
          label="Database"
          status={health?.database}
          responseTime={health?.databaseResponseTime}
        />
        <HealthIndicator
          label="Storage"
          status={health?.storage}
          responseTime={health?.storageResponseTime}
        />
      </div>
      <div className="mt-4 pt-4 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}
        </p>
      </div>
    </div>
  );
}
