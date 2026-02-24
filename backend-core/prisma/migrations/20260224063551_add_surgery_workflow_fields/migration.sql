-- AlterTable
ALTER TABLE "patient_charges" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "is_emergency" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "service_status" TEXT NOT NULL DEFAULT 'PENDING';
