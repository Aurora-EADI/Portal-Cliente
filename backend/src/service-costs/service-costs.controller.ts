import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ServiceCostsService } from './service-costs.service';
import { CreateServiceCostDto } from './dto/create-service-cost.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('service-costs')
@UseGuards(JwtAuthGuard)
export class ServiceCostsController {
  constructor(private readonly serviceCostsService: ServiceCostsService) {}

  @Post()
  create(@Body() createServiceCostDto: CreateServiceCostDto, @Request() req) {
    return this.serviceCostsService.create(createServiceCostDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.serviceCostsService.findAll();
  }

  @Get('by-service/:serviceId')
  findByService(@Param('serviceId') serviceId: string) {
    return this.serviceCostsService.findByService(serviceId);
  }

  @Get('current/:serviceId')
  getCurrentCost(@Param('serviceId') serviceId: string) {
    return this.serviceCostsService.getCurrentCost(serviceId);
  }

  @Get('at-date/:serviceId')
  getCostAtDate(
    @Param('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    const parsedDate = new Date(date);
    return this.serviceCostsService.getCostAtDate(serviceId, parsedDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceCostsService.findOne(id);
  }
}
