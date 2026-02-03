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
import { DocumentTypesService } from "./document-types.service";
import { Prisma } from "@prisma/client-postgres";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client-postgres";

@Controller("document-types")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() data: Prisma.DocumentTypeCreateInput) {
    return this.documentTypesService.create(data);
  }

  @Get()
  findAll() {
    return this.documentTypesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentTypesService.findOne(+id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  update(
    @Param("id") id: string,
    @Body() data: Prisma.DocumentTypeUpdateInput,
  ) {
    return this.documentTypesService.update(+id, data);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string) {
    return this.documentTypesService.remove(+id);
  }
}
