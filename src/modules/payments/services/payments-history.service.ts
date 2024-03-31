import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/modules/database/database.service';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { Prisma } from '@prisma/client';
import { SubscriptionsService } from './subscription.service';

@Injectable()
export class PaymentsHistoryService {
  private readonly logger = new Logger(PaymentsHistoryService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async createPaymentHistory(
    user: Prisma.UserGetPayload<NonNullable<unknown>>,
    subscriptionId: string,
    amount: Prisma.Decimal,
    oldStatus: SubscriptionStatus | null,
    newStatus: SubscriptionStatus,
  ) {
    const subscription =
      await this.subscriptionsService.getSubscription(subscriptionId);

    if (!subscription) {
      this.logger.error(`Subscription ${subscriptionId} not found`);
      return;
    }

    await this.databaseService.paymentsHistory.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        amount: amount,
        currency: 'USD',
        paymentDate: new Date(),
        oldStatus: oldStatus,
        newStatus: newStatus,
      },
    });
  }
}
