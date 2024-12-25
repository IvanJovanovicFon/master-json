import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes environment variables available globally
    }),
    // Oracle Connection
    TypeOrmModule.forRootAsync({
      name: 'oracleConnection',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'oracle',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT_ORACLE')),
        username: configService.get<string>('DATABASE_USER_ORACLE'),
        password: configService.get<string>('DATABASE_PASS_ORACLE'),
        database: configService.get<string>('DATABASE_USER_ORACLE'),
        serviceName: configService.get<string>('SERVICE_NAME_ONLY_ORACLE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: false,
        synchronize: false,
        options: {
          enableArithAbort: true,
          trustServerCertificate: true,
        },
      }),
    }),
    // Postgres Connection
    TypeOrmModule.forRootAsync({
      name: 'postgresConnection',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT_POSTGRES')),
        username: configService.get<string>('DATABASE_USER_POSTGRES'),
        password: configService.get<string>('DATABASE_PASS_POSTGRES'),
        database: configService.get<string>('DATABASE_NAME_Postgres'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    // SQL Server Connection
    TypeOrmModule.forRootAsync({
      name: 'mssqlConnection',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT_SQLSERVER')),
        username: configService.get<string>('DATABASE_USER_SQLSERVER'),
        password: configService.get<string>('DATABASE_PASS_SQLSERVER'),
        database: configService.get<string>('DATABASE_NAME_SQLSERVER'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: false,
        synchronize: false,
        options: {
          enableArithAbort: true,
          trustServerCertificate: true,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
