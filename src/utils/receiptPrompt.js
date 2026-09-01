const RECEIPT_PARSE_PROMPT = `Extract structured data from this receipt image. Respond with ONLY valid JSON, no markdown code blocks, no backticks, no explanatory text, matching this exact shape:

{
  "merchant_name": "string or null",
  "receipt_date": "YYYY-MM-DD or null",
  "total_amount": number or null,
  "items": [
    { "name": "string", "price": number, "quantity": integer }
  ]
}

Rules:
- price must be the line-item total price (e.g. 12.50) as a plain number, with no currency symbols.
- If quantity is not explicitly shown, default quantity to 1.
- Skip subtotal, tax, tip, payment method, change, and discount summary lines - only include purchased products, food/drink items, or services in "items".
- Ensure "receipt_date" strictly follows the YYYY-MM-DD format if present, or null if not readable.
- If the image is unreadable, blurred, or not a receipt, return:
  { "merchant_name": null, "receipt_date": null, "total_amount": null, "items": [] }`;

module.exports = { RECEIPT_PARSE_PROMPT };
