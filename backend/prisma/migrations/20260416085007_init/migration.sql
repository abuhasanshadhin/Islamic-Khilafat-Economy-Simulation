-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `goldBalance` BIGINT NOT NULL DEFAULT 0,
    `reputationScore` INTEGER NOT NULL DEFAULT 0,
    `isZakatEligible` BOOLEAN NOT NULL DEFAULT false,
    `role` ENUM('USER', 'SHURA', 'KHALIFA') NOT NULL DEFAULT 'USER',

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaitulMal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `goldReserve` BIGINT NOT NULL DEFAULT 0,
    `oilReserve` DOUBLE NOT NULL DEFAULT 0.0,
    `gasReserve` DOUBLE NOT NULL DEFAULT 0.0,
    `totalZakatCollected` BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` INTEGER NULL,
    `receiverId` INTEGER NULL,
    `amount` BIGINT NOT NULL,
    `type` ENUM('GRANT', 'TRANSFER', 'TRADE', 'ZAKAT') NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
