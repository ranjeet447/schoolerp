-- Add preferred_language to guardians
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add seed templates for Hindi (hi)
INSERT INTO notification_templates (code, channel, locale, subject, body)
VALUES 
('attendance.absent', 'sms', 'hi', 'अनुपस्थिति सूचना', 'नमस्ते, आपका बच्चा आज अनुपस्थित है।'),
('fee.reminder', 'sms', 'hi', 'शुल्क अनुस्मारक', 'नमस्ते, आपके बच्चे का स्कूल शुल्क देय है। कृपया भुगतान करें।')
ON CONFLICT DO NOTHING;
