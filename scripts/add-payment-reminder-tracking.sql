-- Add paymentReminderSentAt column to Order table to track when payment reminder emails are sent
-- This allows us to send reminder emails at 12 hours without sending duplicates

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Order' 
    AND column_name = 'paymentReminderSentAt'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "paymentReminderSentAt" TIMESTAMP(3);
    RAISE NOTICE 'Added paymentReminderSentAt column to Order table';
  ELSE
    RAISE NOTICE 'paymentReminderSentAt column already exists in Order table';
  END IF;
END $$;

