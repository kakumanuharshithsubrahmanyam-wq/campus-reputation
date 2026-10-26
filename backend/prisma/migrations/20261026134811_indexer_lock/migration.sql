-- CreateTable
CREATE TABLE "IndexerLock" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "holder" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerLock_pkey" PRIMARY KEY ("id")
);
