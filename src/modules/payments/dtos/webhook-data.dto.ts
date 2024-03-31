import { ApiProperty } from '@nestjs/swagger';
import { BillingPeriod } from '../enums/billing-period.enum';

export class WebhookDataDto {
  @ApiProperty({
    description: 'The email of the customer',
    example: 'user@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    description: 'The ID of the payment method',
    example: 1,
  })
  paymentMethodId?: number;

  @ApiProperty({
    description: 'The ID of the subscription',
    example: 'sub_123456789',
  })
  subscriptionId: string;

  @ApiProperty({
    description: 'The amount of the subscription',
    example: 9.99,
  })
  amount: number;

  @ApiProperty({
    description: 'The billing period of the subscription',
    example: BillingPeriod.MONTHLY,
  })
  billingPeriod: BillingPeriod;
}
