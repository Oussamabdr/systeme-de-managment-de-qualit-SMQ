-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CAQ', 'AUDITEUR_EXTERNE');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."CorrectiveActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CorrectiveActionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."CorrectiveActionSource" AS ENUM ('OVERDUE_TASK', 'DELAYED_PROJECT', 'KPI_DEVIATION', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."CorrectiveActionType" AS ENUM ('CORRECTIVE', 'PREVENTIVE');

-- CreateEnum
CREATE TYPE "public"."EffectivenessStatus" AS ENUM ('PENDING', 'VERIFIED', 'NOT_EFFECTIVE');

-- CreateEnum
CREATE TYPE "public"."NonConformityStatus" AS ENUM ('OPEN', 'ANALYSIS', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."VeracityLevel" AS ENUM ('FALSE', 'RATHER_FALSE', 'RATHER_TRUE', 'TRUE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'TEAM_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Process" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsiblePerson" TEXT NOT NULL,
    "inputs" TEXT[],
    "outputs" TEXT[],
    "knowledgeItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "indicators" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."Process" ADD COLUMN "departmentId" TEXT;

-- CreateTable
CREATE TABLE "public"."ProcessRequirementAssessment" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "requirementCode" TEXT NOT NULL,
    "requirementName" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "veracityLevel" "public"."VeracityLevel" NOT NULL DEFAULT 'FALSE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessRequirementAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Kpi" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "processId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectProcess" (
    "projectId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,

    CONSTRAINT "ProjectProcess_pkey" PRIMARY KEY ("projectId","processId")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "plannedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CorrectiveAction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recommendation" TEXT,
    "actionType" "public"."CorrectiveActionType" NOT NULL DEFAULT 'CORRECTIVE',
    "status" "public"."CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "public"."CorrectiveActionSeverity" NOT NULL DEFAULT 'MEDIUM',
    "source" "public"."CorrectiveActionSource" NOT NULL DEFAULT 'MANUAL',
    "rootCause" TEXT,
    "containmentAction" TEXT,
    "effectivenessCriteria" TEXT,
    "effectivenessStatus" "public"."EffectivenessStatus" NOT NULL DEFAULT 'PENDING',
    "verificationComment" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "nonConformityId" TEXT,
    "isoClause" TEXT,
    "dueDate" TIMESTAMP(3),
    "projectId" TEXT,
    "processId" TEXT,
    "taskId" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NonConformity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."NonConformityStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "public"."CorrectiveActionSeverity" NOT NULL DEFAULT 'MEDIUM',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processId" TEXT,
    "detectedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonConformity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "processId" TEXT,
    "taskId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Criterion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clause" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcessCriterion" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate" INTEGER,
    "veracityLevel" "public"."VeracityLevel" NOT NULL DEFAULT 'FALSE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CriterionEvidence" (
    "id" TEXT NOT NULL,
    "processCriterionId" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "documentId" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CriterionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "public"."Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "public"."Department"("code");

-- CreateIndex
CREATE INDEX "Process_departmentId_idx" ON "public"."Process"("departmentId");

-- CreateIndex
CREATE INDEX "ProcessRequirementAssessment_processId_idx" ON "public"."ProcessRequirementAssessment"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessRequirementAssessment_processId_requirementCode_key" ON "public"."ProcessRequirementAssessment"("processId", "requirementCode");

-- CreateIndex
CREATE INDEX "Kpi_processId_idx" ON "public"."Kpi"("processId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_status_idx" ON "public"."CorrectiveAction"("status");

-- CreateIndex
CREATE INDEX "CorrectiveAction_severity_idx" ON "public"."CorrectiveAction"("severity");

-- CreateIndex
CREATE INDEX "CorrectiveAction_projectId_idx" ON "public"."CorrectiveAction"("projectId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_processId_idx" ON "public"."CorrectiveAction"("processId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_taskId_idx" ON "public"."CorrectiveAction"("taskId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_ownerId_idx" ON "public"."CorrectiveAction"("ownerId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_nonConformityId_idx" ON "public"."CorrectiveAction"("nonConformityId");

-- CreateIndex
CREATE INDEX "CorrectiveAction_verifiedById_idx" ON "public"."CorrectiveAction"("verifiedById");

-- CreateIndex
CREATE INDEX "NonConformity_status_idx" ON "public"."NonConformity"("status");

-- CreateIndex
CREATE INDEX "NonConformity_severity_idx" ON "public"."NonConformity"("severity");

-- CreateIndex
CREATE INDEX "NonConformity_processId_idx" ON "public"."NonConformity"("processId");

-- CreateIndex
CREATE INDEX "NonConformity_detectedById_idx" ON "public"."NonConformity"("detectedById");

-- CreateIndex
CREATE INDEX "Document_processId_idx" ON "public"."Document"("processId");

-- CreateIndex
CREATE INDEX "Document_taskId_idx" ON "public"."Document"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_code_key" ON "public"."Criterion"("code");

-- CreateIndex
CREATE INDEX "ProcessCriterion_processId_idx" ON "public"."ProcessCriterion"("processId");

-- CreateIndex
CREATE INDEX "ProcessCriterion_criterionId_idx" ON "public"."ProcessCriterion"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessCriterion_processId_criterionId_key" ON "public"."ProcessCriterion"("processId", "criterionId");

-- AddForeignKey
ALTER TABLE "public"."Process" ADD CONSTRAINT "Process_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessRequirementAssessment" ADD CONSTRAINT "ProcessRequirementAssessment_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kpi" ADD CONSTRAINT "Kpi_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectProcess" ADD CONSTRAINT "ProjectProcess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectProcess" ADD CONSTRAINT "ProjectProcess_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "public"."NonConformity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NonConformity" ADD CONSTRAINT "NonConformity_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NonConformity" ADD CONSTRAINT "NonConformity_detectedById_fkey" FOREIGN KEY ("detectedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessCriterion" ADD CONSTRAINT "ProcessCriterion_processId_fkey" FOREIGN KEY ("processId") REFERENCES "public"."Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessCriterion" ADD CONSTRAINT "ProcessCriterion_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "public"."Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CriterionEvidence" ADD CONSTRAINT "CriterionEvidence_processCriterionId_fkey" FOREIGN KEY ("processCriterionId") REFERENCES "public"."ProcessCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

