-- Migration: Add stakeholder step to onboarding process
-- Date: 2025-08-02
-- Description: Adds 'stakeholder' to the onboardingStep ENUM to support stakeholder information collection

-- Modify the onboardingStep ENUM to include 'stakeholder'
ALTER TABLE `Vendors` 
MODIFY COLUMN `onboardingStep` ENUM('basic', 'password', 'stall', 'hours', 'bank', 'legal', 'account', 'stakeholder', 'config', 'success', 'completed') NULL COMMENT 'Current step in onboarding process';

-- Update any vendors currently on 'config' step who might need to go through stakeholder step
-- This is optional - you may want to review and update manually based on business requirements
-- UPDATE `Vendors` 
-- SET `onboardingStep` = 'stakeholder' 
-- WHERE `onboardingStep` = 'config' AND `onboardingStatus` = 'in_progress';
