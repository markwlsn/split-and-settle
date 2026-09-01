async function createGroup(req, res, next) {
  try {
    const { name, displayName } = req.body;
    const { data: group, error: groupError } = await req.supabase
      .from('groups')
      .insert({ name, created_by: req.userId })
      .select()
      .single();

    if (groupError) {
      return res.status(400).json({ error: groupError.message });
    }

    // Auto-join creator as group member
    const { data: member, error: memberError } = await req.supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: req.userId,
        display_name: displayName || req.user?.user_metadata?.name || 'Me',
      })
      .select()
      .single();

    if (memberError) {
      return res.status(400).json({ error: memberError.message });
    }

    return res.status(201).json({ ...group, membership: member });
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

module.exports = {
  createGroup,
  listGroups,
  addMember,
  listMembers,
};
