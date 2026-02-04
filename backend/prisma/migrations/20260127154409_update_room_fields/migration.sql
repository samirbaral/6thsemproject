-- AlterTable
ALTER TABLE `room` MODIFY `state` VARCHAR(191) NULL,
    MODIFY `zipCode` VARCHAR(191) NULL,
    MODIFY `bathrooms` DOUBLE NULL,
    MODIFY `amenities` JSON NULL;
