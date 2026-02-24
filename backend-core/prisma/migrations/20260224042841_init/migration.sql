-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECH', 'NURSE', 'RECEPTIONIST', 'PATIENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'PROCEDURE', 'LAB_VISIT', 'RADIOLOGY', 'VACCINATION', 'TELEMEDICINE');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISPENSED', 'PARTIALLY_DISPENSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LabOrderPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "PharmacyTransactionType" AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'EXPIRED_DISPOSAL', 'TRANSFER');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT', 'APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'LAB_RESULT_READY', 'PRESCRIPTION_READY', 'LOW_STOCK_ALERT', 'EXPIRY_ALERT', 'GENERAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "WardType" AS ENUM ('GENERAL', 'ICU', 'EMERGENCY', 'MATERNITY', 'PEDIATRIC', 'SURGICAL', 'CARDIAC', 'ONCOLOGY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logo_url" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "head_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "UserRole" NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "email_verify_token" TEXT,
    "refresh_token_hash" TEXT,
    "department_id" TEXT,
    "specialization" TEXT,
    "license_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "mrn" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "blood_group" "BloodGroup" NOT NULL DEFAULT 'UNKNOWN',
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "emergency_contact" JSONB,
    "insurance_info" JSONB,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chronic_conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "department_id" TEXT,
    "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_mins" INTEGER NOT NULL DEFAULT 30,
    "chief_complaint" TEXT,
    "notes" TEXT,
    "room_number" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "recorded_by" TEXT,
    "temperature" DOUBLE PRECISION,
    "blood_pressure_systolic" INTEGER,
    "blood_pressure_diastolic" INTEGER,
    "pulse_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "oxygen_saturation" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "pain_scale" INTEGER,
    "blood_glucose" DOUBLE PRECISION,
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "diagnosis" TEXT,
    "notes" TEXT,
    "valid_until" TIMESTAMP(3),
    "dispensed_at" TIMESTAMP(3),
    "dispensed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "inventory_item_id" TEXT,
    "drug_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "quantity_prescribed" INTEGER NOT NULL,
    "quantity_dispensed" INTEGER NOT NULL DEFAULT 0,
    "route" TEXT,
    "instructions" TEXT,
    "is_substitutable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "license_no" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_inventory" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "drug_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "brand_name" TEXT,
    "sku" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "barcode" TEXT,
    "category" TEXT NOT NULL,
    "formulation" TEXT,
    "manufacturer" TEXT,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "manufacture_date" TIMESTAMP(3),
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "max_stock_level" INTEGER,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "mrp" DECIMAL(10,2),
    "storage_condition" TEXT,
    "controlled_drug" BOOLEAN NOT NULL DEFAULT false,
    "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "type" "PharmacyTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "performed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensing_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity_dispensed" INTEGER NOT NULL,
    "dispensed_by" TEXT NOT NULL,
    "dispensed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "dispensing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "previous_quantity" INTEGER NOT NULL,
    "new_quantity" INTEGER NOT NULL,
    "adjustment_reason" TEXT NOT NULL,
    "adjusted_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "total_amount" DECIMAL(12,2) NOT NULL,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "drug_name" TEXT NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "sample_type" TEXT,
    "sample_volume" TEXT,
    "turnaround_time" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "reference_ranges" JSONB,
    "instructions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_fasting" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "technician_id" TEXT,
    "order_number" TEXT NOT NULL,
    "status" "LabOrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LabOrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "clinical_notes" TEXT,
    "sample_collected_at" TIMESTAMP(3),
    "sample_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_items" (
    "id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "lab_test_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "results" JSONB,
    "result_notes" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_files" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "minio_bucket" TEXT NOT NULL,
    "minio_key" TEXT NOT NULL,
    "checksum" TEXT,
    "is_dicom" BOOLEAN NOT NULL DEFAULT false,
    "dicom_metadata" JSONB,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "department_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "WardType" NOT NULL DEFAULT 'GENERAL',
    "total_beds" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ward_id" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bed_admissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "admitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharged_at" TIMESTAMP(3),
    "admission_notes" TEXT,
    "discharge_notes" TEXT,
    "admitted_by" TEXT NOT NULL,
    "discharged_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bed_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "category" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "transaction_id" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "received_by" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenant_id_code_key" ON "departments"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_id_idx" ON "users"("tenant_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_employee_id_key" ON "users"("tenant_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

-- CreateIndex
CREATE INDEX "patients_tenant_id_idx" ON "patients"("tenant_id");

-- CreateIndex
CREATE INDEX "patients_tenant_id_mrn_idx" ON "patients"("tenant_id", "mrn");

-- CreateIndex
CREATE UNIQUE INDEX "patients_tenant_id_mrn_key" ON "patients"("tenant_id", "mrn");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_patient_id_idx" ON "appointments"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_doctor_id_idx" ON "appointments"("tenant_id", "doctor_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_scheduled_at_idx" ON "appointments"("tenant_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "vital_signs_tenant_id_idx" ON "vital_signs"("tenant_id");

-- CreateIndex
CREATE INDEX "vital_signs_tenant_id_patient_id_idx" ON "vital_signs"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_tenant_id_idx" ON "prescriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "prescriptions_tenant_id_patient_id_idx" ON "prescriptions"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_tenant_id_doctor_id_idx" ON "prescriptions"("tenant_id", "doctor_id");

-- CreateIndex
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items"("prescription_id");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "pharmacy_inventory_tenant_id_idx" ON "pharmacy_inventory"("tenant_id");

-- CreateIndex
CREATE INDEX "pharmacy_inventory_tenant_id_sku_idx" ON "pharmacy_inventory"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "pharmacy_inventory_tenant_id_expiry_date_idx" ON "pharmacy_inventory"("tenant_id", "expiry_date");

-- CreateIndex
CREATE INDEX "pharmacy_inventory_tenant_id_status_idx" ON "pharmacy_inventory"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_inventory_tenant_id_batch_number_sku_key" ON "pharmacy_inventory"("tenant_id", "batch_number", "sku");

-- CreateIndex
CREATE INDEX "pharmacy_transactions_tenant_id_idx" ON "pharmacy_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "pharmacy_transactions_inventory_item_id_idx" ON "pharmacy_transactions"("inventory_item_id");

-- CreateIndex
CREATE INDEX "dispensing_logs_tenant_id_idx" ON "dispensing_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "dispensing_logs_prescription_id_idx" ON "dispensing_logs"("prescription_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_tenant_id_idx" ON "stock_adjustments"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_idx" ON "purchase_orders"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_tenant_id_po_number_key" ON "purchase_orders"("tenant_id", "po_number");

-- CreateIndex
CREATE INDEX "lab_tests_tenant_id_idx" ON "lab_tests"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_tenant_id_code_key" ON "lab_tests"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "lab_orders_tenant_id_idx" ON "lab_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "lab_orders_tenant_id_patient_id_idx" ON "lab_orders"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "lab_orders_tenant_id_status_idx" ON "lab_orders"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_tenant_id_order_number_key" ON "lab_orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "lab_order_items_lab_order_id_idx" ON "lab_order_items"("lab_order_id");

-- CreateIndex
CREATE INDEX "lab_files_tenant_id_idx" ON "lab_files"("tenant_id");

-- CreateIndex
CREATE INDEX "lab_files_lab_order_id_idx" ON "lab_files"("lab_order_id");

-- CreateIndex
CREATE INDEX "wards_tenant_id_idx" ON "wards"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "wards_tenant_id_code_key" ON "wards"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "beds_tenant_id_idx" ON "beds"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "beds_ward_id_bed_number_key" ON "beds"("ward_id", "bed_number");

-- CreateIndex
CREATE INDEX "bed_admissions_tenant_id_idx" ON "bed_admissions"("tenant_id");

-- CreateIndex
CREATE INDEX "bed_admissions_patient_id_idx" ON "bed_admissions"("patient_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_patient_id_idx" ON "invoices"("tenant_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "staff_schedules_tenant_id_idx" ON "staff_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "staff_schedules_user_id_idx" ON "staff_schedules"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_user_id_idx" ON "audit_logs"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_resource_idx" ON "audit_logs"("tenant_id", "resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_idx" ON "notifications"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_status_idx" ON "notifications"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "pharmacy_inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_transactions" ADD CONSTRAINT "pharmacy_transactions_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "pharmacy_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensing_logs" ADD CONSTRAINT "dispensing_logs_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensing_logs" ADD CONSTRAINT "dispensing_logs_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "pharmacy_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "pharmacy_inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_files" ADD CONSTRAINT "lab_files_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bed_admissions" ADD CONSTRAINT "bed_admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bed_admissions" ADD CONSTRAINT "bed_admissions_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
