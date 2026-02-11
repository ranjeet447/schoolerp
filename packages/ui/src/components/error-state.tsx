"use client";

import * as React from "react";
import { AlertTriangle, WifiOff, FileSearch, RefreshCcw, Home } from "lucide-react";
import { Button } from "./button";
import { cn } from "../lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "error" | "offline" | "404" | "server";
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ className, type = "error", title, description, onRetry, onGoHome, ...props }, ref) => {
    const config = {
      error: {
        icon: AlertTriangle,
        iconClass: "text-destructive",
        defaultTitle: "Oops! Something went wrong",
        defaultDescription: "An unexpected error occurred. Please try again later.",
      },
      offline: {
        icon: WifiOff,
        iconClass: "text-muted-foreground",
        defaultTitle: "No Internet Connection",
        defaultDescription: "It looks like you're offline. Please check your network settings.",
      },
      404: {
        icon: FileSearch,
        iconClass: "text-primary",
        defaultTitle: "Page Not Found",
        defaultDescription: "The page you looking for doesn't exist or has been moved.",
      },
      server: {
        icon: AlertTriangle,
        iconClass: "text-orange-500",
        defaultTitle: "Server Error",
        defaultDescription: "We're having some trouble on our end. Please bear with us.",
      },
    }[type];

    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300",
          className
        )}
        {...props}
      >
        <div className={cn("mb-6 rounded-full bg-muted p-6", config.iconClass)}>
          <Icon className="h-12 w-12" />
        </div>
        
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          {title || config.defaultTitle}
        </h2>
        
        <p className="mb-8 max-w-[400px] text-muted-foreground">
          {description || config.defaultDescription}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {onRetry && (
            <Button onClick={onRetry} variant="default" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          )}
        </div>
      </div>
    );
  }
);

ErrorState.displayName = "ErrorState";

export { ErrorState };
