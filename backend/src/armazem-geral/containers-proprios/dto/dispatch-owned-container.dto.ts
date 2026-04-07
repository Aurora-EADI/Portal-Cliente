import { IsArray, IsOptional, IsString, IsUUID, Length } from "class-validator";

export class DispatchOwnedContainerDto {
  @IsUUID()
  customerId: string;

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avarias?: string[];
}

