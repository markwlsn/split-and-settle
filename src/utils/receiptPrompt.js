const RECEIPT_PARSE_PROMPT = `Extract structured data from this receipt image regardless of the language, script, or currency.

CRITICAL PRIVACY & SECURITY RULES:
- NEVER extract or return sensitive Personally Identifiable Information (PII) such as credit/debit card numbers, cardholder full names, cashier names, phone numbers, customer loyalty numbers, or payment authorization tokens.
- Ignore payment card transaction metadata, approval codes, change returned, and subtotal/tax lines from the "items" list.

MULTILINGUAL & MULTI-CURRENCY CAPABILITIES:
- The receipt can be in ANY language or writing system (e.g. English, Tagalog/Filipino, Japanese, Korean, Chinese, Spanish, French, German, Italian, Portuguese, Arabic, Thai, Vietnamese, etc.).
- For non-English items, preserve clarity by translating to English or providing a readable description (e.g. "豚骨ラーメン (Tonkotsu Ramen)").
- Identify the currency with high precision from currency symbols (₱, $, €, £, ¥, ₩, ₹, ฿, ₫, R$, CHF, kr, zł, etc.), store location, address, phone prefix, tax labels (VAT, GST, IVA, MwSt, 消費税), or language context.
- Always output the standard 3-letter ISO 4217 currency code (e.g. PHP, USD, JPY, EUR, GBP, KRW, CAD, AUD, SGD, HKD, TWD, INR, THB, VND, MYR, IDR, BRL, MXN, CHF, AED, SAR, etc.).

Respond with ONLY valid JSON, matching this exact shape:

{
  "merchant_name": "string or null",
  "receipt_date": "YYYY-MM-DD or null",
  "category": "Food & Dining" | "Groceries" | "Transport" | "Entertainment" | "Lodging" | "Utilities" | "Shopping" | "Other",
  "currency_code": "3-letter ISO 4217 code (e.g. PHP, USD, JPY, EUR, GBP, KRW) or null",
  "total_amount": number or null,
  "tax_amount": number or 0,
  "tip_amount": number or 0,
  "items": [
    { "name": "string", "price": number, "quantity": integer }
  ]
}

Rules:
- price must be the line-item total price as a plain decimal number (e.g. 150.00 or 1500) without currency symbols or commas.
- If quantity is not explicitly stated for an item, default quantity to 1.
- "items" must only include purchased goods, food/drink items, or services.
- If tax or tip amounts are visible on the receipt, extract them into "tax_amount" and "tip_amount" (default to 0 if not found).
- Ensure "receipt_date" strictly follows the YYYY-MM-DD format if readable, otherwise null.
- If the image is blurry, unreadable, or not a receipt, return:
  { "merchant_name": null, "receipt_date": null, "category": "Other", "currency_code": null, "total_amount": null, "tax_amount": 0, "tip_amount": 0, "items": [] }`;

module.exports = { RECEIPT_PARSE_PROMPT };
