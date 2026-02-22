import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard that only applies to HTTP contexts.
 * Skips rate limiting for non-HTTP contexts (Telegraf, microservices, etc.)
 */
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  canActivate(context: ExecutionContext): Promise<boolean> {
    const type = context.getType();
    if (type !== 'http') {
      return Promise.resolve(true);
    }
    return super.canActivate(context);
  }
}
