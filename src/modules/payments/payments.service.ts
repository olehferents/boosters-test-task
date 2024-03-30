import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { WebhookType } from './enum/webhook-type.enum';
import { BillingPeriod } from './enum/billing-period.enum';
import { SubscriptionStatus } from './enum/subscription-status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
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
        await this.createSubscription(subscriptionId, amount, billingPeriod);
        break;
      case WebhookType.SUBSCRIPTION_PURCHASE_SUCCESSFUL:
        await this.purchaseSubscription(user, subscriptionId, paymentMethodId);
        break;
      case WebhookType.SUBSCRIPTION_RENEWAL_SUCCESSFUL:
        await this.renewSubscription(user, subscriptionId);
        break;
      case WebhookType.SUBSCRIPTION_RENEWAL_FAILED:
        await this.expireSubscription(user, subscriptionId);
        break;
      case WebhookType.SUBSCRIPTION_CANCELED:
        await this.cancelSubscription(user, subscriptionId);
        break;
      case WebhookType.SUBSCRIPTION_EXPIRED:
        await this.expireSubscription(user, subscriptionId);
        break;
      case WebhookType.SUBSCRIPTION_DELETED:
        await this.deleteSubscription(subscriptionId);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${type}`);
    }
  }

  private async createSubscription(
    subscriptionId: string,
    amount: number,
    billingPeriod: string,
  ) {
    await this.databaseService.subscription.create({
      data: {
        name: `${billingPeriod} Subscription`,
        thirdPartyId: subscriptionId,
        amount: amount,
        billingPeriod: billingPeriod.toUpperCase() as BillingPeriod,
      },
    });

    this.logger.log(`Created subscription ${subscriptionId}`);
  }

  private async purchaseSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
    paymentMethodId: number,
  ) {
    const subscription = await this.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    const paymentMethod = await this.databaseService.paymentsMethod.findUnique({
      where: {
        id: paymentMethodId,
      },
    });

    const endAt = this.calculateEndAt(
      subscription.billingPeriod as BillingPeriod,
    );

    await this.databaseService.userSubscription.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        status: SubscriptionStatus.ACTIVE,
        paymentMethodId: paymentMethod.id,
        endAt: endAt,
      },
    });

    await this.databaseService.paymentsHistory.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: subscription.amount,
        currency: 'USD',
        paymentDate: new Date(),
        oldStatus: null,
        newStatus: SubscriptionStatus.ACTIVE,
      },
    });
  }

  private async renewSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
  ) {
    const subscription = await this.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    const userSubscription =
      await this.databaseService.userSubscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: subscription.id,
        },
      });

    if (!userSubscription) {
      this.logger.error(
        `User subscription not found for user ${user.id} and subscription ${subscription.id}`,
      );
      return;
    }

    const endAt = this.calculateEndAt(
      subscription.billingPeriod as BillingPeriod,
      userSubscription.endAt,
    );

    await this.databaseService.userSubscription.update({
      where: {
        id: userSubscription.id,
      },
      data: {
        endAt: endAt,
      },
    });

    await this.databaseService.paymentsHistory.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: subscription.amount,
        currency: 'USD',
        paymentDate: new Date(),
        oldStatus: userSubscription.status,
        newStatus: SubscriptionStatus.ACTIVE,
      },
    });
  }

  private async cancelSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
  ) {
    const subscription = await this.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    const userSubscription =
      await this.databaseService.userSubscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: subscription.id,
        },
      });

    if (!userSubscription) {
      this.logger.error(
        `User subscription not found for user ${user.id} and subscription ${subscription.id}`,
      );
      return;
    }

    await this.databaseService.userSubscription.update({
      where: {
        id: userSubscription.id,
      },
      data: {
        status: SubscriptionStatus.CANCELED,
        endAt: new Date(),
      },
    });

    await this.databaseService.paymentsHistory.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: subscription.amount,
        currency: 'USD',
        paymentDate: new Date(),
        oldStatus: userSubscription.status,
        newStatus: SubscriptionStatus.CANCELED,
      },
    });
  }

  private async expireSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
  ) {
    const subscription = await this.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    const userSubscription =
      await this.databaseService.userSubscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: subscription.id,
        },
      });

    if (!userSubscription) {
      this.logger.error(
        `User subscription not found for user ${user.id} and subscription ${subscription.id}`,
      );
      return;
    }

    await this.databaseService.userSubscription.update({
      where: {
        id: userSubscription.id,
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    await this.databaseService.paymentsHistory.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: subscription.amount,
        currency: 'USD',
        paymentDate: new Date(),
        oldStatus: userSubscription.status,
        newStatus: SubscriptionStatus.EXPIRED,
      },
    });
  }

  private async deleteSubscription(subscriptionId: string) {
    const subscription = await this.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    await this.databaseService.subscription.delete({
      where: {
        id: subscription.id,
      },
    });

    this.logger.log(`Deleted subscription ${subscriptionId}`);
  }

  private async getSubscription(subscriptionId: string) {
    return this.databaseService.subscription.findUnique({
      where: {
        thirdPartyId: subscriptionId,
      },
    });
  }

  private calculateEndAt(
    billingPeriod: BillingPeriod,
    prevEndDate?: Date,
  ): Date {
    const endAt = prevEndDate || new Date();
    if (billingPeriod === BillingPeriod.MONTHLY) {
      endAt.setMonth(endAt.getMonth() + 1);
    } else if (billingPeriod === BillingPeriod.YEARLY) {
      endAt.setFullYear(endAt.getFullYear() + 1);
    }
    return endAt;
  }
}
