-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_invoice_id_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "admission_id" TEXT,
ALTER COLUMN "invoice_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "payments_admission_id_idx" ON "payments"("admission_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "bed_admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
