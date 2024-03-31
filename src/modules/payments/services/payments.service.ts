import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { WebhookEventDto } from '../dtos/webhook-event.dto';
import { WebhookType } from '../enums/webhook-type.enum';
import { SubscriptionsService } from './subscription.service';
import { UserSubscriptionsService } from './user-subscriptions.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly userSubscriptionsService: UserSubscriptionsService,
  ) {}

  async handleWebhook(webhookPayload: WebhookEventDto) {
    const { type, data } = webhookPayload;
    const {
      customerEmail,
      paymentMethodId,
      subscriptionId,
      amount,
      billingPeriod,
    } = data;
    const user = await this.usersService.findByEmail(customerEmail);

    if (!user) {
      this.logger.error(`User with email ${customerEmail} not found`);
      return;
    }

    switch (type) {
      case WebhookType.SUBSCRIPTION_CREATED:
        await this.subscriptionsService.createSubscription(
          subscriptionId,
          amount,
          billingPeriod,
        );
        break;
      case WebhookType.SUBSCRIPTION_DELETED:
        await this.subscriptionsService.deleteSubscription(subscriptionId);
        break;
      case WebhookType.SUBSCRIPTION_PURCHASE_SUCCESSFUL:
        await this.userSubscriptionsService.purchaseSubscription(
          user,
          subscriptionId,
          paymentMethodId,
        );
        break;
      case WebhookType.SUBSCRIPTION_RENEWAL_SUCCESSFUL:
        await this.userSubscriptionsService.renewSubscription(
          user,
          subscriptionId,
        );
        break;
      case WebhookType.SUBSCRIPTION_RENEWAL_FAILED:
        await this.userSubscriptionsService.expireSubscription(
          user,
          subscriptionId,
        );
        break;
      case WebhookType.SUBSCRIPTION_CANCELED:
        await this.userSubscriptionsService.cancelSubscription(
          user,
          subscriptionId,
        );
        break;
      case WebhookType.SUBSCRIPTION_EXPIRED:
        await this.userSubscriptionsService.expireSubscription(
          user,
          subscriptionId,
        );
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${type}`);
    }
  }
}
