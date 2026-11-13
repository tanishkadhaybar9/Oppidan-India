import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#fff7f2] flex items-center justify-center p-6">
          <div className="bg-white border border-[#eadbd2] rounded-3xl p-8 max-w-lg w-full shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-heading font-extrabold text-[#252525] mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-[#77716e] leading-relaxed mb-6">
              An unexpected component error occurred while rendering this view. Our error tracking system has logged this incident.
            </p>

            {this.state.error?.message && (
              <div className="bg-[#fffcfb] border border-[#eadbd2] rounded-xl p-3 text-left mb-6 font-mono text-[11px] text-rose-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#eadbd2] text-xs font-semibold text-[#252525] hover:border-[#f47b5b] transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f47b5b] text-white text-xs font-semibold hover:bg-[#d95d3d] shadow-xs transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
