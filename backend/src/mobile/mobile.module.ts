import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

import { MobileJwtStrategy } from "./strategies/mobile-jwt.strategy";
import { MobileJwtGuard } from "./guards/mobile-jwt.guard";
import { MobileAuthService } from "./mobile-auth.service";
import { MobileAuthController } from "./mobile-auth.controller";
import { MobileInspectionsService } from "./mobile-inspections.service";
import { MobileInspectionsController } from "./mobile-inspections.controller";
import { MobilePhotosController } from "./mobile-photos.controller";
import { MobileUsersController } from "./mobile-users.controller";
import { MobileUsersService } from "./mobile-users.service";
import { MobilePortalInspectionsController } from "./mobile-portal-inspections.controller";
import { ContainerSyncService } from "./container-sync.service";
import { MinioModule } from "../minio/minio.module";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
    }),
    MulterModule.register({ storage: memoryStorage() }),
    MinioModule,
  ],
  controllers: [
    MobileAuthController,
    MobileInspectionsController,
    MobilePhotosController,
    MobileUsersController,
    MobilePortalInspectionsController,
  ],
  providers: [
    MobileJwtStrategy,
    MobileJwtGuard,
    MobileAuthService,
    MobileInspectionsService,
    MobileUsersService,
    ContainerSyncService,
  ],
})
export class MobileModule {}
