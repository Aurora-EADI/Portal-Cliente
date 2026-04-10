import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employee/employee.module";
import { AdminModule } from "../admin/admin.module";
import { SupplierModule } from "../supplier/supplier.module";
import { FaturamentoModule } from "../faturamento/faturamento.module";
import { EstoqueModule } from "../estoque/estoque.module";
import { KanbanModule } from "../kanban/kanban.module";
import { ModulesModule } from "../modules/modules.module";
import { UserModule } from "../user/user.module";
import { PermissionsModule } from "../permissions/permissions.module";
import { ActivitiesModule } from "../activities/activities.module";
import { UserModuleAccessModule } from "../user-module-access/user-module-access.module";
import { UserActivityAccessModule } from "../user-activity-access/user-activity-access.module";
import { DocumentsModule } from "../documents/documents.module";
import { CompaniesModule } from "../companies/companies.module";
import { DocumentTypesModule } from "../document-types/document-types.module";
import { ServicesModule } from "../services/services.module";
import { ServiceCostsModule } from "../service-costs/service-costs.module";
import { SimulationsModule } from "../simulations/simulations.module";
import { IntegrationModule } from "../integration/integration.module";
import { CustomerModule } from "../customer/customer.module";
import { AirSimulationModule } from "../air-simulation/air-simulation.module";
import { RequirementRulesModule } from "../requirement-rules/requirement-rules.module";
import { WorkforceDocumentsModule } from "../workforce-documents/workforce-documents.module";
import { DtaMaritimeModule } from "../dta-maritime/dta-maritime.module";
import { CcteModule } from "../ccte/ccte.module";
import { ConferenciaCargaModule } from "../conferencia-carga/conferencia-carga.module";
import { ReceptionModule } from "../reception/reception.module";
import { ArmazemGeralModule } from "../armazem-geral/armazem-geral.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AdminModule,
    SupplierModule,
    FaturamentoModule,
    EstoqueModule,
    KanbanModule,
    ModulesModule,
    UserModule,
    PermissionsModule,
    ActivitiesModule,
    UserModuleAccessModule,
    UserActivityAccessModule,
    DocumentsModule,
    CompaniesModule,
    DocumentTypesModule,
    ServicesModule,
    ServiceCostsModule,
    SimulationsModule,
    IntegrationModule,
    CustomerModule,
    AirSimulationModule,
    RequirementRulesModule,
    WorkforceDocumentsModule,
    DtaMaritimeModule,
    CcteModule,
    ConferenciaCargaModule,
    ReceptionModule,
    ArmazemGeralModule,
  ],
})
export class AppModule {}
