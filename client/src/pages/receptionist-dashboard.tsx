import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, UserPlus, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppointmentList } from "@/components/appointment-list";
import { AppointmentForm } from "@/components/appointment-form";
import { InvoiceTable } from "@/components/invoice-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertAppointment, InsertInvoice } from "@shared/schema";
import { format } from "date-fns";

export default function ReceptionistDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get all appointments for today
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments", { date: selectedDate, doctorId: selectedDoctorId }],
    enabled: !!user && user.role === "receptionist",
  });

  // Get all users (patients, doctors)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "receptionist",
  });

  // Get all invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user && user.role === "receptionist",
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: Partial<InsertAppointment>) => {
      return await apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Appointment booked",
        description: "The appointment has been successfully scheduled.",
      });
      setShowAppointmentForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PUT", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Appointment status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update appointment status.",
        variant: "destructive",
      });
    },
  });

  const markInvoiceAsPaidMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return await apiRequest("PUT", `/api/invoices/${invoiceId}`, { isPaid: true });
    },
    onSuccess: () => {
      toast({
        title: "Invoice updated",
        description: "Invoice has been marked as paid.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update invoice status.",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: Partial<InsertInvoice>) => {
      return await apiRequest("POST", "/api/invoices", invoiceData);
    },
    onSuccess: () => {
      toast({
        title: "Invoice created",
        description: "A new invoice has been generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invoice",
        description: error.message || "There was an error generating the invoice.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleBookAppointment = (data: Partial<InsertAppointment>) => {
    bookAppointmentMutation.mutate(data);
  };

  const handleCheckIn = (appointmentId: number) => {
    updateAppointmentStatusMutation.mutate({ id: appointmentId, status: "checked_in" });
  };

  const handleMarkAsPaid = (invoiceId: number) => {
    markInvoiceAsPaidMutation.mutate(invoiceId);
  };

  const handleGenerateInvoice = (appointmentId: number) => {
    const appointment = appointments?.find(a => a.id === appointmentId);
    
    if (appointment) {
      // Simple example invoice generation
      const invoiceData: Partial<InsertInvoice> = {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        amount: 15000, // $150.00 in cents
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isPaid: false,
      };
      
      createInvoiceMutation.mutate(invoiceData);
    }
  };

  // Filter doctors for the dropdown
  const doctorsList = users?.filter(u => u.role === "doctor") || [];

  // Count appointments by status
  const getTodayStats = () => {
    if (!appointments) return { total: 0, checkedIn: 0, pending: 0, noShow: 0 };
    
    const total = appointments.length;
    const checkedIn = appointments.filter(a => a.status === "checked_in" || a.status === "with_doctor" || a.status === "completed").length;
    const pending = appointments.filter(a => a.status === "scheduled").length;
    const noShow = appointments.filter(a => a.status === "no_show").length;
    
    return { total, checkedIn, pending, noShow };
  };

  const todayStats = getTodayStats();

  // Filter appointments based on search query
  const filteredAppointments = appointments?.filter(appointment => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    
    // Search by patient name
    const patient = users?.find(u => u.id === appointment.patientId);
    if (patient?.fullName.toLowerCase().includes(searchLower)) return true;
    
    // Search by doctor name
    const doctor = users?.find(u => u.id === appointment.doctorId);
    if (doctor?.fullName.toLowerCase().includes(searchLower)) return true;
    
    return false;
  }) || [];

  const isLoading = isLoadingAppointments || isLoadingUsers || isLoadingInvoices;

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
            <div className="flex-1 flex">
              <div className="w-full max-w-lg lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <Input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2"
                    placeholder="Search patients, doctors..."
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
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
            <h1 className="text-2xl font-semibold text-gray-900">Front Desk Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome {user?.fullName || "Receptionist"}, manage patient appointments and check-ins
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                {showAppointmentForm ? (
                  <AppointmentForm
                    doctors={doctorsList}
                    onSubmit={handleBookAppointment}
                    onCancel={() => setShowAppointmentForm(false)}
                    isLoading={bookAppointmentMutation.isPending}
                  />
                ) : (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-gray-50">
                      <div>
                        <CardTitle>Today's Appointments</CardTitle>
                        <CardDescription>
                          {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-auto"
                        />
                        <Select
                          value={selectedDoctorId || ""}
                          onValueChange={(value) => setSelectedDoctorId(value || null)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Doctors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Doctors</SelectItem>
                            {doctorsList.map(doctor => (
                              <SelectItem key={doctor.id} value={String(doctor.id)}>
                                {doctor.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <AppointmentList
                        appointments={filteredAppointments}
                        users={users || []}
                        onChangeStatus={handleCheckIn}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full" 
                      onClick={() => setShowAppointmentForm(true)}
                    >
                      <PlusCircle className="mr-2 h-5 w-5" />
                      New Appointment
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="secondary"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Register New Patient
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      View Full Schedule
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 py-0">
                    <dl>
                      <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Total Appointments
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {todayStats.total}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Checked In
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {todayStats.checkedIn}
                        </dd>
                      </div>
                      <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Pending Check-in
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {todayStats.pending}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          No-shows
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {todayStats.noShow}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Billing Management</CardTitle>
                <CardDescription>
                  Process payments and generate invoices
                </CardDescription>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </CardHeader>
            <CardContent>
              <InvoiceTable
                invoices={invoices || []}
                users={users || []}
                onMarkAsPaid={handleMarkAsPaid}
                onGenerateInvoice={handleGenerateInvoice}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
