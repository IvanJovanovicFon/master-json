import {Global, Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule, TypeOrmModuleOptions} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {MoviesController} from './movies/movies.controller';
import {OracleService} from "./movies/oracle/oracle.service";
import {SqlServerService} from "./movies/sqlServer/mssql.service";
import {PostgresService} from "./movies/postgres/postgres.service";
import {DatabaseModule} from "./dataSource/DatabaseModule";
import {DataSource} from "typeorm";

@Module({
    imports: [
        DatabaseModule,
        ConfigModule.forRoot(),
        // TypeOrmModule.forRootAsync({
        //     imports: [ConfigModule],
        //     useFactory: (configService: ConfigService) => ({
        //         type: 'oracle',
        //         host: configService.get<string>('DATABASE_HOST'),
        //         port: parseInt(configService.get<string>('DATABASE_PORT_ORACLE')),
        //         username: configService.get<string>('DATABASE_USER_ORACLE'),
        //         password: configService.get<string>('DATABASE_PASS_ORACLE'),
        //         database: configService.get<string>('DATABASE_USER_ORACLE'),
        //         serviceName: configService.get<string>('SERVICE_NAME_ONLY_ORACLE'),
        //         entities: [__dirname + '/**/*.entity{.ts,.js}'],
        //         // No entities are needed if you're not using ORM for auto-loading
        //         autoLoadEntities: false,
        //         synchronize: false, // Ensure synchronization is false, since you're using raw SQL
        //         options: {
        //             enableArithAbort: true,
        //             trustServerCertificate: true,
        //         },
        //     }),
        //     inject: [ConfigService],
        // }),

        // TypeOrmModule.forRootAsync({
        //     imports: [ConfigModule],
        //     useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        //         type: 'postgres',
        //         host: configService.get<string>('DATABASE_HOST'),
        //         port: parseInt(configService.get<string>('DATABASE_PORT_POSTGRES')),
        //         username: configService.get<string>('DATABASE_USER_POSTGRES'),
        //         password: configService.get<string>('DATABASE_PASS_POSTGRES'),
        //         database: configService.get<string>('DATABASE_NAME_POSTGRES'),
        //         entities: [__dirname + '/**/*.entity{.ts,.js}'],
        //         // No entities are needed if you're not using ORM for auto-loading
        //         autoLoadEntities: false,
        //         synchronize: false, // Ensure synchronization is false, since you're using raw SQL
        //     }),
        //     inject: [ConfigService],
        // }),


        // TypeOrmModule.forRootAsync({
        //     imports: [ConfigModule],
        //     useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        //         type: 'mssql',
        //         host: configService.get<string>('DATABASE_HOST'),
        //         port: parseInt(configService.get<string>('DATABASE_PORT_SQLSERVER')),
        //         username: configService.get<string>('DATABASE_USER_SQLSERVER'),
        //         password: configService.get<string>('DATABASE_PASS_SQLSERVER'),
        //         database: configService.get<string>('DATABASE_NAME_SQLSERVER'),
        //         entities: [__dirname + '/**/*.entity{.ts,.js}'],
        //         autoLoadEntities: false,
        //         synchronize: false,
        //         options: {
        //             enableArithAbort: true,
        //             trustServerCertificate: true,
        //         },
        //     }),
        //     inject: [ConfigService],
        // }),

    ],

    controllers: [AppController, MoviesController],
    providers: [AppService, OracleService, SqlServerService, PostgresService],
})
export class AppModule {
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import {Module} from '@nestjs/common';
// import {AppController} from './app.controller';
// import {AppService} from './app.service';
// import {MoviesController} from "./movies/movies.controller";
// import {OracleService} from "./movies/oracle/oracle.service";
// import {SqlServerService} from "./movies/sqlServer/mssql.service";
// import {PostgresService} from "./movies/postgres/postgres.service";
// import {TypeOrmModule} from "@nestjs/typeorm";
// import {DataSource} from "typeorm";
//
// @Module({
//     imports: [TypeOrmModule],
//     controllers: [AppController, MoviesController],
//     providers: [AppService, OracleService, SqlServerService, PostgresService, DataSource],
// })
// export class AppModule {
// }