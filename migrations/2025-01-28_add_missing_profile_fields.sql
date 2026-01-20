-- Add missing profile fields to users table
ALTER TABLE users 
ADD COLUMN dateOfBirth DATE NULL,
ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer-not-to-say') NULL,
ADD COLUMN profilePicture TEXT NULL;
