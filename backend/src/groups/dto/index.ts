import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString({ message: 'O nome do grupo deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome do grupo é obrigatório' })
  name: string;
}

export class AddMemberDto {
  @IsEmail({}, { message: 'Forneça um e-mail válido para o membro' })
  @IsNotEmpty({ message: 'O e-mail do membro é obrigatório' })
  email: string;
}
