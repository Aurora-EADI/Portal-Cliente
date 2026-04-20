import {
  IsOptional,
  IsInt,
  IsEnum,
  Max,
  IsString,
  IsArray,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { UserRole, CompanyStatus } from "@prisma/client";

export class UserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map((v) => v.trim());
    }
    return value;
  })
  @IsArray()
  roles?: UserRole[]; // Array de roles permitidos (ex: "ADMIN,EMPLOYEE")

  @IsOptional()
  @IsEnum(CompanyStatus)
  companyStatus?: CompanyStatus; // Filtrar por status da empresa
}
