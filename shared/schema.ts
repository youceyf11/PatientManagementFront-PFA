import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role enum for different user types
export const roleEnum = pgEnum('role', ['admin', 'doctor', 'receptionist', 'patient']);

// User table with role-based authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  specialty: text("specialty"), // For doctors
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clinic information table
export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  workingHours: text("working_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointment status enum
export const appointmentStatusEnum = pgEnum('appointment_status', 
  ['scheduled', 'checked_in', 'with_doctor', 'completed', 'cancelled', 'no_show']);

// Appointment type enum
export const appointmentTypeEnum = pgEnum('appointment_type',
  ['check_up', 'follow_up', 'consultation', 'emergency', 'prescription_refill']);

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  type: appointmentTypeEnum("type").notNull(),
  status: appointmentStatusEnum("status").notNull().default('scheduled'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medical records table
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentId: integer("appointment_id"),
  visitDate: timestamp("visit_date").notNull(),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  medicalRecordId: integer("medical_record_id").notNull(),
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  instructions: text("instructions"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  appointmentId: integer("appointment_id"),
  amount: integer("amount").notNull(), // in cents
  isPaid: boolean("is_paid").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas for all tables
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  fullName: true,
  phone: true,
  specialty: true,
});

export const insertClinicSchema = createInsertSchema(clinics);
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ createdAt: true });
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ createdAt: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ createdAt: true });

// Type exports for all models
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Login data type
export type LoginData = Pick<InsertUser, "username" | "password">;
