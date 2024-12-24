import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MssqlService } from './mssql.service';
import { CreateMssqlDto } from './dto/create-mssql.dto';
import { UpdateMssqlDto } from './dto/update-mssql.dto';

@Controller('mssql')
export class MssqlController {
  constructor(private readonly mssqlService: MssqlService) {}

  @Post()
  create(@Body() createMssqlDto: CreateMssqlDto) {
    return this.mssqlService.create(createMssqlDto);
  }

  @Get()
  findAll() {
    return this.mssqlService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mssqlService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMssqlDto: UpdateMssqlDto) {
    return this.mssqlService.update(+id, updateMssqlDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mssqlService.remove(+id);
  }
}
