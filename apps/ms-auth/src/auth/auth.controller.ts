import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { CurrentUser, Public } from '@app/common';
import type { AuthUser, Role } from '@app/common';
import type { Request, Response } from 'express';
import { AuthService, TooManyLoginAttemptsException } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { OnboardingDto } from './dto/onboarding.dto.js';
import { ROLES } from '../users/dto/users.dto.js';
import { RequestMeta } from './tokens.service.js';

export const metaOf = (req: Request): RequestMeta => ({ ip: req.ip, userAgent: req.get('user-agent') });

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      return await this.auth.login(dto, metaOf(req));
    } catch (error) {
      if (error instanceof TooManyLoginAttemptsException) res.setHeader('Retry-After', String(error.retryAfterSeconds));
      throw error;
    }
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

  // Recorrido de bienvenida del frontend: qué roles ya lo vieron, para mostrarlo una vez por rol.
  @Get('onboarding')
  onboarding(@CurrentUser() user: AuthUser) {
    return this.auth.onboarding(user.id);
  }

  @Post('onboarding')
  @HttpCode(200)
  completeOnboarding(@CurrentUser() user: AuthUser, @Body() dto: OnboardingDto) {
    if (!user.roles.some((r) => r.role === dto.role)) throw new ForbiddenException('No tiene ese rol');
    return this.auth.setOnboarded(user.id, dto.role, true);
  }

  @Delete('onboarding/:role')
  resetOnboarding(@CurrentUser() user: AuthUser, @Param('role') role: string) {
    if (!ROLES.includes(role as Role) || !user.roles.some((r) => r.role === role)) throw new ForbiddenException('No tiene ese rol');
    return this.auth.setOnboarded(user.id, role as Role, false);
  }
}
