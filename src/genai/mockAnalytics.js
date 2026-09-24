export const mockAnalytics = {
    summary: {
        totalIncome: 30000,
        totalExpenses: 22000,
        netCashFlow: 8000,
        currency: "INR"
    },

    spendingChanges: [
        {
            id: "CHANGE001",
            type: "spending_change",
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
export const mockTransactions = [
    {
        id: "TXN003",
        date: "2026-09-05",
        merchant: "Swiggy",
        category: "Food",
        amount: 1200,
        type: "expense",
        source: "csv"
    },
    {
        id: "TXN007",
        date: "2026-09-12",
        merchant: "Zomato",
        category: "Food",
        amount: 2300,
        type: "expense",
        source: "csv"
    },
    {
        id: "TXN011",
        date: "2026-09-18",
        merchant: "Restaurant",
        category: "Food",
        amount: 4500,
        type: "expense",
        source: "csv"
    }
];
