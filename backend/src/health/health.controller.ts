import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    const isReady = await this.healthService.check();

    if (!isReady) {
      throw new ServiceUnavailableException({ status: 'error' });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
