import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import type { AuthUser } from '@app/common';
import { UsersService } from './users.service.js';
import { CreateUserDto, GrantRoleDto } from './dto/users.dto.js';

@Controller('users')
@Roles('MINEDU_ADMIN', 'UGEL_SPECIALIST', 'DIRECTOR')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Post(':id/roles')
  grant(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: GrantRoleDto) {
    return this.users.grantRole(user, id, dto);
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
