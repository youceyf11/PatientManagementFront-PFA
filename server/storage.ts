import { users, appointments, medicalRecords, prescriptions, invoices, 
  type User, type InsertUser, type Appointment, type InsertAppointment,
  type MedicalRecord, type InsertMedicalRecord, type Prescription, 
  type InsertPrescription, type Invoice, type InsertInvoice } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Appointment management
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Medical records management
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]>;
  updateMedicalRecord(id: number, record: Partial<MedicalRecord>): Promise<MedicalRecord | undefined>;
  
  // Prescription management
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByMedicalRecord(recordId: number): Promise<Prescription[]>;
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  
  // Invoice management
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByPatient(patientId: number): Promise<Invoice[]>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private appointments: Map<number, Appointment>;
  private medicalRecords: Map<number, MedicalRecord>;
  private prescriptions: Map<number, Prescription>;
  private invoices: Map<number, Invoice>;
  
  currentUserId = 1;
  currentAppointmentId = 1;
  currentMedicalRecordId = 1;
  currentPrescriptionId = 1;
  currentInvoiceId = 1;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.appointments = new Map();
    this.medicalRecords = new Map();
    this.prescriptions = new Map();
    this.invoices = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with sample admin user
    this.createUser({
      username: "admin",
      password: "password123",
      email: "admin@example.com",
      role: "admin",
      fullName: "Admin User",
      phone: "555-123-4567",
      specialty: null
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Appointment methods
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const newAppointment: Appointment = {
      ...appointment,
      id,
      createdAt: new Date()
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appt => appt.patientId === patientId);
  }
  
  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appt => appt.doctorId === doctorId);
  }
  
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appt => {
        const apptDate = new Date(appt.date);
        return apptDate.getFullYear() === date.getFullYear() &&
               apptDate.getMonth() === date.getMonth() &&
               apptDate.getDate() === date.getDate();
      });
  }
  
  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Medical record methods
  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.currentMedicalRecordId++;
    const newRecord: MedicalRecord = {
      ...record,
      id,
      createdAt: new Date()
    };
    this.medicalRecords.set(id, newRecord);
    return newRecord;
  }
  
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }
  
  async getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values())
      .filter(record => record.patientId === patientId);
  }
  
  async updateMedicalRecord(id: number, recordData: Partial<MedicalRecord>): Promise<MedicalRecord | undefined> {
    const record = this.medicalRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...recordData };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Prescription methods
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const id = this.currentPrescriptionId++;
    const newPrescription: Prescription = {
      ...prescription,
      id,
      createdAt: new Date()
    };
    this.prescriptions.set(id, newPrescription);
    return newPrescription;
  }
  
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }
  
  async getPrescriptionsByMedicalRecord(recordId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values())
      .filter(prescription => prescription.medicalRecordId === recordId);
  }
  
  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    // First get all medical records for this patient
    const patientRecords = await this.getMedicalRecordsByPatient(patientId);
    const recordIds = patientRecords.map(record => record.id);
    
    // Then find all prescriptions linked to those records
    return Array.from(this.prescriptions.values())
      .filter(prescription => recordIds.includes(prescription.medicalRecordId));
  }

  // Invoice methods
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const newInvoice: Invoice = {
      ...invoice,
      id,
      createdAt: new Date()
    };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async getInvoicesByPatient(patientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.patientId === patientId);
  }
  
  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
}

export const storage = new MemStorage();
