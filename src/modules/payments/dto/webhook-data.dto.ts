import { BillingPeriod } from '../enum/billing-period.enum';

export class WebhookDataDto {
  customerEmail: string;
  subscriptionId: string;
  paymentMethodId?: number;
  amount: number;
  billingPeriod: BillingPeriod;
}
