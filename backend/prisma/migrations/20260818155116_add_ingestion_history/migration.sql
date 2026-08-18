-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "finalSource" TEXT,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRunSource" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "jobsFetched" INTEGER NOT NULL DEFAULT 0,
    "jobsInserted" INTEGER NOT NULL DEFAULT 0,
    "jobsUpdated" INTEGER NOT NULL DEFAULT 0,
    "jobsSkipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "durationMs" INTEGER,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionRunSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "cooldownUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestionRunSource_runId_idx" ON "IngestionRunSource"("runId");

-- CreateIndex
CREATE INDEX "IngestionRunSource_sourceId_idx" ON "IngestionRunSource"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceHealth_sourceId_key" ON "SourceHealth"("sourceId");

-- AddForeignKey
ALTER TABLE "IngestionRunSource" ADD CONSTRAINT "IngestionRunSource_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRunSource" ADD CONSTRAINT "IngestionRunSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceHealth" ADD CONSTRAINT "SourceHealth_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
