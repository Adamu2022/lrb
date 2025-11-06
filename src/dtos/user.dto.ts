import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['super_admin', 'lecturer', 'student'])
  role: 'super_admin' | 'lecturer' | 'student';
}