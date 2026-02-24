-- AlterTable
ALTER TABLE "vital_signs" ADD COLUMN     "admission_id" TEXT;

-- CreateTable
CREATE TABLE "progress_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "admission_id" TEXT,
    "doctor_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_charges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "admission_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoice_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "progress_notes_tenant_id_idx" ON "progress_notes"("tenant_id");

-- CreateIndex
CREATE INDEX "progress_notes_tenant_id_patient_id_idx" ON "progress_notes"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "progress_notes_admission_id_idx" ON "progress_notes"("admission_id");

-- CreateIndex
CREATE INDEX "patient_charges_tenant_id_idx" ON "patient_charges"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_charges_tenant_id_patient_id_idx" ON "patient_charges"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_charges_admission_id_idx" ON "patient_charges"("admission_id");

-- CreateIndex
CREATE INDEX "vital_signs_admission_id_idx" ON "vital_signs"("admission_id");

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "bed_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "bed_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_notes" ADD CONSTRAINT "progress_notes_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_charges" ADD CONSTRAINT "patient_charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_charges" ADD CONSTRAINT "patient_charges_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_charges" ADD CONSTRAINT "patient_charges_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "bed_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
