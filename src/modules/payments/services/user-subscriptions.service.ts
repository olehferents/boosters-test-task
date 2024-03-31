import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PaymentsHistoryService } from './payments-history.service';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { BillingPeriod } from '../enums/billing-period.enum';
import { Prisma } from '@prisma/client';
import { SubscriptionsService } from './subscription.service';

@Injectable()
export class UserSubscriptionsService {
  private readonly logger = new Logger(UserSubscriptionsService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly paymentsHistoryService: PaymentsHistoryService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async purchaseSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
    paymentMethodId: number,
  ) {
    const subscription =
      await this.subscriptionsService.getSubscription(subscriptionId);

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

    await this.paymentsHistoryService.createPaymentHistory(
      user,
      subscription.thirdPartyId,
      subscription.amount,
      null,
      SubscriptionStatus.ACTIVE,
    );
  }

  async renewSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
  ) {
    const subscription =
      await this.subscriptionsService.getSubscription(subscriptionId);

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

    await this.paymentsHistoryService.createPaymentHistory(
      user,
      subscription.thirdPartyId,
      subscription.amount,
      userSubscription.status as SubscriptionStatus,
      SubscriptionStatus.ACTIVE,
    );
  }

  async cancelSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
  ) {
    const subscription =
      await this.subscriptionsService.getSubscription(subscriptionId);

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

    await this.paymentsHistoryService.createPaymentHistory(
      user,
      subscription.thirdPartyId,
      subscription.amount,
      userSubscription.status as SubscriptionStatus,
      SubscriptionStatus.CANCELED,
    );
  }

  async expireSubscription(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
  ) {
    const subscription =
      await this.subscriptionsService.getSubscription(subscriptionId);

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

    await this.paymentsHistoryService.createPaymentHistory(
      user,
      subscription.thirdPartyId,
      subscription.amount,
      userSubscription.status as SubscriptionStatus,
      SubscriptionStatus.EXPIRED,
    );
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
