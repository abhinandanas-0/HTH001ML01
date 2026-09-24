export const mockAnalytics = {
    summary: {
        totalIncome: 30000,
        totalExpenses: 22000,
        netCashFlow: 8000,
        currency: "INR"
    },

    spendingChanges: [
        {
            category: "Food",
            currentPeriodAmount: 8000,
            previousPeriodAmount: 5000,
            changeAmount: 3000,
            changePercentage: 60,
            transactionIds: ["TXN003", "TXN007", "TXN011"]
        }
    ],

    anomalies: [
        {
            id: "ANOM001",
            type: "unusual_spending",
            transactionIds: ["TXN011"],
            amount: 4500,
            category: "Food",
            reason: "This transaction is significantly higher than the user's usual spending in this category.",
            confidence: "medium"
        }
    ],

    recurringCharges: [],

    dataQuality: {
        missingFields: [],
        possibleDuplicates: [],
        warnings: []
    }

};
export function buildEvidenceFromAnalytics(analytics, transactions = []) {
    const findings = [
        ...(analytics?.spendingChanges || []),
        ...(analytics?.anomalies || [])
    ];

    return findings.map((finding) => buildEvidenceSummary(finding, transactions));
}