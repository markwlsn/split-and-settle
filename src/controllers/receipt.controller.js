const { randomUUID } = require('crypto');
const path = require('path');
const { getGeminiClient } = require('../lib/geminiClient');
const { RECEIPT_PARSE_PROMPT } = require('../utils/receiptPrompt');

function getMimeType(filePath, fallbackType) {
  if (fallbackType && fallbackType.startsWith('image/')) {
    return fallbackType;
  }
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.heic':
      return 'image/heic';
    case '.jpg':
    case '.jpeg':
    default:
      return 'image/jpeg';
  }
}

async function uploadReceipt(req, res, next) {
  try {
    const { id: groupId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Receipt image file is required' });
    }

    const fileExt = path.extname(req.file.originalname) || '.jpg';
    const cleanFileName = `${randomUUID()}${fileExt}`;
    const storagePath = `${groupId}/${cleanFileName}`;

    const { error: uploadError } = await req.supabase.storage
      .from('receipts')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return res.status(400).json({ error: `Storage upload failed: ${uploadError.message}` });
    }

    const { data: receipt, error: dbError } = await req.supabase
      .from('receipts')
      .insert({
        group_id: groupId,
        uploaded_by: req.userId,
        paid_by: req.userId,
        image_path: storagePath,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    return res.status(201).json(receipt);
  } catch (err) {
    next(err);
  }
}

async function parseReceipt(req, res, next) {
  try {
    const { id: receiptId } = req.params;

    const { data: receipt, error: receiptError } = await req.supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Download image from Supabase Storage
    const { data: fileData, error: downloadError } = await req.supabase.storage
      .from('receipts')
      .download(receipt.image_path);

    if (downloadError || !fileData) {
      return res.status(400).json({ error: `Failed to download receipt image: ${downloadError?.message}` });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = getMimeType(receipt.image_path, fileData.type);

    let parsed;
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
              {
                text: RECEIPT_PARSE_PROMPT,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text ? response.text.trim() : '';
      parsed = JSON.parse(responseText);
    } catch (aiErr) {
      console.error('Gemini vision parsing error:', aiErr);
      return res.status(422).json({
        error: 'Could not parse receipt image with AI - please try a clearer photo or enter items manually.',
        details: aiErr.message,
      });
    }

    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return res.status(422).json({
        error: 'No purchased items were detected on this receipt image.',
        raw: parsed,
      });
    }

    // Validate receipt_date format if present
    let validReceiptDate = null;
    if (parsed.receipt_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.receipt_date)) {
      validReceiptDate = parsed.receipt_date;
    }

    // Clean up any existing items if re-parsing
    await req.supabase.from('receipt_items').delete().eq('receipt_id', receiptId);

    // Insert detected items
    const itemsToInsert = parsed.items.map(item => ({
      receipt_id: receiptId,
      name: String(item.name || 'Item').trim(),
      price: Math.max(0, parseFloat(item.price) || 0),
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
    }));

    const { data: insertedItems, error: itemsError } = await req.supabase
      .from('receipt_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      return res.status(400).json({ error: `Failed to save items: ${itemsError.message}` });
    }

    const { data: updatedReceipt, error: updateError } = await req.supabase
      .from('receipts')
      .update({
        status: 'parsed',
        merchant_name: parsed.merchant_name || null,
        receipt_date: validReceiptDate,
        total_amount: parsed.total_amount ? parseFloat(parsed.total_amount) : null,
      })
      .eq('id', receiptId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.json({
      receipt: updatedReceipt,
      items: insertedItems,
    });
  } catch (err) {
    next(err);
  }
}

async function getReceipt(req, res, next) {
  try {
    const { id: receiptId } = req.params;
    const { data: receipt, error: receiptError } = await req.supabase
      .from('receipts')
      .select('*, receipt_items(*, item_shares(*))')
      .eq('id', receiptId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    return res.json(receipt);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const { name, price, quantity } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (quantity !== undefined) updates.quantity = quantity;

    const { data, error } = await req.supabase
      .from('receipt_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

async function setItemShares(req, res, next) {
  try {
    const { itemId } = req.params;
    const { shares } = req.body; // Array of { userId, shareAmount }

    const { data: item, error: itemError } = await req.supabase
      .from('receipt_items')
      .select('price')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemPrice = parseFloat(item.price);
    const sumShares = shares.reduce((acc, s) => acc + parseFloat(s.shareAmount || 0), 0);

    if (Math.abs(sumShares - itemPrice) > 0.01) {
      return res.status(400).json({
        error: `Sum of shares (${sumShares.toFixed(2)}) must equal item price (${itemPrice.toFixed(2)})`,
      });
    }

    // Remove previous shares for this item
    const { error: deleteError } = await req.supabase
      .from('item_shares')
      .delete()
      .eq('item_id', itemId);

    if (deleteError) {
      return res.status(400).json({ error: `Failed to reset shares: ${deleteError.message}` });
    }

    const rows = shares.map(s => ({
      item_id: itemId,
      user_id: s.userId,
      share_amount: Math.round(Number(s.shareAmount) * 100) / 100,
    }));

    const { data, error: insertError } = await req.supabase
      .from('item_shares')
      .insert(rows)
      .select();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadReceipt,
  parseReceipt,
  getReceipt,
  updateItem,
  setItemShares,
};
