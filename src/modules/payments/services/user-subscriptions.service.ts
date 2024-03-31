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
    const subscription = await this.getSubscription(subscriptionId);
    const paymentMethod = await this.getPaymentMethod(paymentMethodId);

    if (!subscription || !paymentMethod) {
      return;
    }

    const endAt = this.calculateEndAt(
      subscription.billingPeriod as BillingPeriod,
    );

    await this.createUserSubscription(
      user.id,
      subscription.id,
      paymentMethod.id,
      endAt,
    );

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
    const subscription = await this.getSubscription(subscriptionId);
    const userSubscription = await this.getUserSubscription(
      user.id,
      subscription.id,
    );

    if (!subscription || !userSubscription) {
      return;
    }

    const endAt = this.calculateEndAt(
      subscription.billingPeriod as BillingPeriod,
      userSubscription.endAt,
    );

    await this.updateUserSubscription(userSubscription.id, { endAt });

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
    const subscription = await this.getSubscription(subscriptionId);
    const userSubscription = await this.getUserSubscription(
      user.id,
      subscription.id,
    );

    if (!subscription || !userSubscription) {
      return;
    }

    await this.updateUserSubscription(userSubscription.id, {
      status: SubscriptionStatus.CANCELED,
      endAt: new Date(),
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
    const subscription = await this.getSubscription(subscriptionId);
    const userSubscription = await this.getUserSubscription(
      user.id,
      subscription.id,
    );

    if (!subscription || !userSubscription) {
      return;
    }

    const updatedSubscription = await this.updateUserSubscription(
      userSubscription.id,
      {
        status: SubscriptionStatus.EXPIRED,
      },
    );

    await this.paymentsHistoryService.createPaymentHistory(
      user,
      subscription.thirdPartyId,
      subscription.amount,
      userSubscription.status as SubscriptionStatus,
      SubscriptionStatus.EXPIRED,
    );

    return updatedSubscription;
  }

  private async getSubscription(subscriptionId: string) {
    const subscription =
      await this.subscriptionsService.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return null;
    }

    return subscription;
  }

  private async getPaymentMethod(paymentMethodId: number) {
    const paymentMethod = await this.databaseService.paymentsMethod.findUnique({
      where: {
        id: paymentMethodId,
      },
    });

    if (!paymentMethod) {
      this.logger.error(`Payment method ${paymentMethodId} not found`);
      return null;
    }

    return paymentMethod;
  }

  private async getUserSubscription(userId: number, subscriptionId: number) {
    const userSubscription =
      await this.databaseService.userSubscription.findFirst({
        where: {
          userId,
          subscriptionId,
        },
      });

    if (!userSubscription) {
      this.logger.error(
        `User subscription not found for user ${userId} and subscription ${subscriptionId}`,
      );
      return null;
    }

    return userSubscription;
  }

  private async createUserSubscription(
    userId: number,
    subscriptionId: number,
    paymentMethodId: number,
    endAt: Date,
  ) {
    return this.databaseService.userSubscription.create({
      data: {
        userId,
        subscriptionId,
        status: SubscriptionStatus.ACTIVE,
        paymentMethodId,
        endAt,
      },
    });
  }

  private async updateUserSubscription(
    subscriptionId: number,
    data: Partial<Prisma.UserSubscriptionUpdateInput>,
  ) {
    return this.databaseService.userSubscription.update({
      where: {
        id: subscriptionId,
      },
      data,
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
