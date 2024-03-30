-- AlterTable
ALTER TABLE "payments_history" ADD COLUMN     "new_status" "UserSubscriptionStatus",
ADD COLUMN     "old_status" "UserSubscriptionStatus";
