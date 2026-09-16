import { PartialType } from '@nestjs/swagger';
import { CreateDisDto } from './create-dis.dto';

export class UpdateDisDto extends PartialType(CreateDisDto) {}
