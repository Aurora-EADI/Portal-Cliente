import { IsBoolean, IsNotEmpty } from "class-validator";

export class ToggleModuleDto {
  @IsBoolean({ message: "isEnabled deve ser true ou false" })
  @IsNotEmpty({ message: "isEnabled é obrigatório" })
  isEnabled: boolean;
}
