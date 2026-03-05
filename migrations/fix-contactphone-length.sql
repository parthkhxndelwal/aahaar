-- Fix contactPhone length validation issues
-- Set invalid phone numbers to NULL to prevent validation errors

UPDATE courts 
SET contactPhone = NULL 
WHERE contactPhone IS NOT NULL 
AND (LENGTH(contactPhone) < 8 OR LENGTH(contactPhone) > 20 OR TRIM(contactPhone) = '');

-- Clean up whitespace in valid phone numbers
UPDATE courts 
SET contactPhone = TRIM(contactPhone) 
WHERE contactPhone IS NOT NULL;