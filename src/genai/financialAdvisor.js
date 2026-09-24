import { buildEvidenceFromAnalytics } from "./evidenceEngine.js";
import { buildFinancialPrompt } from "./promptBuilder.js";

function generateRecommendation(evidenceItem) {
    const { findingId, findingType, finding = {}, transactionIds = [] } = evidenceItem;

    let explanation = '';
    let recommendation = '';

    if (findingType === 'spending_change') {
        const category = finding.category || 'spending';
        const changeAmount = finding.changeAmount ?? 0;
        const changePercentage = finding.changePercentage ?? 0;
        const direction = changeAmount >= 0 ? 'increased' : 'decreased';
        const absAmount = Math.abs(changeAmount);
        const absPercentage = Math.abs(changePercentage);
        const prev = finding.previousPeriodAmount;
        const curr = finding.currentPeriodAmount;
        const fromTo = (prev !== undefined && curr !== undefined) ? ` from ${prev} to ${curr}` : '';

        const txSupport = transactionIds.length > 0 ? `, supported by transaction(s) ${transactionIds.join(', ')}` : '';
        const recTx = transactionIds.length > 0 ? ` (${transactionIds.join(', ')})` : '';

        explanation = `${category} spending ${direction} by ${absAmount} (${absPercentage}%)${fromTo}${txSupport}.`;
        recommendation = `Review recent ${category} transactions${recTx} to assess whether this ${direction} aligns with your budget or if adjustments are warranted.`;
    } else if (findingType === 'unusual_spending') {
        const category = finding.category || 'this category';
        const amount = finding.amount !== undefined ? `${finding.amount}` : 'an atypical amount';
        const reason = finding.reason ? ` ${finding.reason}` : '';
        const confidence = finding.confidence ? ` (Confidence: ${finding.confidence})` : '';
        const txRef = transactionIds.length > 0 ? ` for transaction(s) ${transactionIds.join(', ')}` : '';
        const txRec = transactionIds.length > 0 ? ` ${transactionIds.join(', ')}` : '';

        explanation = `Unusual transaction of ${amount} detected in ${category}${txRef}.${reason}${confidence}`;
        recommendation = `Verify transaction${txRec} against your merchant receipts to confirm validity and ensure no unauthorized charges occurred.`;
    } else {
        const category = finding.category ? ` in ${finding.category}` : '';
        const txRef = transactionIds.length > 0 ? `: ${transactionIds.join(', ')}` : '';
        explanation = `Finding ${findingId || 'detected'} (${findingType})${category} flagged with supporting transaction(s)${txRef}.`;
        recommendation = `Review supporting transaction(s)${txRef} for accuracy and budget alignment.`;
    }

    return {
        findingId,
        explanation,
        recommendation,
        supportingTransactionIds: transactionIds
    };
}

export function prepareFinancialAdvice(analytics, transactions = []) {
    if (!analytics || analytics.status === 'no_input') {
        return {
            evidence: [],
            prompts: [],
            recommendations: []
        };
    }

    const evidence = buildEvidenceFromAnalytics(
        analytics,
        transactions
    );

    const prompts = evidence.map((item) =>
        buildFinancialPrompt(
            item.finding,
            item.transactions
        )
    );

    const recommendations = evidence.map((item) =>
        generateRecommendation(item)
    );

    return {
        evidence,
        prompts,
        recommendations
    };
}
