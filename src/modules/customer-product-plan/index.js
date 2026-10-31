import { CustomerModule } from './customers.js';
import { ProductModule } from './products.js';
import { PlanModule } from './plans.js';
import { dataService } from './data-service.js';

export function initCustomerProductPlanModule() {
  const customerModule = new CustomerModule();
  const productModule = new ProductModule();
  const planModule = new PlanModule();

  return {
    customerModule,
    productModule,
    planModule,
    service: dataService
  };
}

// Re-export Data Service & APIs for external modules
export { dataService };
export * from './mock-data.js';

