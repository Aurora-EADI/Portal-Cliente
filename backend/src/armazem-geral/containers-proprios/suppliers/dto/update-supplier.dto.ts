import { PartialType } from "@nestjs/mapped-types";
import { CreateContainerAgSupplierDto } from "./create-supplier.dto";

export class UpdateContainerAgSupplierDto extends PartialType(CreateContainerAgSupplierDto) {}
