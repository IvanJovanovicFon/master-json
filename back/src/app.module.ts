import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MoviesController } from './movies/movies.controller';
import { MoviesModule } from './movies/movies.module';
import {MoviesServiceOracle} from "./movies/Services/movies.service.oracle";


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT_ORACLE')),
        username: configService.get<string>('DATABASE_USER_ORACLE'),
        password: configService.get<string>('DATABASE_PASS_ORACLE'),
        database: configService.get<string>('DATABASE_USER_ORACLE'),
        serviceName: configService.get<string>('SERVICE_NAME_ONLY_ORACLE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // No entities are needed if you're not using ORM for auto-loading
        autoLoadEntities: false,
        synchronize: false, // Ensure synchronization is false, since you're using raw SQL
        options: {
          enableArithAbort: true,
          trustServerCertificate: true,
        },
      }),
      inject: [ConfigService],
    }),
    MoviesModule,
  ],
  controllers: [AppController, MoviesController],
  providers: [AppService, MoviesServiceOracle],
})
export class AppModule {}
