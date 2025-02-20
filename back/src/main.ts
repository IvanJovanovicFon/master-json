import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import {NoCacheInterceptor} from "./Interceptor/no-cache.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'localhost:4200',
      'http://localhost:4200',
    ],
    methods: 'GET,POST,PUT, DELETE',
    credentials: true
  });
  app.useGlobalInterceptors(new NoCacheInterceptor());
  await app.listen(process.env.SERVER_PORT);
}

bootstrap();
