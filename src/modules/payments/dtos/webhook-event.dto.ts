import { WebhookDataDto } from './webhook-data.dto';
import { WebhookType } from '../enums/webhook-type.enum';

export class WebhookEventDto {
  type: WebhookType;
  data: WebhookDataDto;
}
