-- Redefine EmployeeBalance with composite PK (employeeId, locationId)
CREATE TABLE "EmployeeBalance_new" (
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "balanceDays" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("employeeId", "locationId")
);

INSERT INTO "EmployeeBalance_new" ("employeeId", "locationId", "balanceDays", "createdAt", "updatedAt")
SELECT "employeeId", 'loc_default', "balanceDays", "createdAt", "updatedAt" FROM "EmployeeBalance";

DROP TABLE "EmployeeBalance";
ALTER TABLE "EmployeeBalance_new" RENAME TO "EmployeeBalance";

-- Add locationId to TimeOffRequest (NOT NULL); backfill legacy rows
CREATE TABLE "TimeOffRequest_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "daysRequested" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "TimeOffRequest_new" ("id", "employeeId", "locationId", "startDate", "endDate", "reason", "status", "daysRequested", "createdAt", "updatedAt")
SELECT "id", "employeeId", 'loc_default', "startDate", "endDate", "reason", "status", "daysRequested", "createdAt", "updatedAt" FROM "TimeOffRequest";

DROP TABLE "TimeOffRequest";
ALTER TABLE "TimeOffRequest_new" RENAME TO "TimeOffRequest";
