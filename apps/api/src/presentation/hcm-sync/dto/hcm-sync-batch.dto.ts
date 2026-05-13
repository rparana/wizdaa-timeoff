import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

const CORPUS_ID = /^[A-Za-z0-9._-]+$/;

export class HcmSyncEmployeeDto {
  @ApiProperty({
    example: "A",
    minLength: 1,
    maxLength: 128,
    pattern: "^[A-Za-z0-9._-]+$",
    description: "Stable employee id (matches HCM / ledger identifiers)",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(CORPUS_ID)
  id!: string;

  @ApiProperty({ maxLength: 256 })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  displayName!: string;

  @ApiProperty({ maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ maxLength: 128, pattern: "^[A-Za-z0-9._-]+$" })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(CORPUS_ID)
  departmentId!: string;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: 128,
    description: "Optional manager employee id",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(CORPUS_ID)
  managerId?: string | null;
}

export class HcmSyncDepartmentDto {
  @ApiProperty({
    example: "dept_eng",
    minLength: 1,
    maxLength: 128,
    pattern: "^[A-Za-z0-9._-]+$",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(CORPUS_ID)
  id!: string;

  @ApiProperty({ maxLength: 256 })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  name!: string;

  @ApiPropertyOptional({
    description: "Optional non-negative headcount",
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  headcount?: number | null;
}

export class HcmSyncBatchDto {
  @ApiProperty({
    type: [HcmSyncEmployeeDto],
    description: "Employees to upsert into the local HCM corpus (max 5000 per batch)",
  })
  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => HcmSyncEmployeeDto)
  employees!: HcmSyncEmployeeDto[];

  @ApiProperty({
    type: [HcmSyncDepartmentDto],
    description: "Departments to upsert (max 2000 per batch)",
  })
  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => HcmSyncDepartmentDto)
  departments!: HcmSyncDepartmentDto[];
}
