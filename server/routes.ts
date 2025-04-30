import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertAppointmentSchema, 
  insertMedicalRecordSchema, 
  insertPrescriptionSchema,
  insertInvoiceSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  const { checkRole } = setupAuth(app);
  
  // User management routes
  app.get("/api/users", checkRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => {
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/users/:id", checkRole(['admin', 'doctor', 'receptionist']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only send the current user's full info to themselves
      if (req.user.id !== userId && req.user.role !== 'admin') {
        const { password, ...userWithoutSensitiveInfo } = user;
        return res.json(userWithoutSensitiveInfo);
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Appointment routes
  app.post("/api/appointments", checkRole(['admin', 'doctor', 'receptionist', 'patient']), async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // If a patient is creating an appointment, ensure it's for themselves
      if (req.user.role === 'patient' && appointmentData.patientId !== req.user.id) {
        return res.status(403).json({ message: "Patients can only book appointments for themselves" });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });
  
  app.get("/api/appointments", checkRole(['admin', 'doctor', 'receptionist']), async (req, res) => {
    try {
      let appointments;
      const { date, doctorId, patientId } = req.query;
      
      if (date) {
        appointments = await storage.getAppointmentsByDate(new Date(date as string));
      } else if (doctorId) {
        appointments = await storage.getAppointmentsByDoctor(parseInt(doctorId as string));
      } else if (patientId) {
        appointments = await storage.getAppointmentsByPatient(parseInt(patientId as string));
      } else {
        // If no filters, return all appointments (restricted to doctors seeing their own)
        if (req.user.role === 'doctor') {
          appointments = await storage.getAppointmentsByDoctor(req.user.id);
        } else {
          // For admin and receptionist, get all appointments
          appointments = Array.from((await storage.getAllUsers())
            .filter(user => user.role === 'doctor')
            .map(async doctor => await storage.getAppointmentsByDoctor(doctor.id))
            .flatMap(appts => appts));
        }
      }
      
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });
  
  app.get("/api/appointments/patient", checkRole(['patient']), async (req, res) => {
    try {
      // Patients can only view their own appointments
      const appointments = await storage.getAppointmentsByPatient(req.user.id);
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });
  
  app.get("/api/appointments/:id", checkRole(['admin', 'doctor', 'receptionist', 'patient']), async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Patients can only view their own appointments
      if (req.user.role === 'patient' && appointment.patientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this appointment" });
      }
      
      // Doctors can only view appointments assigned to them
      if (req.user.role === 'doctor' && appointment.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this appointment" });
      }
      
      res.json(appointment);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });
  
  app.put("/api/appointments/:id", checkRole(['admin', 'doctor', 'receptionist']), async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointmentData = req.body;
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Doctors can only update their own appointments
      if (req.user.role === 'doctor' && appointment.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this appointment" });
      }
      
      const updatedAppointment = await storage.updateAppointment(appointmentId, appointmentData);
      res.json(updatedAppointment);
    } catch (err) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });
  
  // Medical Records routes
  app.post("/api/medical-records", checkRole(['admin', 'doctor']), async (req, res) => {
    try {
      const medicalRecordData = insertMedicalRecordSchema.parse(req.body);
      
      // Doctors can only create medical records for their patients
      if (req.user.role === 'doctor' && medicalRecordData.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Doctors can only create records for their own patients" });
      }
      
      const medicalRecord = await storage.createMedicalRecord(medicalRecordData);
      res.status(201).json(medicalRecord);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical record data", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create medical record" });
    }
  });
  
  app.get("/api/medical-records/patient/:patientId", checkRole(['admin', 'doctor', 'patient']), async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      
      // Patients can only view their own records
      if (req.user.role === 'patient' && patientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view these medical records" });
      }
      
      const records = await storage.getMedicalRecordsByPatient(patientId);
      res.json(records);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch medical records" });
    }
  });
  
  // Prescription routes
  app.post("/api/prescriptions", checkRole(['admin', 'doctor']), async (req, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      
      // Validate that doctor has access to the medical record
      const medicalRecord = await storage.getMedicalRecord(prescriptionData.medicalRecordId);
      if (!medicalRecord) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      
      // Doctors can only create prescriptions for their patients
      if (req.user.role === 'doctor' && medicalRecord.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to create prescription for this patient" });
      }
      
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prescription data", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });
  
  app.get("/api/prescriptions/patient/:patientId", checkRole(['admin', 'doctor', 'patient']), async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      
      // Patients can only view their own prescriptions
      if (req.user.role === 'patient' && patientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view these prescriptions" });
      }
      
      const prescriptions = await storage.getPrescriptionsByPatient(patientId);
      res.json(prescriptions);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });
  
  // Invoice routes
  app.post("/api/invoices", checkRole(['admin', 'receptionist']), async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  
  app.get("/api/invoices/patient/:patientId", checkRole(['admin', 'receptionist', 'patient']), async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      
      // Patients can only view their own invoices
      if (req.user.role === 'patient' && patientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view these invoices" });
      }
      
      const invoices = await storage.getInvoicesByPatient(patientId);
      res.json(invoices);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  app.put("/api/invoices/:id", checkRole(['admin', 'receptionist']), async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoiceData = req.body;
      
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, invoiceData);
      res.json(updatedInvoice);
    } catch (err) {
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
