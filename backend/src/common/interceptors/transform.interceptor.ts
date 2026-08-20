import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  data: T;
  meta?: any;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // If response is already structured with data and (meta or message), preserve structure
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          ('meta' in data || 'message' in data)
        ) {
          return {
            statusCode,
            ...data,
          };
        }

        return {
          statusCode,
          data,
          message: 'Operation completed successfully',
        };
      }),
    );
  }
}
