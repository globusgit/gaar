export function getReportPrompt(
  moduleName: string,
  orgName: string,
  data: Record<string, unknown>,
  language: string = "english"
): string {
  const langInstruction = language.toLowerCase() !== "english"
    ? `\n\nIMPORTANT: Write the entire report in ${language}. All section headers, bullet points, and analysis must be in ${language}.`
    : "";

  return `You are GAAR's AI report analyst. Generate a structured business report based on this ${moduleName} data for organization "${orgName}".

Data:
${JSON.stringify(data, null, 2)}

Generate a comprehensive report with the following sections:
1. Executive Summary — 3-5 lines summarizing the key findings
2. Key Metrics — Highlight the most important numbers and KPIs
3. Trends & Insights — Analyze patterns and notable changes
4. Risk Assessment — Identify any risks or anomalies
5. Recommendations — Actionable next steps

Format as clean Markdown with headers, bullet points, and tables where appropriate. Be concise and professional. Use business language suitable for management reporting.${langInstruction}`;
}

export function getSearchPrompt(
  userQuery: string,
  availableFields: string[],
  language: string = "english"
): string {
  const langInstruction = language.toLowerCase() !== "english"
    ? `\n\nIMPORTANT: Write the "intent" field description in ${language}. All reasoning and descriptions must be in ${language}.`
    : "";

  return `You are a query parser for a multi-tenant ERP system (GAAR).

The user wants to search for data using natural language.

Available fields for each module:
${availableFields.join("\n")}

User's query: "${userQuery}"

Analyze the query and extract structured search filters. Return ONLY valid JSON with this exact structure:
{
  "intent": "short description of what the user wants",
  "module": "tender|payment|receivable|employee|client|fund-request|work-order|organizations|user|dashboard",
  "filters": [
    { "field": "field_name", "operator": "eq|gt|lt|gte|lte|contains|regex", "value": "the_value" }
  ],
  "sort": "field_name|asc",
  "limit": 20
}

Rules:
- Only use field names from the available fields list
- If a field is not clear, omit it from filters
- If the query is ambiguous, return the most likely interpretation
- If no meaningful filters can be extracted, return an empty filters array
- The "contains" operator means partial match (like SQL LIKE %% or MongoDB $regex)
- The "regex" operator means regex pattern match
- Operator "eq" means exact match
- Operator "gt" means greater than
- Operator "lt" means less than
- Operator "gte" means greater than or equal
- Operator "lte" means less than or equal
- Sort field must be a valid sortable field from the available fields${langInstruction}`;
}
