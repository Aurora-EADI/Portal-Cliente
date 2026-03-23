import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReceptionService } from './reception.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reception')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createContactDto: CreateContactDto) {
    return this.receptionService.create(createContactDto);
  }

  @Get()
  findAll(
    @Query('name') name?: string,
    @Query('department') department?: string,
    @Query('position') position?: string,
  ) {
    return this.receptionService.findAll({ name, department, position });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receptionService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.receptionService.update(id, updateContactDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.receptionService.remove(id);
  }
}
