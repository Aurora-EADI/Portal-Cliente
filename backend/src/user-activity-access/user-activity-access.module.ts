import { Module } from "@nestjs/common";
import { UserActivityAccessController } from "./user-activity-access.controller";
import { UserActivityAccessService } from "./user-activity-access.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [UserActivityAccessController],
  providers: [UserActivityAccessService],
  exports: [UserActivityAccessService],
})
export class UserActivityAccessModule {}
