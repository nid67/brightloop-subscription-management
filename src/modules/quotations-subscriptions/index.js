import { QuotationModule } from './quotations.js';
import { SubscriptionModule } from './subscriptions.js';
import { quoteSubService } from './data-service.js';

export function initQuoteSubscriptionModule() {
  const quotationModule = new QuotationModule();
  const subscriptionModule = new SubscriptionModule();

  return {
    quotationModule,
    subscriptionModule,
    service: quoteSubService
  };
}

export { quoteSubService };
export * from './mock-data.js';

