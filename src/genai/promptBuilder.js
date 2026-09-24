export function buildFinancialPrompt(finding, evidence = []) {
    return `
You are a financial analysis assistant.

Explain this financial finding using only the evidence provided.

Finding:
${JSON.stringify(finding, null, 2)}

Supporting transactions:
${JSON.stringify(evidence, null, 2)}

Return:
1. What changed or was detected
2. Why it matters
3. Which transactions support the finding
4. One practical action the user could consider

Do not invent transactions, amounts, dates, or facts.
Use clear, simple language.
`;
}