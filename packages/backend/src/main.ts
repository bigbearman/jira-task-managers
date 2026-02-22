import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@/api/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger (non-production only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Multi Jira Task Managers')
      .setDescription('AI-powered multi-Jira task management API')
      .setVersion('0.1.0')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    logger.log('Swagger docs available at /docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const isApi = process.env.IS_API === '1' || process.env.IS_API === 'true';
  const isWorker = process.env.IS_WORKER === '1' || process.env.IS_WORKER === 'true';
  const isBot = process.env.IS_BOT === '1' || process.env.IS_BOT === 'true';

  logger.log(`Server running on port ${port}`);
  logger.log(`Modes: API=${isApi || 'default'} Worker=${isWorker} Bot=${isBot}`);
}

bootstrap();
