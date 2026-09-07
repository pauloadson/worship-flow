import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateSongDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  title: string;

  @IsString()
  @IsOptional()
  artist?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  lyrics?: string;

  @IsUrl({}, { message: 'URL da cifra inválida.' })
  @IsOptional()
  sheetMusicUrl?: string;

  @IsUrl({}, { message: 'URL do vídeo/YouTube inválida.' })
  @IsOptional()
  videoLessonUrl?: string;

  @IsUrl({}, { message: 'URL do áudio inválida.' })
  @IsOptional()
  audioUrl?: string;
}

export class UpdateSongDto extends CreateSongDto {}
