export function buildFinancialPrompt(finding, evidence = []) {
    const details = [];
    if (finding?.category) details.push(`- Category: ${finding.category}`);
    if (finding?.amount !== undefined) details.push(`- Amount: ${finding.amount}`);
    if (finding?.previousPeriodAmount !== undefined) details.push(`- Previous Period Amount: ${finding.previousPeriodAmount}`);
    if (finding?.currentPeriodAmount !== undefined) details.push(`- Current Period Amount: ${finding.currentPeriodAmount}`);
    if (finding?.changeAmount !== undefined) details.push(`- Change Amount: ${finding.changeAmount}`);
    if (finding?.changePercentage !== undefined) details.push(`- Change Percentage: ${finding.changePercentage}%`);
    if (finding?.reason) details.push(`- Reason: ${finding.reason}`);
    if (finding?.confidence) details.push(`- Confidence: ${finding.confidence}`);
    if (finding?.provider) details.push(`- Provider: ${finding.provider}`);
    if (finding?.amountDue !== undefined && finding?.amountDue !== null) details.push(`- Amount Due: ${finding.amountDue}`);
    if (finding?.dueDate) details.push(`- Due Date: ${finding.dueDate}`);
    if (finding?.billDate) details.push(`- Bill Date: ${finding.billDate}`);
    if (finding?.status) details.push(`- Status: ${finding.status}`);
    if (finding?.extractionMethod) details.push(`- Extraction Method: ${finding.extractionMethod}`);

    const detailsBlock = details.length > 0 ? `\nExtracted Finding Details:\n${details.join('\n')}\n` : '';

    return `You are a financial analysis assistant.

Explain this financial finding using only the evidence provided below.

Finding:
${JSON.stringify(finding, null, 2)}
${detailsBlock}
Supporting transactions:
${JSON.stringify(evidence, null, 2)}

Return a structured explanation covering:
1. What changed or was detected (include relevant amounts, category, percentage change, reason, and confidence if present)
2. Why it matters to the user's finances
3. Which transactions support the finding (explicitly reference their transaction IDs)
4. One practical action the user could consider

Rules & Constraints:
- Use only supplied evidence.
- Never invent transactions, amounts, dates, merchants, or financial facts.
- Distinguish factual findings from recommendations.
- Use simple language.
- Reference supporting transaction IDs.`;
}
