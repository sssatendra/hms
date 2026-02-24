import mongoose, { Schema, Document, model } from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function connectMongoDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodb.uri);
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB', { error });
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

// ─── EMR Clinical Note Schema ──────────────────────────────────────────────

export interface IClinicalNote extends Document {
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: Date;
  subjective: string;          // Patient complaints (SOAP)
  objective: string;           // Examination findings (SOAP)
  assessment: string;          // Diagnosis/Assessment (SOAP)
  plan: string;                // Treatment plan (SOAP)
  chief_complaint: string;
  vitals?: {
    temperature?: number;
    blood_pressure_sys?: number;
    blood_pressure_dia?: number;
    pulse_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  };
  icd_codes: string[];         // ICD-10 codes
  allergies_noted: string[];
  follow_up_instructions?: string;
  attachments?: Array<{
    file_name: string;
    minio_key: string;
    file_type: string;
  }>;
  is_signed: boolean;
  signed_at?: Date;
  is_amended: boolean;
  amendment_reason?: string;
  amendments: Array<{
    amended_by: string;
    amended_at: Date;
    reason: string;
    previous_values: Record<string, unknown>;
  }>;
  created_at: Date;
  updated_at: Date;
}

const ClinicalNoteSchema = new Schema<IClinicalNote>(
  {
    tenant_id: { type: String, required: true, index: true },
    patient_id: { type: String, required: true, index: true },
    doctor_id: { type: String, required: true },
    appointment_id: { type: String },
    visit_date: { type: Date, required: true },
    subjective: { type: String, default: '' },
    objective: { type: String, default: '' },
    assessment: { type: String, required: true },
    plan: { type: String, default: '' },
    chief_complaint: { type: String, default: '' },
    vitals: {
      temperature: Number,
      blood_pressure_sys: Number,
      blood_pressure_dia: Number,
      pulse_rate: Number,
      respiratory_rate: Number,
      oxygen_saturation: Number,
      weight: Number,
      height: Number,
      bmi: Number,
    },
    icd_codes: [{ type: String }],
    allergies_noted: [{ type: String }],
    follow_up_instructions: { type: String },
    attachments: [
      {
        file_name: String,
        minio_key: String,
        file_type: String,
      },
    ],
    is_signed: { type: Boolean, default: false },
    signed_at: { type: Date },
    is_amended: { type: Boolean, default: false },
    amendment_reason: { type: String },
    amendments: [
      {
        amended_by: String,
        amended_at: Date,
        reason: String,
        previous_values: Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'clinical_notes',
  }
);

ClinicalNoteSchema.index({ tenant_id: 1, patient_id: 1, visit_date: -1 });
ClinicalNoteSchema.index({ tenant_id: 1, doctor_id: 1 });

export const ClinicalNote = model<IClinicalNote>('ClinicalNote', ClinicalNoteSchema);

// ─── System Log Schema ─────────────────────────────────────────────────────

export interface ISystemLog extends Document {
  tenant_id?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  context?: Record<string, unknown>;
  stack_trace?: string;
  created_at: Date;
}

const SystemLogSchema = new Schema<ISystemLog>(
  {
    tenant_id: { type: String, index: true },
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'], required: true },
    message: { type: String, required: true },
    service: { type: String, required: true },
    context: { type: Schema.Types.Mixed },
    stack_trace: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'system_logs',
  }
);

SystemLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export const SystemLog = model<ISystemLog>('SystemLog', SystemLogSchema);
