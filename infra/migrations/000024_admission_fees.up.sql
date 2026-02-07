-- Add processing fee columns to admission applications
ALTER TABLE admission_applications 
ADD COLUMN processing_fee_amount BIGINT DEFAULT 0,
ADD COLUMN processing_fee_status TEXT DEFAULT 'pending' CHECK (processing_fee_status IN ('pending', 'paid', 'waived')),
ADD COLUMN payment_reference TEXT;

-- Index for financial reporting
CREATE INDEX idx_admission_applications_payment ON admission_applications(processing_fee_status);
