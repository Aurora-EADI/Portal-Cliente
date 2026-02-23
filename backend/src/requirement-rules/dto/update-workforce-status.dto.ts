import { IsEnum } from "class-validator";

export class UpdateWorkforceStatusDto {
  @IsEnum(["ACTIVE", "INACTIVE"])
  status: "ACTIVE" | "INACTIVE";
}
