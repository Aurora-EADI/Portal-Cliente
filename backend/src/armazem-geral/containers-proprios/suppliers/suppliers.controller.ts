import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ContainersAgSuppliersService } from "./suppliers.service";
import { CreateContainerAgSupplierDto } from "./dto/create-supplier.dto";
import { UpdateContainerAgSupplierDto } from "./dto/update-supplier.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";

@Controller("armazem-geral/containers-proprios/suppliers")
@UseGuards(JwtAuthGuard)
export class ContainersAgSuppliersController {
  constructor(private readonly suppliersService: ContainersAgSuppliersService) {}

  @Post()
  create(@Body() dto: CreateContainerAgSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateContainerAgSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.suppliersService.remove(id);
  }
}
