import { IsBoolean, IsNotEmpty } from "class-validator";

export class ToggleActivityDto {
  @IsBoolean({ message: "isEnabled deve ser true ou false" })
  @IsNotEmpty({ message: "isEnabled é obrigatório" })
  isEnabled: boolean;
}
