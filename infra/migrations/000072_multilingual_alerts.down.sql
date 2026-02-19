-- Remove Hindi templates seeded
DELETE FROM notification_templates WHERE locale = 'hi' AND code IN ('attendance.absent', 'fee.reminder');

-- Remove preferred_language from guardians
ALTER TABLE guardians DROP COLUMN IF EXISTS preferred_language;
