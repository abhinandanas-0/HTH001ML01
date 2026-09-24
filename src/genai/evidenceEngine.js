/**
 * Member 3 — Evidence Engine
 *
 * Connects financial findings to the transaction IDs
 * that support those findings.
 */

export function getEvidenceForFinding(finding, transactions = []) {
    const transactionIds = finding?.transactionIds || [];

    return transactions.filter((transaction) =>
        transactionIds.includes(transaction.id)
    );
}

export function buildEvidenceSummary(finding, transactions = []) {
    const evidence = getEvidenceForFinding(finding, transactions);

    return {
        findingId: finding?.id || null,
        findingType: finding?.type || 'unknown',
        evidenceCount: evidence.length,
        transactionIds: evidence.map((transaction) => transaction.id),
        transactions: evidence
    };
}
export function buildEvidenceFromAnalytics(analytics, transactions = []) {
    const findings = [
        ...(analytics?.spendingChanges || []),
        ...(analytics?.anomalies || [])
    ];

    return findings.map((finding) =>
        buildEvidenceSummary(finding, transactions)
    );
}