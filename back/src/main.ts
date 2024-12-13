import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'localhost:59047',
      'localhost:4200',
      'http://localhost:4200',
      'http://localhost:59047',
    ],
    methods: 'GET,POST',
    credentials: true,
  });
  await app.listen(process.env.SERVER_PORT);
}

bootstrap();
