import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Alert } from './alert.entity';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@ApiTags('alerts')
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @ApiOperation({ summary: 'Set a price alert for a specific chain' })
  @ApiResponse({ status: 201, description: `The alert has been successfully created.`, type: Alert })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createAlert(@Body() createAlertDto: CreateAlertDto): Promise<Alert> {
    const { chain, targetPrice, email } = createAlertDto;
    return this.alertService.createAlert(chain, targetPrice, email);
  }

   
}
