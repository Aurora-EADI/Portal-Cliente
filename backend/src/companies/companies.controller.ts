import {
  Controller,
  Post,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client-postgres';
import { CreateCompanyDto } from './dto/create-companies.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto)
  }

  @Get()
  @Roles(UserRole.ADMIN)
  getAll() {
    return this.companiesService.getAll()
  }

  @Get('with-responsible')
  @Roles(UserRole.ADMIN)
  async getAllWithResponsible() {
    return this.companiesService.getAllWithResponsible();
  }

  @Public()
  @Get('cnpj/:cnpj')
  async findByCnpj(@Param('cnpj') cnpj: string) {
    return this.companiesService.findByCnpj(cnpj);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.companiesService.updateStatus(id, dto.status);
  }

  @Get(':id/requirements')
  @Roles(UserRole.ADMIN)
  async getRequirements(@Param('id') id: string) {
    return this.companiesService.getRequirements(id);
  }

  @Post(':id/requirements')
  @Roles(UserRole.ADMIN)
  async updateRequirements(
    @Param('id') id: string,
    @Body() body: { requirements: { documentTypeId: number; isRequired: boolean }[] },
  ) {
    return this.companiesService.updateRequirements(id, body.requirements);
  }
}
