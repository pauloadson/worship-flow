import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'O nome deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  email: string;

  @IsString({ message: 'O telefone deve ser um texto válido' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'A senha deve ser um texto válido' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  email: string;

  @IsString({ message: 'A senha deve ser um texto válido' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;
}
