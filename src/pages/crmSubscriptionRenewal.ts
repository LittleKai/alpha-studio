export interface CrmMonthlyRenewalPlan {
    productId: 'crm_monthly';
    priceCredits: number;
    priceVnd: number;
    includedAiLimit: number;
    durationLabel: string;
}

export interface RenewalDetailRow {
    label: string;
    value: string;
}

export interface RenewalConfirmationDetails {
    canPayWithCredits: boolean;
    missingCredits: number;
    detailRows: RenewalDetailRow[];
}

export const CRM_MONTHLY_RENEWAL_PLAN: CrmMonthlyRenewalPlan = {
    productId: 'crm_monthly',
    priceCredits: 525,
    priceVnd: 500000,
    includedAiLimit: 1000,
    durationLabel: '1 tháng',
};

export function buildRenewalConfirmationDetails(
    balanceCredits: number,
): RenewalConfirmationDetails {
    const missingCredits = Math.max(
        0,
        CRM_MONTHLY_RENEWAL_PLAN.priceCredits - balanceCredits,
    );

    return {
        canPayWithCredits: missingCredits === 0,
        missingCredits,
        detailRows: [
            {
                label: 'Gói gia hạn',
                value: `Alpha CRM ${CRM_MONTHLY_RENEWAL_PLAN.durationLabel}`,
            },
            {
                label: 'Chi phí',
                value: `${CRM_MONTHLY_RENEWAL_PLAN.priceCredits} Credits hoặc 500.000đ`,
            },
            {
                label: 'Hạn mức AI mới',
                value: `${CRM_MONTHLY_RENEWAL_PLAN.includedAiLimit} yêu cầu AI / chu kỳ`,
            },
            {
                label: 'Hiệu lực',
                value: `Gia hạn thêm ${CRM_MONTHLY_RENEWAL_PLAN.durationLabel} và đặt lại quota gói chính`,
            },
        ],
    };
}
