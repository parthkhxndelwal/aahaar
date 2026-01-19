-- Migration: Create Cart and CartItem tables
-- Date: 2025-01-27

-- Create carts table
CREATE TABLE IF NOT EXISTS `carts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `courtId` varchar(50) NOT NULL,
  `status` enum('active','ordered','abandoned') DEFAULT 'active',
  `total` decimal(10,2) DEFAULT '0.00',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_active_cart` (`userId`,`courtId`,`status`) USING BTREE,
  KEY `idx_user_id` (`userId`),
  KEY `idx_court_id` (`courtId`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_court` FOREIGN KEY (`courtId`) REFERENCES `courts` (`courtId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cart_items table
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `cartId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `menuItemId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unitPrice` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `customizations` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_menu_item` (`cartId`,`menuItemId`),
  KEY `idx_cart_id` (`cartId`),
  KEY `idx_menu_item_id` (`menuItemId`),
  CONSTRAINT `fk_cart_item_cart` FOREIGN KEY (`cartId`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_item_menu` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_quantity_positive` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance
CREATE INDEX `idx_carts_created_at` ON `carts` (`createdAt`);
CREATE INDEX `idx_cart_items_created_at` ON `cart_items` (`createdAt`);
