import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute, RoleRedirect } from "./lib/protected-route";
import AuthPage from "./pages/auth-page";
import AdminDashboard from "./pages/admin-dashboard";
import DoctorDashboard from "./pages/doctor-dashboard";
import PatientDashboard from "./pages/patient-dashboard";
import ReceptionistDashboard from "./pages/receptionist-dashboard";

function Router() {
  return (
    <Switch>
      <RoleRedirect path="/" />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute 
        path="/admin/dashboard" 
        component={AdminDashboard} 
        roles={["admin"]} 
      />
      
      {/* Doctor Routes */}
      <ProtectedRoute 
        path="/doctor/dashboard" 
        component={DoctorDashboard} 
        roles={["doctor"]} 
      />
      
      {/* Patient Routes */}
      <ProtectedRoute 
        path="/patient/dashboard" 
        component={PatientDashboard} 
        roles={["patient"]} 
      />
      
      {/* Receptionist Routes */}
      <ProtectedRoute 
        path="/receptionist/dashboard" 
        component={ReceptionistDashboard} 
        roles={["receptionist"]} 
      />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
