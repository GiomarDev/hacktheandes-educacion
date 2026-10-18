import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import type { AuthUser } from '@app/common';
import { UsersService } from './users.service.js';
import { CreateUserDto, GrantRoleDto, ListUsersQuery, UpdatePhoneDto } from './dto/users.dto.js';

@Controller('users')
@Roles('MINEDU_ADMIN', 'UGEL_SPECIALIST', 'DIRECTOR')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('MINEDU_ADMIN', 'DRE_SPECIALIST', 'UGEL_SPECIALIST', 'DIRECTOR')
  list(@CurrentUser() user: AuthUser, @Query() query: ListUsersQuery) {
    return this.users.list(user, query);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Post(':id/roles')
  grant(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: GrantRoleDto) {
    return this.users.grantRole(user, id, dto);
  }

  @Patch(':id/phone')
  updatePhone(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePhoneDto) {
    return this.users.updatePhone(user, id, dto);
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(204)
  async revoke(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    await this.users.revokeRole(user, id, roleId);
  }
}
