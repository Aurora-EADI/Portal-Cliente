import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeesModule } from '../employee/employee.module';
import { AdminModule } from '../admin/admin.module';
import { SupplierModule } from 'src/supplier/supplier.module';
import { FaturamentoModule } from 'src/faturamento/faturamento.module';
import { EstoqueModule } from 'src/estoque/estoque.module';
import { KanbanModule } from 'src/kanban/kanban.module';
import { ModulesModule } from 'src/modules/modules.module';
import { UserModule } from 'src/user/user.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ActivitiesModule } from 'src/activities/activities.module';
import { UserModuleAccessModule } from 'src/user-module-access/user-module-access.module';
import { UserActivityAccessModule } from 'src/user-activity-access/user-activity-access.module';
import { DocumentsModule } from 'src/documents/documents.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { DocumentTypesModule } from '../document-types/document-types.module';
import { ServicesModule } from '../services/services.module';
import { ServiceCostsModule } from '../service-costs/service-costs.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { IntegrationModule } from 'src/integration/integration.module';
import { CustomerModule } from 'src/customer/customer.module';
import { AirSimulationModule } from 'src/air-simulation/air-simulation.module';
import { RequirementRulesModule } from "src/requirement-rules/requirement-rules.module";
import { WorkforceDocumentsModule } from "src/workforce-documents/workforce-documents.module";
import { DtaMaritimeModule } from 'src/dta-maritime/dta-maritime.module';
import { CcteModule } from 'src/ccte/ccte.module';

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
  ],
})
export class AppModule {}
