import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MedicalRecord, Prescription, User } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";

type MedicalRecordViewProps = {
  patient: User;
  medicalRecord?: MedicalRecord;
  prescriptions?: Prescription[];
  isEditable?: boolean;
  onSave?: (data: { notes: string }) => void;
  onPrescribe?: (data: { medication: string; dosage: string; instructions: string }) => void;
  onGeneratePdf?: () => void;
};

export function MedicalRecordView({
  patient,
  medicalRecord,
  prescriptions = [],
  isEditable = false,
  onSave,
  onPrescribe,
  onGeneratePdf
}: MedicalRecordViewProps) {
  const [notes, setNotes] = useState(medicalRecord?.notes || "");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");

  const calculateAge = (birthDate: string) => {
    // Placeholder for patient age calculation
    return "35";
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ notes });
    }
  };

  const handlePrescribe = () => {
    if (onPrescribe && medication && dosage) {
      onPrescribe({ medication, dosage, instructions });
      setMedication("");
      setDosage("");
      setInstructions("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Medical Record</CardTitle>
        <div className="text-sm text-muted-foreground">
          Currently viewing: {patient.fullName}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Patient Name
            </label>
            <div className="mt-1 text-sm text-gray-900">{patient.fullName}</div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Contact Information
            </label>
            <div className="mt-1 text-sm text-gray-900">
              {patient.email}<br />
              {patient.phone || 'No phone number provided'}
            </div>
          </div>

          {medicalRecord && (
            <>
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Visit Date
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {format(new Date(medicalRecord.visitDate), 'MMMM d, yyyy')}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Diagnosis
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {medicalRecord.diagnosis || 'No diagnosis recorded'}
                </div>
              </div>
            </>
          )}

          {prescriptions.length > 0 && (
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">
                Current Medications
              </label>
              <div className="mt-1 text-sm text-gray-900">
                <ul className="list-disc pl-5 space-y-1">
                  {prescriptions.map((prescription, index) => (
                    <li key={index}>
                      {prescription.medication} {prescription.dosage} 
                      {prescription.instructions && ` - ${prescription.instructions}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isEditable && (
            <>
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Add Notes for Current Visit
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
                  Add Prescription
                </label>
                <div className="mt-1 grid grid-cols-1 gap-y-2 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <Input
                      type="text"
                      value={medication}
                      onChange={(e) => setMedication(e.target.value)}
                      placeholder="Medication name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="Dosage"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Button
                      type="button"
                      onClick={handlePrescribe}
                      disabled={!medication || !dosage}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="sm:col-span-6">
                    <Input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Instructions (optional)"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files
                </label>
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      {isEditable && (
        <CardFooter className="flex justify-end space-x-2 bg-gray-50 px-6 py-4">
          <Button 
            variant="outline" 
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            type="button"
            onClick={handleSave}
          >
            Save Record
          </Button>
          {onGeneratePdf && (
            <Button
              variant="secondary"
              type="button"
              onClick={onGeneratePdf}
            >
              Generate PDF
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
