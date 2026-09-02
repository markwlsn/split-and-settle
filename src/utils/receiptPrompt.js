const RECEIPT_PARSE_PROMPT = `Extract structured data from this receipt image. 

CRITICAL PRIVACY & SECURITY RULES:
- NEVER extract or return sensitive Personally Identifiable Information (PII) such as credit/debit card numbers, cardholder full names, cashier names, phone numbers, customer loyalty numbers, or payment authorization tokens.
- Ignore all payment card transaction metadata, approval codes, change returned, and subtotal/tax lines from the "items" list.

Respond with ONLY valid JSON, no markdown code blocks, no backticks, matching this exact shape:

{
  "merchant_name": "string or null",
  "receipt_date": "YYYY-MM-DD or null",
  "category": "Food & Dining" | "Groceries" | "Transport" | "Entertainment" | "Lodging" | "Utilities" | "Shopping" | "Other",
  "total_amount": number or null,
  "tax_amount": number or 0,
  "tip_amount": number or 0,
  "items": [
    { "name": "string", "price": number, "quantity": integer }
  ]
}

Rules:
- price must be the line-item total price as a plain decimal number (e.g. 12.50) without currency symbols.
- If quantity is not explicitly stated for an item, default quantity to 1.
- "items" must only include purchased goods, food/drink items, or services.
- If tax or tip amounts are visible on the receipt, extract them into "tax_amount" and "tip_amount" (default to 0 if not found).
- Ensure "receipt_date" strictly follows the YYYY-MM-DD format if readable, otherwise null.
- If the image is blurry, unreadable, or not a receipt, return:
  { "merchant_name": null, "receipt_date": null, "category": "Other", "total_amount": null, "tax_amount": 0, "tip_amount": 0, "items": [] }`;

module.exports = { RECEIPT_PARSE_PROMPT };
