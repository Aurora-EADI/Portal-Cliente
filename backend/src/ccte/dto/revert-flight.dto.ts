import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RevertFlightDto {
  @ApiProperty({
    description: "Justificativa obrigatoria para reabrir este voo",
  })
  @IsString()
  @IsNotEmpty({
    message: "A justificativa e obrigatoria para reabrir este voo",
  })
  reason: string;
}
