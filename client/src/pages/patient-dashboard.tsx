import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, FileText, CircleDollarSign } from "lucide-react";
import { AppointmentForm } from "@/components/appointment-form";
import { AppointmentList } from "@/components/appointment-list";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertAppointment } from "@shared/schema";

export default function PatientDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get patient's appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments/patient"],
    enabled: !!user && user.role === "patient",
  });

  // Get all doctors for appointment booking
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "patient",
  });

  // Get patient's medical records
  const { data: medicalRecords, isLoading: isLoadingMedicalRecords } = useQuery({
    queryKey: ["/api/medical-records/patient", user?.id],
    enabled: !!user && user.role === "patient",
  });

  // Get patient's prescriptions
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ["/api/prescriptions/patient", user?.id],
    enabled: !!user && user.role === "patient",
  });

  // Get patient's invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/invoices/patient", user?.id],
    enabled: !!user && user.role === "patient",
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: Partial<InsertAppointment>) => {
      return await apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Appointment booked",
        description: "Your appointment has been successfully scheduled.",
      });
      setShowAppointmentForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleBookAppointment = (data: Partial<InsertAppointment>) => {
    if (user) {
      bookAppointmentMutation.mutate({
        ...data,
        patientId: user.id,
      });
    }
  };

  // Filter doctors only (for appointment booking)
  const doctorsList = doctors?.filter(u => u.role === "doctor") || [];

  // Get the next appointment
  const getNextAppointment = () => {
    if (!appointments || appointments.length === 0) return null;
    
    const now = new Date();
    const upcomingAppointments = appointments
      .filter(a => new Date(a.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  };

  const nextAppointment = getNextAppointment();
  const nextAppointmentDoctor = nextAppointment 
    ? doctors?.find(d => d.id === nextAppointment.doctorId) 
    : null;

  const activePrescriptionsCount = prescriptions?.length || 0;
  const pendingInvoicesCount = invoices?.filter(i => !i.isPaid).length || 0;
  const pendingInvoicesTotal = invoices
    ?.filter(i => !i.isPaid)
    .reduce((total, invoice) => total + invoice.amount, 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert cents to dollars
  };

  const isLoading = isLoadingAppointments || isLoadingDoctors;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-white md:flex bg-white shadow-sm">
          <div className="flex-1 px-4 py-2 flex justify-between items-center">
            <button 
              type="button" 
              className="md:hidden px-4 text-gray-500 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <button type="button" className="p-1 text-gray-600 rounded-full hover:text-gray-700 focus:outline-none">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 pb-8 px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Patient Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.fullName || "Patient"}
            </p>
          </div>

          {nextAppointment && (
            <div className="mb-6">
              <div className="bg-blue-50 border-l-4 border-primary p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Appointment Reminder
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You have an upcoming appointment with {nextAppointmentDoctor?.fullName || "your doctor"} on {format(new Date(nextAppointment.date), "EEEE, MMMM d")} at {format(new Date(nextAppointment.date), "h:mm a")}.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button type="button" className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600">
                          Reschedule
                        </button>
                        <button type="button" className="ml-3 bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatsCard
                  title="Next Appointment"
                  value={nextAppointment 
                    ? format(new Date(nextAppointment.date), "MMM d, yyyy")
                    : "No upcoming appointments"}
                  description={nextAppointmentDoctor 
                    ? `${nextAppointmentDoctor.fullName} - ${nextAppointmentDoctor.specialty || "Doctor"}`
                    : ""}
                  icon={Calendar}
                  linkText="View all appointments"
                  linkHref="/patient/appointments"
                />

                <StatsCard
                  title="Prescriptions"
                  value={`${activePrescriptionsCount} Active`}
                  description="Last updated: Recently"
                  icon={FileText}
                  linkText="View prescriptions"
                  linkHref="/patient/records"
                  iconColor="text-green-600"
                  iconBgColor="bg-green-100"
                />

                <StatsCard
                  title="Billing"
                  value={formatCurrency(pendingInvoicesTotal)}
                  description={pendingInvoicesCount > 0 
                    ? `${pendingInvoicesCount} pending ${pendingInvoicesCount === 1 ? 'invoice' : 'invoices'}`
                    : "No pending payments"}
                  icon={CircleDollarSign}
                  linkText="Pay now"
                  linkHref="/patient/billing"
                  iconColor="text-purple-600"
                  iconBgColor="bg-purple-100"
                />
              </div>

              {showAppointmentForm ? (
                <AppointmentForm
                  doctors={doctorsList}
                  patientId={user?.id}
                  onSubmit={handleBookAppointment}
                  onCancel={() => setShowAppointmentForm(false)}
                  isLoading={bookAppointmentMutation.isPending}
                />
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">Your Appointments</CardTitle>
                    <button
                      onClick={() => setShowAppointmentForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Book New Appointment
                    </button>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <AppointmentList
                      appointments={appointments || []}
                      users={doctors || []}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
