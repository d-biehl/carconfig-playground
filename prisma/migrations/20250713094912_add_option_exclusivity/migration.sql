-- AlterTable
ALTER TABLE "options" ADD COLUMN "exclusiveGroup" TEXT;

-- CreateTable
CREATE TABLE "option_conflicts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromOptionId" TEXT NOT NULL,
    "toOptionId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL DEFAULT 'exclusive',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "option_conflicts_fromOptionId_fkey" FOREIGN KEY ("fromOptionId") REFERENCES "options" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "option_conflicts_toOptionId_fkey" FOREIGN KEY ("toOptionId") REFERENCES "options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "option_conflicts_fromOptionId_toOptionId_key" ON "option_conflicts"("fromOptionId", "toOptionId");
