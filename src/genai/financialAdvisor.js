import { buildEvidenceFromAnalytics } from "./evidenceEngine";
import { buildFinancialPrompt } from "./promptBuilder";

export function prepareFinancialAdvice(analytics, transactions = []) {
    const evidence = buildEvidenceFromAnalytics(
        analytics,
        transactions
    );

    const prompts = evidence.map((item) =>
        buildFinancialPrompt(
            {
                id: item.findingId,
                type: item.findingType
            },
            item.transactions
        )
    );

    return {
        evidence,
        prompts
    };
}