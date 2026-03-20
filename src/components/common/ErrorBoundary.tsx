import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * PILLAR 4: Global Error Boundaries and Fallback UIs
 * Mimics Canvas/Coursera stability by preventing one broken module
 * from crashing the entire LMS app tree.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // PILLAR 4 Directive: Extract detailed stack trace and log to centralized service
    console.error(`[ErrorBoundary:${this.props.name || 'Global'}] Uncaught error:`, error, errorInfo);
    
    // In a real enterprise setup, we would dispatch to Sentry/Datadog here:
    // logToService(error, errorInfo);
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center bg-destructive/5 rounded-3xl border border-destructive/10">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            We've encountered an unexpected error in this section. Our team has been notified.
          </p>
          <Button 
            onClick={this.handleRefresh}
            variant="outline" 
            className="gap-2 rounded-xl border-border hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" /> Reload System
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
