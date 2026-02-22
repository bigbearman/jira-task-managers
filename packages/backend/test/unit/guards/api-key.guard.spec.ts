import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from '../../../src/modules/api/guards/api-key.guard';
import { createMockConfigService } from '../../helpers/mock-repository';

describe('ApiKeyGuard', () => {
  function createMockContext(headers: Record<string, string> = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
        getResponse: () => ({}),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
    } as any;
  }

  it('should allow all requests when no API_KEY configured', () => {
    const configService = createMockConfigService({ API_KEY: undefined });
    const guard = new ApiKeyGuard(configService as any);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow request with valid API key', () => {
    const configService = createMockConfigService({ API_KEY: 'my-secret-key' });
    const guard = new ApiKeyGuard(configService as any);
    const context = createMockContext({ 'x-api-key': 'my-secret-key' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject request without API key when required', () => {
    const configService = createMockConfigService({ API_KEY: 'my-secret-key' });
    const guard = new ApiKeyGuard(configService as any);
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request with invalid API key', () => {
    const configService = createMockConfigService({ API_KEY: 'my-secret-key' });
    const guard = new ApiKeyGuard(configService as any);
    const context = createMockContext({ 'x-api-key': 'wrong-key' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
