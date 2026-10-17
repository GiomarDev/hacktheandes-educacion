import { Controller, Get } from '@nestjs/common';
import { Public } from '@app/common';
import { KeysService } from './keys.service.js';

@Public()
@Controller('.well-known')
export class JwksController {
  constructor(private readonly keys: KeysService) {}

  @Get('jwks.json')
  jwks() {
    return this.keys.getJwks();
  }
}
