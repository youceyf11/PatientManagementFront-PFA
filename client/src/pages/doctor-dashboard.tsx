import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { AppointmentList } from "@/components/appointment-list";
import { MedicalRecordView } from "@/components/medical-record";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DoctorDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get doctor's appointments for today
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments", { doctorId: user?.id }],
    enabled: !!user && user.role === "doctor",
  });

  // Get all patients for reference
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "doctor",
  });

  // Get selected patient's medical records
  const { data: medicalRecords, isLoading: isLoadingMedicalRecords } = useQuery({
    queryKey: ["/api/medical-records/patient", selectedPatientId],
    enabled: !!selectedPatientId,
  });

  // Get selected patient's prescriptions
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ["/api/prescriptions/patient", selectedPatientId],
    enabled: !!selectedPatientId,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleViewPatient = (appointmentId: number) => {
    const appointment = appointments?.find(a => a.id === appointmentId);
    if (appointment) {
      setSelectedPatientId(appointment.patientId);
    }
  };

  const handleUpdateMedicalRecord = async (data: { notes: string }) => {
    if (!selectedPatientId || !user) return;

    try {
      // Create a new medical record if none exists
      if (!medicalRecords || medicalRecords.length === 0) {
        await apiRequest("POST", "/api/medical-records", {
          patientId: selectedPatientId,
          doctorId: user.id,
          visitDate: new Date(),
          notes: data.notes
        });
      } else {
        // Otherwise update the most recent one
        const latestRecord = medicalRecords[0]; // Assuming sorted by date
        await apiRequest("PUT", `/api/medical-records/${latestRecord.id}`, {
          notes: data.notes
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/medical-records/patient", selectedPatientId]
      });

      toast({
        title: "Medical record updated",
        description: "The patient's medical record has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update record",
        description: "There was an error saving the medical record.",
        variant: "destructive",
      });
    }
  };

  const handleAddPrescription = async (data: { medication: string; dosage: string; instructions: string }) => {
    if (!selectedPatientId || !medicalRecords || medicalRecords.length === 0) {
      toast({
        title: "Can't add prescription",
        description: "Please save medical record first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const latestRecord = medicalRecords[0]; // Assuming sorted by date
      
      await apiRequest("POST", "/api/prescriptions", {
        medicalRecordId: latestRecord.id,
        medication: data.medication,
        dosage: data.dosage,
        instructions: data.instructions,
        startDate: new Date()
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/prescriptions/patient", selectedPatientId]
      });

      toast({
        title: "Prescription added",
        description: "The prescription has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to add prescription",
        description: "There was an error adding the prescription.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePdf = () => {
    toast({
      title: "PDF Generation",
      description: "This feature will allow you to generate prescription and medical record PDFs.",
    });
  };

  const isLoading = isLoadingAppointments || isLoadingUsers;
  const selectedPatient = users?.find(u => u.id === selectedPatientId);

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
            <h1 className="text-2xl font-semibold text-gray-900">Doctor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.fullName || "Doctor"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Today's Appointments
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <AppointmentList 
                appointments={appointments || []} 
                users={users || []}
                onViewDetails={handleViewPatient}
              />
            </div>
          )}

          {selectedPatient && (
            <div className="mt-8">
              {isLoadingMedicalRecords || isLoadingPrescriptions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <MedicalRecordView
                  patient={selectedPatient}
                  medicalRecord={medicalRecords && medicalRecords.length > 0 ? medicalRecords[0] : undefined}
                  prescriptions={prescriptions || []}
                  isEditable={true}
                  onSave={handleUpdateMedicalRecord}
                  onPrescribe={handleAddPrescription}
                  onGeneratePdf={handleGeneratePdf}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
