-- Add profile fields to users table
ALTER TABLE users ADD COLUMN dateOfBirth DATE;
ALTER TABLE users ADD COLUMN gender VARCHAR(20);
ALTER TABLE users ADD COLUMN profilePicture TEXT;

-- Add indexes for better query performance
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_dateOfBirth ON users(dateOfBirth);
