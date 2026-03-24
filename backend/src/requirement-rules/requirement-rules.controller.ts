import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";
import { UserRole } from "@prisma/client";
import { RequirementRulesService } from "./requirement-rules.service";
import { UpsertSupplierTypeDto } from "./dto/upsert-supplier-type.dto";
import { UpsertRequirementRuleDto } from "./dto/upsert-requirement-rule.dto";
import {
  UpdateCompanyProfileDto,
  UpdateCompanyWorkforceDto,
} from "./dto/update-company-profile.dto";
import { WorkforceQueryDto } from "./dto/workforce-query.dto";
import { UpdateWorkforceStatusDto } from "./dto/update-workforce-status.dto";
import { UpdateWorkforceRequirementsDto } from "./dto/update-workforce-requirements.dto";

@Controller("requirement-rules")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequirementRulesController {
  constructor(
    private readonly requirementRulesService: RequirementRulesService,
  ) {}

  @Get("supplier-types")
  @Public()
  listSupplierTypes() {
    return this.requirementRulesService.listSupplierTypes();
  }

  @Post("supplier-types")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  createSupplierType(@Body() dto: UpsertSupplierTypeDto) {
    return this.requirementRulesService.createSupplierType(dto);
  }

  @Patch("supplier-types/:id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateSupplierType(
    @Param("id") id: string,
    @Body() dto: Partial<UpsertSupplierTypeDto>,
  ) {
    return this.requirementRulesService.updateSupplierType(id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  listRules() {
    return this.requirementRulesService.listRules();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  upsertRule(@Body() dto: UpsertRequirementRuleDto) {
    return this.requirementRulesService.upsertRule(dto);
  }

  @Put("companies/:companyId/profile")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateCompanyProfile(
    @Param("companyId") companyId: string,
    @Body() dto: UpdateCompanyProfileDto,
  ) {
    return this.requirementRulesService.updateCompanyProfile(companyId, dto);
  }

  @Get("companies/:companyId/workforce")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  getCompanyWorkforce(@Param("companyId") companyId: string, @Req() req: any) {
    if (req.user.role === UserRole.SUPPLIER && req.user.companyId !== companyId) {
      throw new ForbiddenException("Acesso negado a mao de obra de outra empresa");
    }
    return this.requirementRulesService.getCompanyWorkforce(companyId);
  }

  @Put("companies/:companyId/workforce")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  updateCompanyWorkforce(
    @Param("companyId") companyId: string,
    @Body() dto: UpdateCompanyWorkforceDto,
    @Req() req: any,
  ) {
    if (req.user.role === UserRole.SUPPLIER && req.user.companyId !== companyId) {
      throw new ForbiddenException("Acesso negado a mao de obra de outra empresa");
    }
    return this.requirementRulesService.updateCompanyWorkforce(companyId, dto);
  }

  @Get("workforce")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  listWorkforce(@Query() query: WorkforceQueryDto, @Req() req: any) {
    if (req.user.role === UserRole.SUPPLIER && !req.user.companyId) {
      throw new ForbiddenException("Fornecedor sem empresa associada");
    }
    const scopeCompanyId = req.user.role === UserRole.SUPPLIER ? req.user.companyId : undefined;
    return this.requirementRulesService.listWorkforce(query, scopeCompanyId);
  }

  @Get("workforce/:id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  getWorkforceById(@Param("id") id: string, @Req() req: any) {
    if (req.user.role === UserRole.SUPPLIER && !req.user.companyId) {
      throw new ForbiddenException("Fornecedor sem empresa associada");
    }
    const scopeCompanyId = req.user.role === UserRole.SUPPLIER ? req.user.companyId : undefined;
    return this.requirementRulesService.getWorkforceById(id, scopeCompanyId);
  }

  @Patch("workforce/:id/status")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  updateWorkforceStatus(
    @Param("id") id: string,
    @Body() dto: UpdateWorkforceStatusDto,
    @Req() req: any,
  ) {
    if (req.user.role === UserRole.SUPPLIER && !req.user.companyId) {
      throw new ForbiddenException("Fornecedor sem empresa associada");
    }
    const scopeCompanyId = req.user.role === UserRole.SUPPLIER ? req.user.companyId : undefined;
    return this.requirementRulesService.updateWorkforceStatus(id, dto.status, scopeCompanyId);
  }

  @Get("companies/:companyId/workforce-requirements")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  getWorkforceRequirements(@Param("companyId") companyId: string, @Req() req: any) {
    if (req.user.role === UserRole.SUPPLIER && req.user.companyId !== companyId) {
      throw new ForbiddenException("Acesso negado aos requisitos de outra empresa");
    }
    return this.requirementRulesService.getWorkforceRequirements(companyId);
  }

  @Put("companies/:companyId/workforce-requirements")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateWorkforceRequirements(
    @Param("companyId") companyId: string,
    @Body() dto: UpdateWorkforceRequirementsDto,
  ) {
    return this.requirementRulesService.updateWorkforceRequirements(companyId, dto);
  }

  @Get("workforce-requirements/global")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  getGlobalWorkforceRequirements() {
    return this.requirementRulesService.getGlobalWorkforceRequirements();
  }

  @Put("workforce-requirements/global")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateGlobalWorkforceRequirements(
    @Body() dto: UpdateWorkforceRequirementsDto,
  ) {
    return this.requirementRulesService.updateGlobalWorkforceRequirements(dto);
  }
}

