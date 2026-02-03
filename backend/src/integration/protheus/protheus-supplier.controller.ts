import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ProtheusSupplierService } from "./protheus-supplier.service";
import { CreateSupplierFromProtheusDto } from "./dto/create-supplier-from-protheus.dto";
import { ApiKeyAuthGuard } from "../guards/api-key-auth.guard";

@Controller("integration/protheus")
@UseGuards(ApiKeyAuthGuard) // Protege todos os endpoints com API Key
export class ProtheusSupplierController {
  constructor(
    private readonly protheusSupplierService: ProtheusSupplierService,
  ) {}

  @Post("supplier")
  @HttpCode(HttpStatus.CREATED)
  async createSupplier(@Body() dto: CreateSupplierFromProtheusDto) {
    return this.protheusSupplierService.createSupplier(dto);
  }
}
