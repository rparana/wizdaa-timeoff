import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

const CORPUS_ID = /^[A-Za-z0-9._-]+$/;

export class EmployeeBalanceResponseDto {
  @ApiProperty({ example: "C", minLength: 1, maxLength: 64, pattern: "^[A-Za-z0-9._-]+$" })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(CORPUS_ID)
  employeeId!: string;

  @ApiProperty({
    example: "US_OFFICE",
    minLength: 1,
    maxLength: 64,
    pattern: "^[A-Za-z0-9._-]+$",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(CORPUS_ID)
  locationId!: string;

  @ApiProperty({
    example: "7.5",
    description:
      "PTO balance in days as stored in the ledger (decimal string), returned verbatim with no rounding.",
    maxLength: 32,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  balanceDays!: string;
}
