import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from "class-validator";
import { Transform } from "class-transformer";

export class UpdateOperationalContainerDto {
  @IsOptional()
  @IsString()
  @Length(0, 40)
  containerType?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  originalSeal?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  freeTimeDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  isFull?: boolean;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  location?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString({ each: true })
  avarias?: string[];
}
