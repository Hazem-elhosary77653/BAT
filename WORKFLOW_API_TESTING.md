# Workflow API Testing Guide

## Setup

Make sure your backend server is running:
```bash
cd backend
npm run dev
```

And frontend:
```bash
cd frontend
npm run dev
```

---

## API Endpoint Testing

### 1. Request Review
**Endpoint:** `POST /api/brd/{brdId}/request-review`

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/request-review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "assigned_to": 2,
    "reason": "Please review this updated BRD"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Review requested successfully",
  "data": {
    "status": "in-review"
  }
}
```

**Error Cases:**
- **400** - BRD not in draft status
- **404** - BRD not found
- **401** - Not authenticated

---

### 2. Approve BRD
**Endpoint:** `POST /api/brd/{brdId}/approve`

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer REVIEWER_JWT_TOKEN" \
  -d '{
    "reason": "Looks great, approved!"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "BRD approved successfully",
  "data": {
    "status": "approved"
  }
}
```

**Error Cases:**
- **403** - You are not the assigned reviewer
- **400** - BRD not in in-review status
- **404** - BRD not found

---

### 3. Reject BRD
**Endpoint:** `POST /api/brd/{brdId}/reject`

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer REVIEWER_JWT_TOKEN" \
  -d '{
    "reason": "Needs more detail in functional requirements section"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "BRD rejected for revisions",
  "data": {
    "status": "draft"
  }
}
```

---

### 4. Get Workflow History
**Endpoint:** `GET /api/brd/{brdId}/workflow-history`

**cURL Example:**
```bash
curl http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/workflow-history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "brd_id": "550e8400-e29b-41d4-a716-446655440000",
      "from_status": "draft",
      "to_status": "in-review",
      "changed_by": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "reason": "Please review this updated BRD",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "brd_id": "550e8400-e29b-41d4-a716-446655440000",
      "from_status": "in-review",
      "to_status": "approved",
      "changed_by": 2,
      "first_name": "Jane",
      "last_name": "Reviewer",
      "email": "jane@example.com",
      "reason": "Looks great!",
      "created_at": "2024-01-15T11:45:00Z"
    }
  ]
}
```

---

### 5. Get Review Assignments
**Endpoint:** `GET /api/brd/{brdId}/review-assignments`

**cURL Example:**
```bash
curl http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/review-assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "brd_id": "550e8400-e29b-41d4-a716-446655440000",
      "assigned_to": 2,
      "assigned_by": 1,
      "status": "approved",
      "comment": "Looks great!",
      "assigned_to_first_name": "Jane",
      "assigned_to_last_name": "Reviewer",
      "assigned_to_email": "jane@example.com",
      "assigned_at": "2024-01-15T10:30:00Z",
      "reviewed_at": "2024-01-15T11:45:00Z"
    }
  ]
}
```

---

### 6. Add Collaborator
**Endpoint:** `POST /api/brd/{brdId}/collaborators`

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/collaborators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": 3,
    "permission_level": "comment"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Collaborator added successfully"
}
```

**Permission Levels:**
- `view` - Read-only access
- `comment` - Can add comments and feedback
- `edit` - Full editing access

**Error Cases:**
- **400** - User already a collaborator
- **400** - Invalid permission level
- **404** - BRD not found
- **403** - You don't own this BRD

---

### 7. Remove Collaborator
**Endpoint:** `DELETE /api/brd/{brdId}/collaborators/{collaboratorId}`

**cURL Example:**
```bash
curl -X DELETE http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/collaborators/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Collaborator removed successfully"
}
```

---

### 8. Get Collaborators
**Endpoint:** `GET /api/brd/{brdId}/collaborators`

**cURL Example:**
```bash
curl http://localhost:3001/api/brd/550e8400-e29b-41d4-a716-446655440000/collaborators \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "brd_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 3,
      "permission_level": "edit",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com",
      "added_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "brd_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 4,
      "permission_level": "view",
      "first_name": "Bob",
      "last_name": "Viewer",
      "email": "bob@example.com",
      "added_at": "2024-01-15T09:30:00Z"
    }
  ]
}
```

---

## Integration Testing (Postman/Insomnia)

### Create a Collection

1. **Create New Collection:** "BRD Workflow"
2. **Add Environment Variable:**
   - `base_url` = `http://localhost:3001`
   - `token` = Your JWT token
   - `brd_id` = Your test BRD ID

3. **Import Requests:**

```javascript
// Request Review
POST {{base_url}}/api/brd/{{brd_id}}/request-review
Headers: Authorization: Bearer {{token}}
Body: {
  "assigned_to": 2,
  "reason": "Ready for review"
}

// Approve
POST {{base_url}}/api/brd/{{brd_id}}/approve
Headers: Authorization: Bearer {{token}}
Body: {
  "reason": "Approved!"
}

// Get History
GET {{base_url}}/api/brd/{{brd_id}}/workflow-history
Headers: Authorization: Bearer {{token}}
```

---

## Frontend Integration Testing

### 1. Test Workflow Panel
Navigate to BRD viewer:
1. Click "View" on any BRD
2. Click "Workflow" tab
3. Try requesting review:
   - Select reviewer from dropdown
   - Add optional message
   - Click "Request Review"
   - Verify status changes to "In Review"

### 2. Test Reviewer Flow
1. Log in as the assigned reviewer
2. Open same BRD
3. In Workflow tab:
   - Add feedback (optional)
   - Click "Approve" or "Reject"
   - Verify status updates

### 3. Test Collaborators
1. Click "Collaborators" tab
2. Click "Add Person"
3. Select user and permission level
4. Verify user appears in list
5. Test remove button

### 4. Test Workflow History
1. Click "Workflow" tab
2. Click "Workflow History"
3. Verify all status changes listed
4. Check timestamps and user names

---

## Debugging Tips

### Check Backend Logs
```bash
# In backend terminal, you should see:
POST /api/brd/:id/request-review 200 OK
POST /api/brd/:id/approve 200 OK
GET /api/brd/:id/workflow-history 200 OK
```

### Check Database
```bash
# To inspect workflow records
SELECT * FROM brd_workflow_history;
SELECT * FROM brd_review_assignments;
SELECT * FROM brd_collaborators;
```

### Common Issues

**400 Error: "Cannot request review for BRD with status 'in-review'"**
- BRD must be in "draft" status to request review
- Reject the BRD first to return to draft

**403 Error: "You are not authorized to approve this BRD"**
- You must be the assigned reviewer
- Check `assigned_to` field in brd_documents table

**404 Error: "BRD not found"**
- Verify BRD ID is correct UUID format
- Check BRD actually exists

---

## Success Checklist

- [ ] Can request review on draft BRD
- [ ] Can see workflow history with all transitions
- [ ] Reviewer can approve/reject BRD
- [ ] Status changes properly reflected
- [ ] Can add/remove collaborators
- [ ] Collaborators appear in list with permissions
- [ ] All timestamps recorded correctly
- [ ] Errors handled gracefully with messages
- [ ] Frontend UI responds smoothly
- [ ] No console errors in browser
