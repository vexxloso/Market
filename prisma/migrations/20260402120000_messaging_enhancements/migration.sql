-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('BOOKING', 'ADMIN_SUPPORT');

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN     "kind" "ConversationKind" NOT NULL DEFAULT 'BOOKING';
ALTER TABLE "Conversation" ADD COLUMN     "adminThreadForUserId" TEXT;
ALTER TABLE "Conversation" ALTER COLUMN "bookingId" DROP NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "listingId" DROP NOT NULL;

CREATE UNIQUE INDEX "Conversation_adminThreadForUserId_key" ON "Conversation"("adminThreadForUserId");

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "deletedAt" TIMESTAMP(3);
