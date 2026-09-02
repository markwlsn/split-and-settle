const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = isJson && data.error ? data.error : response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (email, password, name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Groups
  listGroups: () => request('/groups'),
  createGroup: (name, displayName, currency = 'USD') =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, displayName, currency }),
    }),
  updateGroup: (groupId, updates) =>
    request(`/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  leaveGroup: (groupId) =>
    request(`/groups/${groupId}/leave`, {
      method: 'POST',
    }),
  deleteGroup: (groupId) =>
    request(`/groups/${groupId}`, {
      method: 'DELETE',
    }),
  joinGroup: (inviteCode, displayName) =>
    request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode, displayName }),
    }),
  getGroupDetails: (groupId) => request(`/groups/${groupId}`),
  listMembers: (groupId) => request(`/groups/${groupId}/members`),
  addMember: (groupId, userId, displayName) =>
    request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, displayName }),
    }),
  getGroupActivity: (groupId) => request(`/groups/${groupId}/activity`),
  getGroupAnalytics: (groupId) => request(`/groups/${groupId}/analytics`),

  // Receipts / Expenses
  uploadReceipt: (groupId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return request(`/groups/${groupId}/receipts`, {
      method: 'POST',
      body: formData,
    });
  },
  createManualExpense: (groupId, expenseData) =>
    request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),
  parseReceipt: (receiptId) =>
    request(`/receipts/${receiptId}/parse`, {
      method: 'POST',
    }),
  getReceipt: (receiptId) => request(`/receipts/${receiptId}`),
  getReceiptImageUrl: (receiptId) => request(`/receipts/${receiptId}/image-url`),
  updateReceipt: (receiptId, updates) =>
    request(`/receipts/${receiptId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  deleteReceipt: (receiptId) =>
    request(`/receipts/${receiptId}`, {
      method: 'DELETE',
    }),
  addItem: (receiptId, item) =>
    request(`/receipts/${receiptId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  deleteItem: (receiptId, itemId) =>
    request(`/receipts/${receiptId}/items/${itemId}`, {
      method: 'DELETE',
    }),
  autoSplitReceipt: (receiptId, mode = 'EQUAL_ALL', userIds = undefined) =>
    request(`/receipts/${receiptId}/auto-split`, {
      method: 'POST',
      body: JSON.stringify({ mode, userIds }),
    }),
  updateItem: (receiptId, itemId, updates) =>
    request(`/receipts/${receiptId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  setItemShares: (receiptId, itemId, shares) =>
    request(`/receipts/${receiptId}/items/${itemId}/shares`, {
      method: 'POST',
      body: JSON.stringify({ shares }),
    }),
  confirmReceipt: (receiptId) =>
    request(`/receipts/${receiptId}/confirm`, {
      method: 'POST',
    }),

  // Settlements
  listSettlements: (groupId) => request(`/groups/${groupId}/settlements`),
  recordPayment: (groupId, toUser, amount) =>
    request(`/groups/${groupId}/settlements/payments`, {
      method: 'POST',
      body: JSON.stringify({ toUser, amount: Number(amount) }),
    }),
};
