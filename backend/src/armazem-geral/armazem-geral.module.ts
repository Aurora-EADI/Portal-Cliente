import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "./armazem-geral-context.module";
import { ArmazemGeralContainersModule } from "./containers/containers.module";
import { ArmazemGeralContainersPropriosModule } from "./containers-proprios/containers-proprios.module";
import { WarehouseGeneralCargoModule } from "./cargo/warehouse-general-cargo.module";
import { WarehouseGeneralTransshipmentsModule } from "./transshipments/warehouse-general-transshipments.module";
import { WarehouseGeneralDamagesModule } from "./damages/warehouse-general-damages.module";
import { WarehouseGeneralDashboardModule } from "./dashboard/warehouse-general-dashboard.module";
import { WarehouseGeneralReportsModule } from "./reports/warehouse-general-reports.module";
import { WarehouseGeneralAuditModule } from "./audit/warehouse-general-audit.module";
import { ConferentesModule } from "./conferentes/conferentes.module";
import { TransportadorasModule } from "./transportadoras/transportadoras.module";

@Module({
  imports: [
    ArmazemGeralContextModule,
    ArmazemGeralContainersModule,
    ArmazemGeralContainersPropriosModule,
    WarehouseGeneralCargoModule,
    WarehouseGeneralTransshipmentsModule,
    WarehouseGeneralDamagesModule,
    WarehouseGeneralDashboardModule,
    WarehouseGeneralReportsModule,
    WarehouseGeneralAuditModule,
    ConferentesModule,
    TransportadorasModule,
  ],
})
export class ArmazemGeralModule {}
