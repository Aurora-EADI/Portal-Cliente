import { PartialType } from "@nestjs/swagger";
import { CreateConferenteDto } from "./create-conferente.dto";

export class UpdateConferenteDto extends PartialType(CreateConferenteDto) {}
