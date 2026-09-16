import { PartialType } from '@nestjs/swagger';
import { CreateJanelasDto } from './create-janelas.dto';

export class UpdateJanelasDto extends PartialType(CreateJanelasDto) {}
