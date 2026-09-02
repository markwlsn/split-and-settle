const { randomUUID } = require('crypto');
const path = require('path');
const { getGeminiClient } = require('../lib/geminiClient');
const { RECEIPT_PARSE_PROMPT } = require('../utils/receiptPrompt');
const { logActivity } = require('../lib/activityLogger');
const { calculateEqualShares, calculateProportionalTaxAndTip } = require('../utils/splitCalculator');
const { recomputeSettlements } = require('./settlement.controller');

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

    // Verify group membership first
    const { data: membership, error: memberCheckError } = await req.supabase
      .from('group_members')
      .select('display_name')
      .eq('group_id', groupId)
      .eq('user_id', req.userId)
      .single();

    if (memberCheckError || !membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
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
        category: 'Other',
      })
      .select()
      .single();

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    await logActivity(req.supabase, {
      groupId,
      actorId: req.userId,
      actionType: 'RECEIPT_UPLOADED',
      description: `${membership.display_name} uploaded a receipt image`,
      metadata: { receiptId: receipt.id },
    });

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
        tax_amount: parsed.tax_amount ? Math.max(0, parseFloat(parsed.tax_amount)) : 0,
        tip_amount: parsed.tip_amount ? Math.max(0, parseFloat(parsed.tip_amount)) : 0,
        category: parsed.category || 'Other',
      })
      .eq('id', receiptId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    await logActivity(req.supabase, {
      groupId: receipt.group_id,
      actorId: req.userId,
      actionType: 'RECEIPT_PARSED',
      description: `AI parsed receipt for "${updatedReceipt.merchant_name || 'Receipt'}" ($${updatedReceipt.total_amount || 0})`,
      metadata: { receiptId, itemCount: insertedItems.length },
    });

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

async function getReceiptImageUrl(req, res, next) {
  try {
    const { id: receiptId } = req.params;

    const { data: receipt, error: receiptError } = await req.supabase
      .from('receipts')
      .select('image_path')
      .eq('id', receiptId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Generate a temporary signed URL valid for 15 minutes (900 seconds)
    const { data, error: signError } = await req.supabase.storage
      .from('receipts')
      .createSignedUrl(receipt.image_path, 900);

    if (signError) {
      return res.status(400).json({ error: signError.message });
    }

    return res.json({
      signedUrl: data.signedUrl,
      expiresInSeconds: 900,
    });
  } catch (err) {
    next(err);
  }
}

async function updateReceipt(req, res, next) {
  try {
    const { id: receiptId } = req.params;
    const {
      merchantName,
      receiptDate,
      totalAmount,
      taxAmount,
      tipAmount,
      category,
      notes,
      paidBy,
    } = req.body;

    const updates = {};
    if (merchantName !== undefined) updates.merchant_name = merchantName;
    if (receiptDate !== undefined) updates.receipt_date = receiptDate;
    if (totalAmount !== undefined) updates.total_amount = totalAmount;
    if (taxAmount !== undefined) updates.tax_amount = taxAmount;
    if (tipAmount !== undefined) updates.tip_amount = tipAmount;
    if (category !== undefined) updates.category = category;
    if (notes !== undefined) updates.notes = notes;
    if (paidBy !== undefined) updates.paid_by = paidBy;

    const { data: updated, error } = await req.supabase
      .from('receipts')
      .update(updates)
      .eq('id', receiptId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If paid_by changed on a confirmed receipt, recompute settlements
    if (paidBy !== undefined && updated.status === 'confirmed') {
      await recomputeSettlements(req.supabase, updated.group_id);
    }

    await logActivity(req.supabase, {
      groupId: updated.group_id,
      actorId: req.userId,
      actionType: 'RECEIPT_UPDATED',
      description: `Receipt details updated for "${updated.merchant_name || 'Receipt'}"`,
      metadata: { receiptId, updates },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteReceipt(req, res, next) {
  try {
    const { id: receiptId } = req.params;

    const { data: receipt, error: findError } = await req.supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (findError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Remove file from storage
    await req.supabase.storage.from('receipts').remove([receipt.image_path]);

    // Delete database row
    const { error: deleteError } = await req.supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    // If receipt was confirmed, recalculate group balances
    if (receipt.status === 'confirmed') {
      await recomputeSettlements(req.supabase, receipt.group_id);
    }

    await logActivity(req.supabase, {
      groupId: receipt.group_id,
      actorId: req.userId,
      actionType: 'RECEIPT_DELETED',
      description: `Receipt for "${receipt.merchant_name || 'Receipt'}" was deleted`,
      metadata: { receiptId },
    });

    return res.json({ message: 'Receipt deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function autoSplitReceipt(req, res, next) {
  try {
    const { id: receiptId } = req.params;
    const { mode, userIds } = req.body;

    const { data: receipt, error: receiptError } = await req.supabase
      .from('receipts')
      .select('*, receipt_items(*)')
      .eq('id', receiptId)
      .single();

    if (receiptError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const items = receipt.receipt_items || [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'Receipt has no items to split. Parse items first.' });
    }

    // Determine target members
    let targetUserIds = userIds;
    if (mode === 'EQUAL_ALL' || !targetUserIds || targetUserIds.length === 0) {
      const { data: members } = await req.supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', receipt.group_id);
      targetUserIds = (members || []).map(m => m.user_id);
    }

    if (targetUserIds.length === 0) {
      return res.status(400).json({ error: 'No group members available to split with' });
    }

    const itemIds = items.map(i => i.id);

    // Delete existing shares for all items in this receipt
    await req.supabase.from('item_shares').delete().in('item_id', itemIds);

    const allSharesToInsert = [];

    if (mode === 'EQUAL_ALL' || mode === 'EQUAL_SELECTED') {
      // Split each item equally among target members
      items.forEach(item => {
        const itemPrice = parseFloat(item.price);
        const shares = calculateEqualShares(itemPrice, targetUserIds);
        shares.forEach(s => {
          allSharesToInsert.push({
            item_id: item.id,
            user_id: s.userId,
            share_amount: s.shareAmount,
          });
        });
      });
    }

    const { data: insertedShares, error: insertError } = await req.supabase
      .from('item_shares')
      .insert(allSharesToInsert)
      .select();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    await logActivity(req.supabase, {
      groupId: receipt.group_id,
      actorId: req.userId,
      actionType: 'AUTO_SPLIT_APPLIED',
      description: `Auto-split (${mode}) applied across ${targetUserIds.length} members`,
      metadata: { receiptId, mode, memberCount: targetUserIds.length },
    });

    return res.json({
      message: `Successfully split ${items.length} items across ${targetUserIds.length} members`,
      sharesCount: insertedShares.length,
      shares: insertedShares,
    });
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
  getReceiptImageUrl,
  updateReceipt,
  deleteReceipt,
  autoSplitReceipt,
  updateItem,
  setItemShares,
};
