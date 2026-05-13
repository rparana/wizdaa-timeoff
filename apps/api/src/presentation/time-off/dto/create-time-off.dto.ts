import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export class CreateTimeOffDto {
  @ApiProperty({
    example: "A",
    minLength: 1,
    maxLength: 64,
    pattern: "^[A-Za-z0-9._-]+$",
    description: "Employee identifier (alphanumeric, dot, underscore, hyphen)",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(ID_PATTERN, {
    message:
      "employeeId must contain only letters, digits, '.', '_', or '-' (1–64 chars)",
  })
  employeeId!: string;

  @ApiProperty({
    example: "US_OFFICE",
    minLength: 1,
    maxLength: 64,
    pattern: "^[A-Za-z0-9._-]+$",
    description: "Location key; balance is enforced per employee per location",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(ID_PATTERN, {
    message:
      "locationId must contain only letters, digits, '.', '_', or '-' (1–64 chars)",
  })
  locationId!: string;

  @ApiProperty({
    type: String,
    format: "date-time",
    description: "Inclusive range start (UTC calendar-day semantics in domain)",
  })
  @Type(() => Date)
  @IsDate({ message: "startDate must be a valid Date" })
  startDate!: Date;

  @ApiProperty({
    type: String,
    format: "date-time",
    description: "Inclusive range end (UTC); must be on or after startDate (enforced in domain)",
  })
  @Type(() => Date)
  @IsDate({ message: "endDate must be a valid Date" })
  endDate!: Date;

  @ApiPropertyOptional({
    maxLength: 2000,
    description: "Optional free-text reason (max 2000 chars)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
