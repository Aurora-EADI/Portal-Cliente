import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateCompanyStatusDto } from './dto/update-status.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';
import { CreateCompanyDto } from './dto/create-companies.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createDto: CreateCompanyDto) {
    return this.companiesService.create(createDto);
  }

  @Get()
  getAll() {
    return this.companiesService.getAll();
  }

  @Get('with-responsible')
  getAllWithResponsible(@Query() query: PaginationQueryDto) {
    return this.companiesService.getAllWithResponsible(query);
  }

  @Get('cnpj/:cnpj')
  findByCnpj(@Param('cnpj') cnpj: string) {
    return this.companiesService.findByCnpj(cnpj);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateCompanyStatusDto) {
    return this.companiesService.updateStatus(id, updateDto.status);
  }

  @Get(':companyId/requirements')
  getRequirements(@Param('companyId') companyId: string) {
    return this.companiesService.getRequirements(companyId);
  }

  @Patch(':companyId/requirements')
  updateRequirements(
    @Param('companyId') companyId: string,
    @Body() updateDto: UpdateRequirementsDto,
  ) {
    return this.companiesService.updateRequirements(companyId, updateDto);
  }
}