-- Migration: Add onboarding tracking fields to Vendors table
-- Date: 2025-07-31
-- Description: Adds onboarding status tracking fields to better manage vendor onboarding process

-- Add onboarding tracking columns to Vendors table
ALTER TABLE `Vendors` 
ADD COLUMN `onboardingStatus` ENUM('not_started', 'in_progress', 'completed', 'suspended') NOT NULL DEFAULT 'not_started' COMMENT 'Current onboarding status' AFTER `metadata`;

ALTER TABLE `Vendors` 
ADD COLUMN `onboardingStep` ENUM('basic', 'password', 'stall', 'hours', 'bank', 'legal', 'account', 'config', 'success', 'completed') NULL COMMENT 'Current step in onboarding process' AFTER `onboardingStatus`;

ALTER TABLE `Vendors` 
ADD COLUMN `onboardingCompletedAt` DATETIME NULL COMMENT 'Timestamp when onboarding was completed' AFTER `onboardingStep`;

ALTER TABLE `Vendors` 
ADD COLUMN `onboardingStartedAt` DATETIME NULL COMMENT 'Timestamp when onboarding was started' AFTER `onboardingCompletedAt`;

-- Update existing vendors with Razorpay accounts to completed status
UPDATE `Vendors` 
SET 
    `onboardingStatus` = 'completed',
    `onboardingStep` = 'completed',
    `onboardingCompletedAt` = `updatedAt`,
    `onboardingStartedAt` = `createdAt`
WHERE `razorpayAccountId` IS NOT NULL;

-- Update existing vendors without Razorpay accounts but with basic info to in_progress
UPDATE `Vendors` 
SET 
    `onboardingStatus` = 'in_progress',
    `onboardingStep` = 'basic',
    `onboardingStartedAt` = `createdAt`
WHERE `razorpayAccountId` IS NULL 
    AND (`stallName` IS NOT NULL AND `stallName` != '')
    AND (`vendorName` IS NOT NULL AND `vendorName` != '')
    AND (`contactEmail` IS NOT NULL AND `contactEmail` != '');

-- Create index for onboarding queries
CREATE INDEX `idx_vendors_onboarding_status` ON `Vendors` (`onboardingStatus`, `onboardingStep`);

CREATE INDEX `idx_vendors_onboarding_dates` ON `Vendors` (`onboardingStartedAt`, `onboardingCompletedAt`);

-- Show summary of changes
SELECT 
    onboardingStatus,
    onboardingStep,
    COUNT(*) as vendor_count
FROM `Vendors` 
GROUP BY onboardingStatus, onboardingStep
ORDER BY onboardingStatus, onboardingStep;
