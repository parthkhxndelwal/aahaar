-- Add 'system' to the instituteType ENUM
ALTER TABLE courts MODIFY COLUMN instituteType ENUM('school', 'college', 'office', 'hospital', 'system', 'other') NOT NULL DEFAULT 'college';
