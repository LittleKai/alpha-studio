import { describe, it, expect } from 'vitest';

import {
    CRM_MONTHLY_RENEWAL_PLAN,
    buildRenewalConfirmationDetails,
} from './crmSubscriptionRenewal';

describe('CRM_MONTHLY_RENEWAL_PLAN', () => {
    it('giữ đúng giá gói hiện hành: 1.050 Credits / 100.000đ / 1 tháng', () => {
        expect(CRM_MONTHLY_RENEWAL_PLAN.productId).toBe('crm_monthly');
        expect(CRM_MONTHLY_RENEWAL_PLAN.priceCredits).toBe(1050);
        expect(CRM_MONTHLY_RENEWAL_PLAN.priceVnd).toBe(100000);
        expect(CRM_MONTHLY_RENEWAL_PLAN.includedAiLimit).toBe(100);
        expect(CRM_MONTHLY_RENEWAL_PLAN.durationLabel).toBe('1 tháng');
    });
});

describe('buildRenewalConfirmationDetails', () => {
    it('đủ credits thì trả canPayWithCredits và không thiếu đồng nào', () => {
        const result = buildRenewalConfirmationDetails(2500);
        expect(result.canPayWithCredits).toBe(true);
        expect(result.missingCredits).toBe(0);
    });

    it('vừa đúng số credits vẫn thanh toán được (biên)', () => {
        const result = buildRenewalConfirmationDetails(1050);
        expect(result.canPayWithCredits).toBe(true);
        expect(result.missingCredits).toBe(0);
    });

    it('thiếu credits thì tính đúng phần còn thiếu', () => {
        const result = buildRenewalConfirmationDetails(200);
        expect(result.canPayWithCredits).toBe(false);
        expect(result.missingCredits).toBe(850);
    });

    it('số dư 0 thì thiếu đúng bằng giá gói', () => {
        expect(buildRenewalConfirmationDetails(0).missingCredits).toBe(1050);
    });

    it('missingCredits không bao giờ âm', () => {
        expect(buildRenewalConfirmationDetails(999999).missingCredits).toBe(0);
    });

    it('bảng chi tiết nêu đúng thời hạn và hạn mức AI', () => {
        const rows = buildRenewalConfirmationDetails(2500).detailRows;
        expect(rows.some(row => row.value.includes('1 tháng'))).toBe(true);
        expect(rows.some(row => row.value.includes('100'))).toBe(true);
        expect(rows.some(row => row.value.includes('1050 Credits hoặc 100.000đ'))).toBe(true);
    });
});
