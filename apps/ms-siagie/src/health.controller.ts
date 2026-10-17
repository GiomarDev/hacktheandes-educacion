import { Controller, Get } from '@nestjs/common';
import { Public } from '@app/common';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'ms-siagie' };
  }
}
