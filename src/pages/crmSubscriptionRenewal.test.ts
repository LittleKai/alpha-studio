import { strict as assert } from 'node:assert';

import {
    CRM_MONTHLY_RENEWAL_PLAN,
    buildRenewalConfirmationDetails,
} from './crmSubscriptionRenewal';

const enoughCredits = buildRenewalConfirmationDetails(800);
const lowCredits = buildRenewalConfirmationDetails(200);

assert.equal(CRM_MONTHLY_RENEWAL_PLAN.productId, 'crm_monthly');
assert.equal(CRM_MONTHLY_RENEWAL_PLAN.priceCredits, 525);
assert.equal(CRM_MONTHLY_RENEWAL_PLAN.priceVnd, 500000);
assert.equal(CRM_MONTHLY_RENEWAL_PLAN.includedAiLimit, 1000);
assert.equal(enoughCredits.canPayWithCredits, true);
assert.equal(lowCredits.canPayWithCredits, false);
assert.equal(lowCredits.missingCredits, 325);
assert.ok(enoughCredits.detailRows.some((row) => row.value.includes('1 tháng')));
assert.ok(enoughCredits.detailRows.some((row) => row.value.includes('1000')));
