import { IsBoolean } from 'class-validator';

/** Payload de PATCH /service/users/:id/active. */
export class SetUserActiveDto {
  @IsBoolean() active!: boolean;
}
