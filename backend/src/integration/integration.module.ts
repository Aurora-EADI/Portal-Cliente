import { Module } from "@nestjs/common";
import { ProtheusIntegrationModule } from "./protheus/protheus-integration.module";

@Module({
  imports: [ProtheusIntegrationModule],
})
export class IntegrationModule {}
