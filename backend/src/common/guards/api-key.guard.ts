import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Pega a chave do header 'x-api-key'
    const apiKey = request.headers['x-api-key'];
    
    // Compara com a chave salva no .env
    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new UnauthorizedException('Chave de segurança da API inválida ou ausente.');
    }
    
    return true;
  }
}
