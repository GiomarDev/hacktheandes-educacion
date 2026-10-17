import { Controller, Get } from '@nestjs/common';
import { KeysService } from './keys.service.js';

@Controller('.well-known')
export class JwksController {
  constructor(private readonly keys: KeysService) {}

  @Get('jwks.json')
  jwks() {
    return this.keys.getJwks();
  }
}
