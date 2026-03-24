import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { UpdateCompanyStatusDto } from "./dto/update-status.dto";
import { UpdateRequirementsDto } from "./dto/update-requirements.dto";
import { CreateCompanyDto } from "./dto/create-companies.dto";
import { RequestAccessDto } from "./dto/request-access.dto";
import { Public } from "../common/decorators/public.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("Empresas")
@ApiBearerAuth()
@Controller("companies")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Criar nova empresa" })
  @ApiResponse({ status: 201, description: "Empresa criada com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  create(@Body() createDto: CreateCompanyDto) {
    return this.companiesService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Listar todas as empresas" })
  @ApiResponse({
    status: 200,
    description: "Lista de empresas retornada com sucesso",
  })
  getAll() {
    return this.companiesService.getAll();
  }

  @Get("with-responsible")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Listar todas as empresas com seus responsáveis" })
  @ApiResponse({
    status: 200,
    description: "Lista de empresas com responsáveis retornada com sucesso",
  })
  getAllWithResponsible(@Query() query: PaginationQueryDto) {
    return this.companiesService.getAllWithResponsible(query);
  }

  @Get("active")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  @ApiOperation({ summary: "Listar apenas empresas ativas" })
  @ApiResponse({
    status: 200,
    description: "Lista de empresas ativas retornada com sucesso",
  })
  getActive(@Query() query: PaginationQueryDto) {
    return this.companiesService.getActiveCompanies(query);
  }

  @Get("cnpj/:cnpj")
  @Public()
  @ApiOperation({ summary: "Buscar empresa por CNPJ" })
  @ApiResponse({ status: 200, description: "Empresa encontrada" })
  @ApiResponse({ status: 404, description: "Empresa não encontrada" })
  findByCnpj(@Param("cnpj") cnpj: string) {
    return this.companiesService.findByCnpj(cnpj);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Atualizar status da empresa" })
  @ApiResponse({
    status: 200,
    description: "Status da empresa atualizado com sucesso",
  })
  @ApiResponse({ status: 404, description: "Empresa não encontrada" })
  updateStatus(
    @Param("id") id: string,
    @Body() updateDto: UpdateCompanyStatusDto,
  ) {
    return this.companiesService.updateStatus(id, updateDto.status);
  }

  @Get(":companyId/requirements")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER)
  @ApiOperation({ summary: "Obter requisitos de documentos da empresa" })
  @ApiResponse({
    status: 200,
    description: "Requisitos retornados com sucesso",
  })
  getRequirements(@Param("companyId") companyId: string) {
    return this.companiesService.getRequirements(companyId);
  }

  @Patch(":companyId/requirements")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: "Atualizar requisitos de documentos da empresa" })
  @ApiResponse({
    status: 200,
    description: "Requisitos atualizados com sucesso",
  })
  @ApiResponse({ status: 404, description: "Empresa não encontrada" })
  updateRequirements(
    @Param("companyId") companyId: string,
    @Body() updateDto: UpdateRequirementsDto,
  ) {
    return this.companiesService.updateRequirements(companyId, updateDto);
  }

  @Public()
  @Patch(":companyId/request-access")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Solicitar acesso: Atualiza empresa e usuário SUPPLIER",
  })
  @ApiResponse({ status: 200, description: "Solicitação enviada com sucesso" })
  @ApiResponse({ status: 404, description: "Empresa não encontrada" })
  @ApiResponse({
    status: 409,
    description: "Email já cadastrado para outra empresa",
  })
  requestAccess(
    @Param("companyId") companyId: string,
    @Body() requestAccessDto: RequestAccessDto,
  ) {
    return this.companiesService.requestAccess(companyId, requestAccessDto);
  }
}
