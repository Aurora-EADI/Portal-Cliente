import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, IsBoolean } from 'class-validator';

class ActivityConfigDto {
  @IsInt({ message: 'activityId deve ser um número inteiro' })
  activityId: number;

  @IsBoolean({ message: 'isEnabled deve ser true ou false' })
  isEnabled: boolean;
}

export class BulkConfigureActivitiesDto {
  @IsArray({ message: 'activities deve ser um array' })
  @ArrayMinSize(1, { message: 'Pelo menos uma atividade deve ser informada' })
  @ValidateNested({ each: true })
  @Type(() => ActivityConfigDto)
  activities: ActivityConfigDto[];
}