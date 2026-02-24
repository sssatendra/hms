-- AlterTable
ALTER TABLE "bed_admissions" ADD COLUMN     "advance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "diagnosis_on_admission" TEXT,
ADD COLUMN     "expected_discharge" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "beds" ADD COLUMN     "bed_type" TEXT NOT NULL DEFAULT 'Standard',
ADD COLUMN     "daily_rate_override" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "advance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "balance_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "insurance_amount_covered" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "insurance_claim_id" TEXT,
ADD COLUMN     "insurance_provider" TEXT;

-- AlterTable
ALTER TABLE "wards" ADD COLUMN     "daily_rate" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
