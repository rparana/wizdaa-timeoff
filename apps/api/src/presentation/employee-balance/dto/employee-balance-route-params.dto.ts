import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

const CORPUS_ID = /^[A-Za-z0-9._-]+$/;

/** Route params for `GET /employee-balances/:employeeId/:locationId` (validated before use case). */
export class EmployeeBalanceRouteParamsDto {
  @ApiProperty({
    example: "C",
    minLength: 1,
    maxLength: 64,
    pattern: "^[A-Za-z0-9._-]+$",
  })
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
}
