import { IsString, Length } from "class-validator";

export class UpdateContainerLocationDto {
  @IsString()
  @Length(1, 120)
  location!: string;
}
