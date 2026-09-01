const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { groupSchema, memberSchema } = require('../utils/schemas');
const {
  createGroup,
  listGroups,
  addMember,
  listMembers,
} = require('../controllers/group.controller');

router.use(requireAuth);

router.post('/', validate(groupSchema), createGroup);
router.get('/', listGroups);
router.post('/:id/members', validate(memberSchema), addMember);
router.get('/:id/members', listMembers);

module.exports = router;
