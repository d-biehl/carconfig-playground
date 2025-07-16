-- CreateTable
CREATE TABLE "required_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exclusiveGroup" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "selectedOptions" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "configurationName" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "checkout_sessions_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "description" TEXT,
    "detailedDescription" TEXT,
    "imageUrl" TEXT,
    "imageData" TEXT,
    "imageMimeType" TEXT,
    "exclusiveGroup" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_options" ("category", "createdAt", "description", "detailedDescription", "exclusiveGroup", "id", "imageData", "imageMimeType", "imageUrl", "name", "price", "updatedAt") SELECT "category", "createdAt", "description", "detailedDescription", "exclusiveGroup", "id", "imageData", "imageMimeType", "imageUrl", "name", "price", "updatedAt" FROM "options";
DROP TABLE "options";
ALTER TABLE "new_options" RENAME TO "options";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "required_groups_exclusiveGroup_key" ON "required_groups"("exclusiveGroup");
