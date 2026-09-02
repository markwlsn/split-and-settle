const { generateInviteCode } = require('../utils/splitCalculator');
const { logActivity } = require('../lib/activityLogger');
const { supabaseAdmin } = require('../lib/supabaseClient');
const { computeBalances } = require('../utils/settlement');

async function createGroup(req, res, next) {
  try {
    const { name, displayName } = req.body;
    const inviteCode = generateInviteCode();

    const { data: group, error: groupError } = await req.supabase
      .from('groups')
      .insert({
        name,
        created_by: req.userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (groupError) {
      return res.status(400).json({ error: groupError.message });
    }

    // Auto-join creator as group member
    const memberName = displayName || req.user?.user_metadata?.name || 'Me';
    const { data: member, error: memberError } = await req.supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: req.userId,
        display_name: memberName,
      })
      .select()
      .single();

    if (memberError) {
      return res.status(400).json({ error: memberError.message });
    }

    await logActivity(req.supabase, {
      groupId: group.id,
      actorId: req.userId,
      actionType: 'GROUP_CREATED',
      description: `${memberName} created the group "${name}"`,
      metadata: { inviteCode },
    });

    return res.status(201).json({ ...group, membership: member });
  } catch (err) {
    next(err);
  }
}

async function joinGroup(req, res, next) {
  try {
    const { inviteCode, displayName } = req.body;

    // Use admin client to lookup group by invite code (since user is not yet a member, RLS prevents select)
    const { data: group, error: findError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .ilike('invite_code', inviteCode.trim())
      .single();

    if (findError || !group) {
      return res.status(404).json({ error: 'Invalid invite code or group not found' });
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (existingMember) {
      return res.status(200).json({
        message: 'You are already a member of this group',
        group,
        membership: existingMember,
      });
    }

    const memberName = displayName || req.user?.user_metadata?.name || 'Member';
    const { data: member, error: joinError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: req.userId,
        display_name: memberName,
      })
      .select()
      .single();

    if (joinError) {
      return res.status(400).json({ error: joinError.message });
    }

    await logActivity(supabaseAdmin, {
      groupId: group.id,
      actorId: req.userId,
      actionType: 'MEMBER_JOINED',
      description: `${memberName} joined the group using an invite code`,
      metadata: { userId: req.userId },
    });

    return res.status(201).json({
      message: `Successfully joined "${group.name}"`,
      group,
      membership: member,
    });
  } catch (err) {
    next(err);
  }
}

async function listGroups(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('groups')
      .select('*, group_members(id, user_id, display_name)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getGroupDetails(req, res, next) {
  try {
    const { id: groupId } = req.params;

    const { data: group, error: groupError } = await req.supabase
      .from('groups')
      .select('*, group_members(*)')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Summary counts
    const { data: receipts } = await req.supabase
      .from('receipts')
      .select('id, total_amount, status')
      .eq('group_id', groupId);

    const totalSpent = (receipts || [])
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

    return res.json({
      ...group,
      stats: {
        receiptCount: (receipts || []).length,
        totalConfirmedSpend: Math.round(totalSpent * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const { userId, displayName } = req.body;

    const { data, error } = await req.supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await logActivity(req.supabase, {
      groupId,
      actorId: req.userId,
      actionType: 'MEMBER_ADDED',
      description: `${displayName} was added to the group`,
      metadata: { addedUserId: userId },
    });

    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function listMembers(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const { data, error } = await req.supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getGroupActivity(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await req.supabase
      .from('activity_logs')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10) || 50);

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      return res.json([]);
    }
    return res.json(data || []);
  } catch (err) {
    next(err);
  }
}

async function getGroupAnalytics(req, res, next) {
  try {
    const { id: groupId } = req.params;

    // Fetch members
    const { data: members } = await req.supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    // Fetch confirmed receipts
    const { data: receipts } = await req.supabase
      .from('receipts')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'confirmed');

    const confirmedReceipts = receipts || [];
    const totalSpent = confirmedReceipts.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

    // Category breakdown
    const categoryBreakdown = {};
    const merchantMap = {};
    const paidByMember = {};

    confirmedReceipts.forEach(r => {
      const amount = parseFloat(r.total_amount) || 0;
      const cat = r.category || 'Other';
      categoryBreakdown[cat] = Math.round(((categoryBreakdown[cat] || 0) + amount) * 100) / 100;

      if (r.merchant_name) {
        merchantMap[r.merchant_name] = Math.round(((merchantMap[r.merchant_name] || 0) + amount) * 100) / 100;
      }

      paidByMember[r.paid_by] = Math.round(((paidByMember[r.paid_by] || 0) + amount) * 100) / 100;
    });

    // Top merchants
    const topMerchants = Object.entries(merchantMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Member consumption breakdown from shares
    const receiptIds = confirmedReceipts.map(r => r.id);
    let shares = [];
    let items = [];

    if (receiptIds.length > 0) {
      const { data: itemsData } = await req.supabase
        .from('receipt_items')
        .select('id, receipt_id, price')
        .in('receipt_id', receiptIds);

      items = itemsData || [];
      const itemIds = items.map(i => i.id);

      if (itemIds.length > 0) {
        const { data: sharesData } = await req.supabase
          .from('item_shares')
          .select('item_id, user_id, share_amount')
          .in('item_id', itemIds);
        shares = sharesData || [];
      }
    }

    const consumedByMember = {};
    shares.forEach(s => {
      const amount = parseFloat(s.share_amount) || 0;
      consumedByMember[s.user_id] = Math.round(((consumedByMember[s.user_id] || 0) + amount) * 100) / 100;
    });

    const memberStats = (members || []).map(m => {
      const paid = paidByMember[m.user_id] || 0;
      const consumed = consumedByMember[m.user_id] || 0;
      return {
        userId: m.user_id,
        displayName: m.display_name,
        totalPaid: paid,
        totalConsumed: consumed,
        netBalance: Math.round((paid - consumed) * 100) / 100,
      };
    });

    return res.json({
      totalSpent: Math.round(totalSpent * 100) / 100,
      receiptCount: confirmedReceipts.length,
      averageReceiptAmount: confirmedReceipts.length > 0
        ? Math.round((totalSpent / confirmedReceipts.length) * 100) / 100
        : 0,
      categoryBreakdown,
      topMerchants,
      memberStats,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroup,
  joinGroup,
  listGroups,
  getGroupDetails,
  addMember,
  listMembers,
  getGroupActivity,
  getGroupAnalytics,
};
