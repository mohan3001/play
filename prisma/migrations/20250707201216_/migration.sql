-- CreateTable
CREATE TABLE "LinkedRepo" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "repoType" TEXT NOT NULL,
    "localPath" TEXT,
    "remoteUrl" TEXT,
    "playwrightRoot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedRepo_pkey" PRIMARY KEY ("id")
);
