/**
 * Member 3 — Evidence Engine
 *
 * Connects financial findings to the transaction IDs
 * that support those findings.
 */

export function getEvidenceForFinding(finding, transactions = []) {
    const rawIds = finding?.transactionIds
        || (finding?.transactionId ? [finding.transactionId] : null)
        || [
            ...(finding?.currentPeriodTransactionIds || []),
            ...(finding?.previousPeriodTransactionIds || [])
        ];
    const transactionIds = Array.isArray(rawIds) ? rawIds : [];

    return transactions.filter((transaction) =>
        transactionIds.includes(transaction.id)
    );
}

export function buildEvidenceSummary(finding, transactions = []) {
    const evidence = getEvidenceForFinding(finding, transactions);
    const findingType = finding?.type
        || (finding?.changeAmount !== undefined || finding?.currentPeriodAmount !== undefined ? 'spending_change' : '')
        || (finding?.severity || finding?.method ? 'unusual_spending' : 'unknown');
    const findingId = finding?.id
        || (findingType === 'spending_change' && finding?.category ? `CHANGE-${finding.category}` : null)
        || (finding?.transactionId ? `ANOM-${finding.transactionId}` : null);
    const transactionIds = evidence.map((transaction) => transaction.id);

    const normalizedFinding = {
        ...finding,
        id: finding?.id || findingId,
        type: finding?.type || findingType,
        transactionIds: (finding?.transactionIds && finding.transactionIds.length > 0)
            ? finding.transactionIds
            : transactionIds
    };

    return {
        findingId,
        findingType,
        finding: normalizedFinding,
        evidenceCount: evidence.length,
        transactionIds,
        transactions: evidence
    };
}

export function buildEvidenceFromAnalytics(analytics, transactions = []) {
    const txList = (Array.isArray(transactions) && transactions.length > 0)
        ? transactions
        : (analytics?.transactions || []);

    const findings = [
        ...(analytics?.spendingChanges || []).map((f) => ({
            id: f.id || (f.category ? `CHANGE-${f.category}` : undefined),
            type: f.type || 'spending_change',
            ...f
        })),
        ...(analytics?.anomalies || []).map((f) => ({
            id: f.id || (f.transactionId ? `ANOM-${f.transactionId}` : undefined),
            type: f.type || 'unusual_spending',
            ...f
        })),
        ...(analytics?.billEvidence?.items || [])
            .filter((b) => b?.extraction?.success && (b.extraction?.fields?.amountDue !== null || b.extraction?.fields?.provider))
            .map((b, idx) => ({
                id: b.id ? `BILL-${b.id}` : `BILL-DOC-${idx + 1}`,
                type: 'bill_evidence',
                provider: b.extraction.fields.provider || b.name,
                amountDue: b.extraction.fields.amountDue,
                currency: b.extraction.fields.currency,
                dueDate: b.extraction.fields.dueDate,
                billDate: b.extraction.fields.billDate,
                category: b.extraction.fields.category || 'Utilities',
                status: b.extraction.fields.status || 'Unpaid',
                extractionMethod: b.extraction.method || b.extraction.extractionMethod || 'pdf-text',
                documentName: b.name
            }))
    ];

    return findings.map((finding) =>
        buildEvidenceSummary(finding, txList)
    );
}
