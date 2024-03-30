import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WebhookEventDto } from './dto/webhook-event.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Post('webhook')
  async handleWebhook(@Body() webhookPayload: WebhookEventDto) {
    return this.paymentsService.handleWebhook(webhookPayload);
  }
}
