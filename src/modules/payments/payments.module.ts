import { Module } from '@nestjs/common';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsService } from './services/subscription.service';
import { PaymentsHistoryService } from './services/payments-history.service';
import { UserSubscriptionsService } from './services/user-subscriptions.service';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    SubscriptionsService,
    UserSubscriptionsService,
    PaymentsHistoryService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
