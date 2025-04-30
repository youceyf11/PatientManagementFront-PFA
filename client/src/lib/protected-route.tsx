import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type Role = "admin" | "doctor" | "receptionist" | "patient";

export function ProtectedRoute({
  path,
  component: Component,
  roles = []
}: {
  path: string;
  component: () => React.JSX.Element;
  roles?: Role[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (roles.length > 0 && !roles.includes(user.role as Role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-center text-muted-foreground">
            You don't have permission to access this page. This area is restricted to {roles.join(", ")} users.
          </p>
          <Redirect to={`/${user.role}/dashboard`} />
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

export function RoleRedirect({ path }: { path: string }) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {!isLoading && user && (
        <Redirect to={`/${user.role}/dashboard`} />
      )}
      {!isLoading && !user && (
        <Redirect to="/auth" />
      )}
      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </Route>
  );
}
