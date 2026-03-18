-- CreateEnum
CREATE TYPE "TableLifecycleStatus" AS ENUM (
  'negotiation',
  'quoted',
  'quote_approved',
  'contract_created',
  'funded',
  'in_progress',
  'delivery_submitted',
  'accepted',
  'released',
  'disputed',
  'cancelled'
);

-- Normalize and migrate legacy values before type cast
UPDATE "Table"
SET "status" = CASE "status"
  WHEN 'active' THEN 'negotiation'
  WHEN 'completed' THEN 'released'
  WHEN 'cancelled' THEN 'cancelled'
  WHEN 'disputed' THEN 'disputed'
  ELSE 'negotiation'
END;

-- AlterTable
ALTER TABLE "Table"
  ALTER COLUMN "status" TYPE "TableLifecycleStatus" USING ("status"::"TableLifecycleStatus"),
  ALTER COLUMN "status" SET DEFAULT 'negotiation';
