-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT,
    "status" TEXT NOT NULL,
    "deceasedFullName" TEXT,
    "deceasedDob" DATETIME,
    "deceasedDod" DATETIME,
    "deceasedPreferredName" TEXT,
    "deceasedGender" TEXT,
    "nextOfKinName" TEXT,
    "nextOfKinRelationship" TEXT,
    "nextOfKinPhone" TEXT,
    "nextOfKinEmail" TEXT,
    "serviceType" TEXT,
    "serviceStyle" TEXT,
    "venuePreference" TEXT,
    "expectedAttendeesMin" INTEGER,
    "expectedAttendeesMax" INTEGER,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "budgetPreference" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "locationQuery" TEXT,
    "selectedVenueName" TEXT,
    "selectedVenueAddress" TEXT,
    "selectedVenueCategory" TEXT,
    "selectedVenueMapsUrl" TEXT,
    "preferredServiceDate" DATETIME,
    "dateFlexibility" TEXT,
    "culturalFaithRequirements" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "addOns" TEXT,
    "urgency" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,
    "recommendedPackageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Case_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("addOns", "budgetMax", "budgetMin", "budgetPreference", "caseNumber", "createdAt", "createdById", "culturalFaithRequirements", "dateFlexibility", "deceasedDob", "deceasedDod", "deceasedFullName", "deceasedGender", "deceasedPreferredName", "expectedAttendeesMax", "expectedAttendeesMin", "id", "internalNotes", "locationQuery", "nextOfKinEmail", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "notes", "organizationId", "preferredServiceDate", "recommendedPackageId", "selectedVenueAddress", "selectedVenueCategory", "selectedVenueMapsUrl", "selectedVenueName", "serviceStyle", "serviceType", "state", "status", "suburb", "updatedAt", "urgency", "venuePreference") SELECT "addOns", "budgetMax", "budgetMin", "budgetPreference", "caseNumber", "createdAt", "createdById", "culturalFaithRequirements", "dateFlexibility", "deceasedDob", "deceasedDod", "deceasedFullName", "deceasedGender", "deceasedPreferredName", "expectedAttendeesMax", "expectedAttendeesMin", "id", "internalNotes", "locationQuery", "nextOfKinEmail", "nextOfKinName", "nextOfKinPhone", "nextOfKinRelationship", "notes", "organizationId", "preferredServiceDate", "recommendedPackageId", "selectedVenueAddress", "selectedVenueCategory", "selectedVenueMapsUrl", "selectedVenueName", "serviceStyle", "serviceType", "state", "status", "suburb", "updatedAt", "urgency", "venuePreference" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
