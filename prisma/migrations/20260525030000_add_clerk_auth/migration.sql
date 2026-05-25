-- Add Clerk identifiers for authentication and organization sync.
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "Team" ADD COLUMN "clerkId" TEXT;

CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "Team_clerkId_key" ON "Team"("clerkId");
