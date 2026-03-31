import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UpdateMeDto } from './dto/update-me.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getMe(@Req() request: Request) {
    return this.authService.getMe(request);
  }

  @Patch('me')
  updateMe(@Req() request: Request, @Body() updateMeDto: UpdateMeDto) {
    return this.authService.updateMe(request, updateMeDto);
  }

  @Post('verification/resend')
  resendVerificationCode(@Req() request: Request) {
    return this.authService.resendVerificationCode(request);
  }
}
