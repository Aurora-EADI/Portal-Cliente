import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class ExitContainerDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  notes?: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
