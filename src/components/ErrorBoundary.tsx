import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // Clear potentially corrupted state to allow recovery
        try {
            localStorage.removeItem("app_nav_state");
            sessionStorage.removeItem("app_view_state");
        } catch (e) {
            console.error("Failed to clear storage:", e);
        }
    }

    handleReset = () => {
        // Clear all app state
        try {
            localStorage.removeItem("app_nav_state");
            sessionStorage.removeItem("app_view_state");
        } catch (e) {
            console.error("Failed to clear storage:", e);
        }

        // Reload the page
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="h-screen bg-background flex items-center justify-center p-6">
                    <div className="flex flex-col items-center text-center max-w-sm">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            The app encountered an unexpected error. Please try refreshing.
                        </p>
                        <Button onClick={this.handleReset} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Refresh App
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
