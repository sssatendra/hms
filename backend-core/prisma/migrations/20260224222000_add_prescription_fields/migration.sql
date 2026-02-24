-- AlterTable
ALTER TABLE "prescription_items" 
ADD COLUMN "dosage_unit" TEXT,
ADD COLUMN "days_supply" INTEGER,
ADD COLUMN "refills" INTEGER NOT NULL DEFAULT 0;
