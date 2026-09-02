const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { groupSchema, joinGroupSchema, memberSchema } = require('../utils/schemas');
const {
  createGroup,
  joinGroup,
  listGroups,
  getGroupDetails,
  addMember,
  listMembers,
  getGroupActivity,
  getGroupAnalytics,
} = require('../controllers/group.controller');

// Join a group via invite code (requires auth)
router.post('/join', requireAuth, validate(joinGroupSchema), joinGroup);

// Create group
router.post('/', requireAuth, validate(groupSchema), createGroup);

// List user's groups
router.get('/', requireAuth, listGroups);

// Get single group details and summary stats
router.get('/:id', requireAuth, getGroupDetails);

// Add member by userId
router.post('/:id/members', requireAuth, validate(memberSchema), addMember);

// List group members
router.get('/:id/members', requireAuth, listMembers);

// Group activity audit feed
router.get('/:id/activity', requireAuth, getGroupActivity);

// Group spending analytics
router.get('/:id/analytics', requireAuth, getGroupAnalytics);

module.exports = router;
