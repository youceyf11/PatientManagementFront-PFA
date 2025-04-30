import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertAppointment, User } from "@shared/schema";

const appointmentSchema = z.object({
  doctorId: z.string().min(1, { message: "Please select a doctor" }),
  type: z.string().min(1, { message: "Please select an appointment type" }),
  date: z.string().min(1, { message: "Please select a date" }),
  time: z.string().min(1, { message: "Please select a time" }),
  notes: z.string().optional()
});

type AppointmentFormProps = {
  doctors: User[];
  patientId?: number;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

export function AppointmentForm({
  doctors,
  patientId,
  onSubmit,
  onCancel,
  isLoading = false
}: AppointmentFormProps) {
  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: "",
      type: "",
      date: "",
      time: "",
      notes: ""
    }
  });

  const handleSubmit = (values: z.infer<typeof appointmentSchema>) => {
    // Convert form values to appointment data format
    const appointmentData: Partial<InsertAppointment> = {
      doctorId: parseInt(values.doctorId),
      patientId: patientId || 0, // This would come from the current user or be set by admin/receptionist
      type: values.type,
      date: new Date(`${values.date}T${values.time}`), // Combine date and time
      duration: 30, // Default duration in minutes
      status: 'scheduled',
      notes: values.notes
    };
    
    onSubmit(appointmentData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book New Appointment</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Doctor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          {doctor.fullName} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appointment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="check_up">Regular Check-up</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="emergency">Urgent Care</SelectItem>
                      <SelectItem value="prescription_refill">Prescription Refill</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split('T')[0]} // Prevent past dates
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="09:30">9:30 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="10:30">10:30 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="11:30">11:30 AM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="13:30">1:30 PM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="14:30">2:30 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="15:30">3:30 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="16:30">4:30 PM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your symptoms or reason for visit"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide any relevant information for your appointment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2 bg-gray-50 px-6 py-4">
            {onCancel && (
              <Button 
                variant="outline" 
                type="button"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button 
              variant="default" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
