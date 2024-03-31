import { BillingPeriod } from '../enums/billing-period.enum';
import { DatabaseService } from '../../database/database.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createSubscription(
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

  async deleteSubscription(subscriptionId: string) {
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

  async getSubscription(subscriptionId: string) {
    return this.databaseService.subscription.findUnique({
      where: {
        thirdPartyId: subscriptionId,
      },
    });
  }
}
