import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class NoCacheInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse();
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', '0');
        return next.handle();
    }
}
