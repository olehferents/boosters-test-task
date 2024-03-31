import { WebhookDataDto } from './webhook-data.dto';
import { WebhookType } from '../enums/webhook-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventDto {
  @ApiProperty({
    description: 'The type of the webhook event',
    enum: WebhookType,
    example: WebhookType.SUBSCRIPTION_PURCHASE_SUCCESSFUL,
  })
  type: WebhookType;

  @ApiProperty({
    description: 'The data associated with the webhook event',
    type: WebhookDataDto,
  })
  data: WebhookDataDto;
}
