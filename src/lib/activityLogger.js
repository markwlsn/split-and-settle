async function logActivity(supabase, { groupId, actorId, actionType, description, metadata = {} }) {
  try {
    if (!groupId || !actorId || !actionType) return;
    await supabase.from('activity_logs').insert({
      group_id: groupId,
      actor_id: actorId,
      action_type: actionType,
      description,
      metadata,
    });
  } catch (err) {
    // Non-blocking: warning only so main request pipeline continues
    console.warn('[ActivityLogger] Warning:', err.message);
  }
}

module.exports = { logActivity };
