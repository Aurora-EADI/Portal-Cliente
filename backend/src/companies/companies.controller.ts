import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client-postgres';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  getAll(){
    return this.companiesService.getAll()
  }

  @Get('with-responsible')
  @Roles(UserRole.ADMIN)
  async getAllWithResponsible() {
    return this.companiesService.getAllWithResponsible();
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.companiesService.updateStatus(id, dto.status);
  }
}
