import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { AuthUser, CurrentUser, Public } from '@app/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { RequestMeta } from './tokens.service.js';

export const metaOf = (req: Request): RequestMeta => ({ ip: req.ip, userAgent: req.get('user-agent') });

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, metaOf(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, metaOf(req));
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto, @Req() req: Request): Promise<void> {
    await this.auth.logout(dto.refreshToken, metaOf(req));
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('change-password')
  @HttpCode(204)
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto, @Req() req: Request): Promise<void> {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword, metaOf(req));
  }
}
