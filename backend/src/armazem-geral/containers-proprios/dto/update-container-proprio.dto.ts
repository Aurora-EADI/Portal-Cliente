import { PartialType } from "@nestjs/mapped-types";
import { CreateContainerProprioDto } from "./create-container-proprio.dto";

export class UpdateContainerProprioDto extends PartialType(CreateContainerProprioDto) {}
