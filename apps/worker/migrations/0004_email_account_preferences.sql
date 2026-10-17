-- Login owns email verification. Preserve explicit legacy opt-outs.
ALTER TABLE email_contacts ADD COLUMN opted_out INTEGER NOT NULL DEFAULT 0 CHECK (opted_out IN (0,1));
UPDATE email_contacts SET opted_out=1 WHERE verified_at IS NOT NULL AND enabled=0;
UPDATE email_contacts SET challenge_id=NULL,challenge_hash=NULL,challenge_expires=NULL;
UPDATE email_notifications SET status='cancelled',body='' WHERE kind='verification' AND status IN ('pending','dispatching');
