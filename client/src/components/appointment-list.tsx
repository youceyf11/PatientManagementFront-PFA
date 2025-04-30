import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { Appointment, User } from "@shared/schema";
import { format } from "date-fns";

type AppointmentListProps = {
  appointments: Appointment[];
  users: User[];
  onViewDetails?: (appointmentId: number) => void;
  onChangeStatus?: (appointmentId: number, status: string) => void;
};

export function AppointmentList({ 
  appointments, 
  users,
  onViewDetails,
  onChangeStatus
}: AppointmentListProps) {
  const getPatient = (patientId: number) => {
    return users.find(user => user.id === patientId);
  };

  const getDoctor = (doctorId: number) => {
    return users.find(user => user.id === doctorId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Scheduled</Badge>;
      case 'checked_in':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Checked In</Badge>;
      case 'with_doctor':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">With Doctor</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'check_up':
        return 'Regular Check-up';
      case 'follow_up':
        return 'Follow-up';
      case 'consultation':
        return 'Consultation';
      case 'emergency':
        return 'Emergency';
      case 'prescription_refill':
        return 'Prescription Refill';
      default:
        return type;
    }
  };

  const formatTime = (date: Date | string) => {
    return format(new Date(date), 'hh:mm a');
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {appointments.length === 0 ? (
          <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
            No appointments found
          </li>
        ) : (
          appointments.map(appointment => {
            const patient = getPatient(appointment.patientId);
            const doctor = getDoctor(appointment.doctorId);
            
            return (
              <li key={appointment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {patient && <UserAvatar user={patient} className="h-10 w-10" />}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient?.fullName || 'Unknown Patient'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getAppointmentTypeLabel(appointment.type)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 flex">
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
                        {formatTime(appointment.date)}
                      </div>
                      <div className="ml-2">
                        {onViewDetails && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(appointment.id)}
                          >
                            View Details
                          </Button>
                        )}
                        {onChangeStatus && appointment.status === 'scheduled' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onChangeStatus(appointment.id, 'checked_in')}
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {doctor && (
                    <div className="mt-2 text-sm text-gray-500">
                      Doctor: {doctor.fullName} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                    </div>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
