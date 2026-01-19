-- MySQL Database Backup
-- Database: aahaar_dev
-- Generated: 2025-07-26T14:18:13.691Z
-- Host: localhost:3306

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Table structure for audit_logs
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `courtId` varchar(255) NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entityType` varchar(255) NOT NULL,
  `entityId` varchar(255) DEFAULT NULL,
  `oldValues` json DEFAULT NULL,
  `newValues` json DEFAULT NULL,
  `ipAddress` varchar(255) DEFAULT NULL,
  `userAgent` text,
  `metadata` json NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_court_id_created_at` (`courtId`,`createdAt`),
  KEY `audit_logs_user_id` (`userId`),
  KEY `audit_logs_action` (`action`),
  KEY `audit_logs_entity_type_entity_id` (`entityType`,`entityId`),
  CONSTRAINT `audit_logs_ibfk_3` FOREIGN KEY (`courtId`) REFERENCES `courts` (`courtId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `audit_logs_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- No data in table audit_logs

-- Table structure for court_settings
DROP TABLE IF EXISTS court_settings;
CREATE TABLE `court_settings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `courtId` varchar(255) NOT NULL,
  `allowOnlinePayments` tinyint(1) NOT NULL DEFAULT '1',
  `allowCOD` tinyint(1) NOT NULL DEFAULT '1',
  `maxOrdersPerUser` int NOT NULL DEFAULT '5',
  `orderBufferTime` int NOT NULL DEFAULT '5',
  `allowedEmailDomains` json NOT NULL,
  `requireEmailVerification` tinyint(1) NOT NULL DEFAULT '0',
  `requirePhoneVerification` tinyint(1) NOT NULL DEFAULT '0',
  `platformFeePercentage` decimal(5,2) NOT NULL DEFAULT '2.50',
  `minimumOrderAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `maximumOrderAmount` decimal(10,2) NOT NULL DEFAULT '5000.00',
  `autoAcceptOrders` tinyint(1) NOT NULL DEFAULT '0',
  `orderCancellationWindow` int NOT NULL DEFAULT '5',
  `themeSettings` json NOT NULL,
  `notificationSettings` json NOT NULL,
  `integrationSettings` json NOT NULL,
  `metadata` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courtId` (`courtId`),
  UNIQUE KEY `court_settings_court_id` (`courtId`),
  CONSTRAINT `court_settings_ibfk_1` FOREIGN KEY (`courtId`) REFERENCES `courts` (`courtId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table court_settings
INSERT INTO court_settings (id, courtId, allowOnlinePayments, allowCOD, maxOrdersPerUser, orderBufferTime, allowedEmailDomains, requireEmailVerification, requirePhoneVerification, platformFeePercentage, minimumOrderAmount, maximumOrderAmount, autoAcceptOrders, orderCancellationWindow, themeSettings, notificationSettings, integrationSettings, metadata, createdAt, updatedAt) VALUES
('faeac819-1b96-46fd-951a-21b6b661c962', 'democourt', 0, 1, 5, 5, krmu.edu.in,gmail.com,outlook.com, 1, 1, '5.00', '0.00', '5000.00', 0, 2, [object Object], [object Object], [object Object], [object Object], '2025-06-26 05:03:06', '2025-06-26 05:03:06');

-- Table structure for courts
DROP TABLE IF EXISTS courts;
CREATE TABLE `courts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `courtId` varchar(255) NOT NULL,
  `instituteName` varchar(255) NOT NULL,
  `instituteType` enum('school','college','office','hospital','other') NOT NULL DEFAULT 'college',
  `logoUrl` text,
  `contactEmail` varchar(255) NOT NULL,
  `contactPhone` varchar(255) DEFAULT NULL,
  `address` text,
  `operatingHours` json NOT NULL,
  `timezone` varchar(255) NOT NULL DEFAULT 'Asia/Kolkata',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `subscriptionPlan` enum('trial','basic','premium','enterprise') NOT NULL DEFAULT 'trial',
  `subscriptionExpiresAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courtId` (`courtId`),
  UNIQUE KEY `courts_court_id` (`courtId`),
  UNIQUE KEY `courtId_2` (`courtId`),
  KEY `courts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table courts
INSERT INTO courts (id, courtId, instituteName, instituteType, logoUrl, contactEmail, contactPhone, address, operatingHours, timezone, status, subscriptionPlan, subscriptionExpiresAt, createdAt, updatedAt) VALUES
('4ee151b6-bbaf-49a2-b97f-a0b730156cf6', 'democourt', 'KR Mangalam University', 'college', '', 'admin@democourt.com', '9999999999', '', [object Object], 'Asia/Kolkata', 'active', 'premium', NULL, '2025-06-26 05:03:06', '2025-07-23 14:51:55');

-- Table structure for menu_categories
DROP TABLE IF EXISTS menu_categories;
CREATE TABLE `menu_categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `color` varchar(255) DEFAULT NULL,
  `imageUrl` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_vendor_category_name` (`vendorId`,`name`),
  KEY `menu_categories_vendor_id_is_active` (`vendorId`,`isActive`),
  KEY `menu_categories_vendor_id_display_order` (`vendorId`,`displayOrder`),
  CONSTRAINT `menu_categories_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table menu_categories
INSERT INTO menu_categories (id, vendorId, name, description, displayOrder, isActive, color, imageUrl, createdAt, updatedAt) VALUES
('8922e03d-e870-401d-93f7-fc2722d90298', '977f86d5-facd-4846-ab5f-add6beba80e1', 'Category 1', 'Snacks', 1, 1, '#000000', NULL, '2025-07-23 18:24:51', '2025-07-23 18:55:54');

-- Table structure for menu_items
DROP TABLE IF EXISTS menu_items;
CREATE TABLE `menu_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `imageUrl` text,
  `price` decimal(10,2) NOT NULL,
  `mrp` decimal(10,2) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `tags` json NOT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT '1',
  `isVegetarian` tinyint(1) NOT NULL DEFAULT '1',
  `isVegan` tinyint(1) NOT NULL DEFAULT '0',
  `isJainFriendly` tinyint(1) NOT NULL DEFAULT '0',
  `spiceLevel` enum('mild','medium','hot','extra_hot') DEFAULT NULL,
  `preparationTime` int NOT NULL DEFAULT '15',
  `calories` int DEFAULT NULL,
  `ingredients` text,
  `allergens` json NOT NULL,
  `nutritionInfo` json NOT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `totalOrders` int NOT NULL DEFAULT '0',
  `rating` decimal(3,2) NOT NULL DEFAULT '0.00',
  `totalRatings` int NOT NULL DEFAULT '0',
  `status` enum('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
  `metadata` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `menu_items_vendor_id_status` (`vendorId`,`status`),
  KEY `menu_items_vendor_id_category` (`vendorId`,`category`),
  KEY `menu_items_is_available` (`isAvailable`),
  KEY `menu_items_display_order` (`displayOrder`),
  KEY `menu_items_categoryId_foreign_idx` (`categoryId`),
  CONSTRAINT `menu_items_categoryId_foreign_idx` FOREIGN KEY (`categoryId`) REFERENCES `menu_categories` (`id`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table menu_items
INSERT INTO menu_items (id, vendorId, name, description, imageUrl, price, mrp, category, tags, isAvailable, isVegetarian, isVegan, isJainFriendly, spiceLevel, preparationTime, calories, ingredients, allergens, nutritionInfo, displayOrder, totalOrders, rating, totalRatings, status, metadata, createdAt, updatedAt, categoryId) VALUES
('52fb9e77-f3ca-4147-ae60-d1a1e3d66dc9', '977f86d5-facd-4846-ab5f-add6beba80e1', 'Veg Sandwhich', 'Veg Sandwhich', 'https://res.cloudinary.com/dvcpe1ahn/image/upload/v1753289221/aahaar/menu-items/wakvyybf0oqmtscticlp.jpg', '50.00', '100.00', 'Category 1', , 1, 1, 0, 0, NULL, 10, NULL, '', , [object Object], 0, 0, '0.00', 0, 'active', [object Object], '2025-07-23 16:47:02', '2025-07-23 18:49:11', '8922e03d-e870-401d-93f7-fc2722d90298');

-- Table structure for order_items
DROP TABLE IF EXISTS order_items;
CREATE TABLE `order_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `menuItemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `itemName` varchar(255) NOT NULL,
  `itemPrice` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `customizations` json NOT NULL,
  `specialInstructions` text,
  `metadata` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id` (`orderId`),
  KEY `order_items_menu_item_id` (`menuItemId`),
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_4` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- No data in table order_items

-- Table structure for orders
DROP TABLE IF EXISTS orders;
CREATE TABLE `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderNumber` varchar(255) NOT NULL,
  `courtId` varchar(255) NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customerName` varchar(255) NOT NULL,
  `customerPhone` varchar(255) DEFAULT NULL,
  `customerEmail` varchar(255) DEFAULT NULL,
  `type` enum('user_initiated','vendor_initiated') NOT NULL DEFAULT 'user_initiated',
  `status` enum('pending','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  `paymentMethod` enum('online','cod') NOT NULL DEFAULT 'online',
  `paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `taxAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(10,2) NOT NULL,
  `estimatedPreparationTime` int NOT NULL DEFAULT '15',
  `actualPreparationTime` int DEFAULT NULL,
  `specialInstructions` text,
  `cancellationReason` text,
  `rating` int DEFAULT NULL,
  `feedback` text,
  `qrCode` text,
  `razorpayOrderId` varchar(255) DEFAULT NULL,
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `statusHistory` json NOT NULL,
  `metadata` json NOT NULL,
  `confirmedAt` datetime DEFAULT NULL,
  `preparingAt` datetime DEFAULT NULL,
  `readyAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `cancelledAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderNumber` (`orderNumber`),
  UNIQUE KEY `orders_order_number` (`orderNumber`),
  UNIQUE KEY `orderNumber_2` (`orderNumber`),
  KEY `orders_court_id_status` (`courtId`,`status`),
  KEY `orders_user_id` (`userId`),
  KEY `orders_vendor_id_status` (`vendorId`,`status`),
  KEY `orders_payment_status` (`paymentStatus`),
  KEY `orders_created_at` (`createdAt`),
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`courtId`) REFERENCES `courts` (`courtId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_6` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- No data in table orders

-- Table structure for payments
DROP TABLE IF EXISTS payments;
CREATE TABLE `payments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `razorpayOrderId` varchar(255) DEFAULT NULL,
  `razorpayPaymentId` varchar(255) DEFAULT NULL,
  `razorpaySignature` varchar(255) DEFAULT NULL,
  `paymentMethod` enum('online','cod') NOT NULL DEFAULT 'online',
  `status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(255) NOT NULL DEFAULT 'INR',
  `gatewayResponse` json NOT NULL,
  `failureReason` text,
  `refundAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `refundReason` text,
  `vendorPayoutStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `vendorPayoutAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `razorpayTransferId` varchar(255) DEFAULT NULL,
  `platformFee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `metadata` json NOT NULL,
  `processedAt` datetime DEFAULT NULL,
  `refundedAt` datetime DEFAULT NULL,
  `vendorPayoutAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_order_id` (`orderId`),
  KEY `payments_razorpay_order_id` (`razorpayOrderId`),
  KEY `payments_razorpay_payment_id` (`razorpayPaymentId`),
  KEY `payments_status` (`status`),
  KEY `payments_vendor_payout_status` (`vendorPayoutStatus`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- No data in table payments

-- Table structure for users
DROP TABLE IF EXISTS users;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `courtId` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `fullName` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','vendor','user') NOT NULL DEFAULT 'user',
  `status` enum('active','inactive','pending','suspended') NOT NULL DEFAULT 'pending',
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `phoneVerified` tinyint(1) NOT NULL DEFAULT '0',
  `lastLoginAt` datetime DEFAULT NULL,
  `preferences` json NOT NULL,
  `metadata` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_court_id_email` (`courtId`,`email`),
  KEY `users_court_id_role` (`courtId`,`role`),
  KEY `users_status` (`status`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`courtId`) REFERENCES `courts` (`courtId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table users
INSERT INTO users (id, courtId, email, phone, fullName, password, role, status, emailVerified, phoneVerified, lastLoginAt, preferences, metadata, createdAt, updatedAt) VALUES
('30a3c6c5-7553-47ef-9e71-30506f25ee60', 'democourt', 'parthmethi@gmail.com', '9355630199', 'Parth Khandelwal', '$2b$12$JG7/olgtHY9VTZ8.nprMhuloDi5tbKj.5l1y2cnY2W7yKRHGOhRTS', 'vendor', 'active', 0, 0, '2025-07-23 15:51:34', [object Object], [object Object], '2025-07-23 11:49:25', '2025-07-23 15:51:34'),
('fa7634e8-ed09-4451-802c-b41f531678cc', 'democourt', 'admin@democourt.com', NULL, 'Demo Admin', '$2b$12$2S0UcstD9O7JbKoalM/tn.iDzwxcfiyUd05SK8I8SKkyGABY15DrG', 'admin', 'active', 1, 0, '2025-07-23 11:39:36', [object Object], [object Object], '2025-06-26 05:03:06', '2025-07-23 11:39:36');

-- Table structure for vendors
DROP TABLE IF EXISTS vendors;
CREATE TABLE `vendors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `courtId` varchar(255) NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `stallName` varchar(255) NOT NULL,
  `vendorName` varchar(255) NOT NULL,
  `contactEmail` varchar(255) NOT NULL,
  `contactPhone` varchar(255) NOT NULL,
  `logoUrl` text,
  `bannerUrl` text,
  `cuisineType` varchar(255) DEFAULT NULL,
  `description` text,
  `operatingHours` json NOT NULL,
  `breakTimes` json NOT NULL,
  `status` enum('active','inactive','maintenance','suspended') NOT NULL DEFAULT 'inactive',
  `isOnline` tinyint(1) NOT NULL DEFAULT '0',
  `maxConcurrentOrders` int NOT NULL DEFAULT '10',
  `averagePreparationTime` int NOT NULL DEFAULT '15',
  `rating` decimal(3,2) NOT NULL DEFAULT '0.00',
  `totalRatings` int NOT NULL DEFAULT '0',
  `bankAccountNumber` varchar(255) DEFAULT NULL,
  `bankIfscCode` varchar(255) DEFAULT NULL,
  `bankAccountHolderName` varchar(255) DEFAULT NULL,
  `razorpayFundAccountId` varchar(255) DEFAULT NULL,
  `razorpayContactId` varchar(255) DEFAULT NULL,
  `payoutSettings` json NOT NULL,
  `settings` json NOT NULL,
  `metadata` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `stallLocation` varchar(255) DEFAULT NULL,
  `maxOrdersPerHour` int NOT NULL DEFAULT '10',
  `bankName` varchar(255) DEFAULT NULL,
  `razorpayAccountId` varchar(255) DEFAULT NULL COMMENT 'Razorpay Route Account ID for direct settlements',
  `panNumber` varchar(255) DEFAULT NULL,
  `gstin` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendors_court_id_stall_name` (`courtId`,`stallName`),
  KEY `vendors_court_id_status` (`courtId`,`status`),
  KEY `vendors_is_online` (`isOnline`),
  KEY `userId` (`userId`),
  CONSTRAINT `vendors_ibfk_3` FOREIGN KEY (`courtId`) REFERENCES `courts` (`courtId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table vendors
INSERT INTO vendors (id, courtId, userId, stallName, vendorName, contactEmail, contactPhone, logoUrl, bannerUrl, cuisineType, description, operatingHours, breakTimes, status, isOnline, maxConcurrentOrders, averagePreparationTime, rating, totalRatings, bankAccountNumber, bankIfscCode, bankAccountHolderName, razorpayFundAccountId, razorpayContactId, payoutSettings, settings, metadata, createdAt, updatedAt, stallLocation, maxOrdersPerHour, bankName, razorpayAccountId, panNumber, gstin) VALUES
('977f86d5-facd-4846-ab5f-add6beba80e1', 'democourt', '30a3c6c5-7553-47ef-9e71-30506f25ee60', 'Nescafe', 'Parth Khandelwal', 'parthmethi@gmail.com', '9355630199', 'https://res.cloudinary.com/dvcpe1ahn/image/upload/v1753271247/aahaar/vendors/logos/idutortxkol5vqwax26g.png', 'https://res.cloudinary.com/dvcpe1ahn/image/upload/v1753271294/aahaar/vendors/logos/honkzw4bwgxjiplqzpxc.png', 'indian', '', [object Object], , 'active', 1, 10, 15, '0.00', 0, '1122334455', 'KKBK000466', 'Parth Khandelwal', NULL, NULL, [object Object], [object Object], [object Object], '2025-07-23 11:49:25', '2025-07-23 11:54:36', 'Chanakya Block', 10, 'Kotak', NULL, 'HAKPK8300A', NULL);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
SET AUTOCOMMIT = 1;
