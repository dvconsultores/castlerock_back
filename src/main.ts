import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from './shared/logger/app-logger';
import { ResponseInterceptor } from './helpers/interceptors/response.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';

process.loadEnvFile();

async function bootstrap() {
  const configService = new ConfigService();

  const port = configService.get('PORT');

  const logger = new AppLogger();

  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  // app.use(morgan('dev'));
  app.enableCors();
  app.setGlobalPrefix('/api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.use((req, res, next) => {
    let responseBody = '';

    const originalSend = res.send;
    res.send = function (body) {
      responseBody = body;
      originalSend.call(this, body);
    };

    req.startTime = Date.now();

    res.on('finish', () => {
      const method = req.method;
      const url = req.originalUrl;
      const status = res.statusCode;

      if (url.includes('swagger')) return;

      const logObject: any = {};
      if (Object.keys(req.query).length) logObject.query = req.query;
      if (Object.keys(req.params).length) logObject.params = req.params;
      if (Object.keys(req.body).length) {
        const filteredBody = { ...req.body };
        if ('password' in filteredBody) filteredBody.password = '********';
        logObject.body = filteredBody;
      }
      if (Object.keys(req.headers).length) logObject.headers = req.headers;
      if (req.user && Object.keys(req.user).length) logObject.user = req.user;

      try {
        logObject.response = JSON.parse(responseBody);
      } catch {
        logObject.response = responseBody;
      }

      const responseTime = `${Date.now() - req.startTime} ms`;

      const message = `${method} | ${status} | ${url} | ${responseTime}`;

      logger.log(message, logObject);
    });

    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Kindergarten API')
    .setDescription('Kindergarten API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port);

  const url = await app.getUrl();

  logger.log(`Server is running on ${url}`);
}

bootstrap();
