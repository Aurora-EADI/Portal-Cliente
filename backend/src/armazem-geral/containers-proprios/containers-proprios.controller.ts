import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateContainerProprioDto } from "./dto/create-container-proprio.dto";
import { DispatchOwnedContainerDto } from "./dto/dispatch-owned-container.dto";
import { ReturnOwnedContainerDto } from "./dto/return-owned-container.dto";
import { UpdateContainerProprioDto } from "./dto/update-container-proprio.dto";
import { ContainersPropriosService } from "./containers-proprios.service";
import { ContainersAgSuppliersService } from "./suppliers/suppliers.service";
import { CreateContainerAgSupplierDto } from "./suppliers/dto/create-supplier.dto";
import { UpdateContainerAgSupplierDto } from "./suppliers/dto/update-supplier.dto";

@Controller("armazem-geral/containers-proprios")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContainersPropriosController {
  constructor(
    private readonly containersPropriosService: ContainersPropriosService,
    private readonly suppliersService: ContainersAgSuppliersService,
  ) {}

  // ─── Rotas estáticas ANTES de qualquer :id ─────────────────────────
  @Get("next-code")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  getNextCode() {
    return this.containersPropriosService.generateNextCode();
  }

  // ─── Suppliers (subrecurso estático, ANTES do :id) ──────────────────
  @Get("suppliers")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAllSuppliers() {
    return this.suppliersService.findAll();
  }

  @Post("suppliers")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  createSupplier(@Body() dto: CreateContainerAgSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get("suppliers/:id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOneSupplier(@Param("id", ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch("suppliers/:id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateSupplier(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContainerAgSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete("suppliers/:id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSupplier(@Param("id", ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(id);
  }

  // ─── Containers Próprios ────────────────────────────────────────────
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateContainerProprioDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersPropriosService.create(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("inPatio") inPatio?: string,
    @Query("customerIds") customerIds?: string | string[],
  ) {
    let ids: string[] | undefined = undefined;
    if (customerIds) {
      ids = typeof customerIds === "string" ? customerIds.split(",") : customerIds;
    }

    return this.containersPropriosService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      inPatio: inPatio === undefined ? undefined : inPatio === "true",
      customerIds: ids,
    });
  }

  @Post(":id/dispatch")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  dispatch(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: DispatchOwnedContainerDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersPropriosService.dispatch(id, dto, req.user.id);
  }

  @Post(":id/return")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  returnToPatio(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReturnOwnedContainerDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersPropriosService.returnToPatio(id, dto, req.user.id);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.containersPropriosService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContainerProprioDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersPropriosService.update(id, dto, req.user.id);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.containersPropriosService.remove(id, req.user.id);
  }
}
