import { Link } from "next/link";
import { ErrorState, Button } from "@schoolerp/ui";

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center">
        <ErrorState 
          type="404"
          onGoHome={() => window.location.href = "/"}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Still lost? Contact support at <a href="mailto:support@schoolerp.com" className="underline hover:text-primary">support@schoolerp.com</a>
        </p>
      </div>
    </div>
  );
}
