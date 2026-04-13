-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "securityQuestion" TEXT NOT NULL,
    "securityAnswerHash" TEXT NOT NULL,
    "lockoutUntil" DATETIME,
    "lockoutAttempts" INTEGER NOT NULL DEFAULT 0,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
