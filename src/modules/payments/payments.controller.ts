import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './services/payments.service';
import { WebhookEventDto } from './dtos/webhook-event.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhookType } from './enums/webhook-type.enum';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({
    summary: 'Handle a webhook event',
    description: 'Handles a webhook event from a third-party payment provider',
  })
  @ApiBody({
    type: WebhookEventDto,
    description: 'The webhook event payload',
    examples: {
      'Subscription Purchased': {
        summary: 'Subscription Purchased',
        value: {
          type: WebhookType.SUBSCRIPTION_PURCHASE_SUCCESSFUL,
          data: {
            customerEmail: 'user@example.com',
            paymentMethodId: 1,
            subscriptionId: 'sub_123456789',
            amount: 9.99,
            billingPeriod: 'monthly',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook event handled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook event payload',
  })
  @Post('webhook')
  async handleWebhook(@Body() webhookPayload: WebhookEventDto) {
    return this.paymentsService.handleWebhook(webhookPayload);
  }
}
