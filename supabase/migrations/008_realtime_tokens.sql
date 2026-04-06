-- Enable Supabase Realtime for lottery_tokens so the cashier QR panel
-- updates automatically when a customer claims their ticket.
--
-- REPLICA IDENTITY FULL is required for UPDATE events to carry the
-- complete new row (status, ticket_number, etc.) in the change payload.
-- Without it, only the primary key columns are included.
--
-- The supabase_realtime publication must explicitly include tables
-- created via raw SQL migrations — they are not added automatically.

ALTER TABLE lottery_tokens REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE lottery_tokens;
