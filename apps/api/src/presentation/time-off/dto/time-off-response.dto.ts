import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { TimeOffStatus } from "../../../domain/time-off/time-off-status";

const CORPUS_ID = /^[A-Za-z0-9._-]+$/;

export class TimeOffResponseDto {
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  id!: string;

  @ApiProperty({ minLength: 1, maxLength: 64, pattern: "^[A-Za-z0-9._-]+$" })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(CORPUS_ID)
  employeeId!: string;

  @ApiProperty({
    description: "Work location for this request and its balance ledger",
    minLength: 1,
    maxLength: 64,
    pattern: "^[A-Za-z0-9._-]+$",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(CORPUS_ID)
  locationId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string | null;

  @ApiPropertyOptional({
    description: "Inclusive UTC calendar days requested (Decimal string)",
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  daysRequested?: string | null;

  @ApiProperty({ enum: ["PENDING", "APPROVED", "REJECTED"] })
  @IsIn(["PENDING", "APPROVED", "REJECTED"])
  status!: TimeOffStatus;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}
