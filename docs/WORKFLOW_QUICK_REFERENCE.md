# BRD Workflow Quick Reference

## 🎯 Feature Overview

The BRD module now has a complete **Publish Workflow** system that enables:
1. **Status Management** - Draft → In-Review → Approved
2. **Review Assignment** - Assign specific reviewers  
3. **Collaboration** - Share with team members with permission control
4. **Audit Logging** - Complete history of all changes
5. **User Feedback** - Reviewers can provide comments during approval

---

## 📂 File Structure

```
frontend/
├── app/dashboard/brds/
│   ├── page.jsx (MAIN - contains BRD viewer with new tabs)
│   └── components/
│       ├── WorkflowPanel.jsx (NEW - handles workflow UI)
│       └── CollaboratorsPanel.jsx (NEW - handles sharing)
│
backend/
├── src/
│   ├── db/
│   │   └── migrate-sqlite.js (UPDATED - added workflow tables)
│   ├── controllers/
│   │   └── brdController.js (UPDATED - added 8 workflow methods)
│   └── routes/
│       └── brdRoutes.js (UPDATED - added workflow routes)
```

---

## 🔌 API Quick Reference

### Status Changes
```
Request Review:  POST /api/brd/{id}/request-review
Approve:         POST /api/brd/{id}/approve
Reject:          POST /api/brd/{id}/reject
```

### View Data
```
Get History:     GET /api/brd/{id}/workflow-history
Get Assignments: GET /api/brd/{id}/review-assignments
Get Collab:      GET /api/brd/{id}/collaborators
```

### Manage Collaborators
```
Add:             POST /api/brd/{id}/collaborators
Remove:          DELETE /api/brd/{id}/collaborators/{collab_id}
```

---

## 🎨 UI Components

### WorkflowPanel.jsx (1,032 lines)
**Location:** `frontend/app/dashboard/brds/components/WorkflowPanel.jsx`

**Props:**
```javascript
{
  brdId: string,              // UUID of BRD
  currentStatus: string,      // 'draft'|'in-review'|'approved'
  assignedTo: number,         // User ID of reviewer
  userId: number,             // Current user ID
  onStatusChange: function    // Callback when status changes
}
```

**Features:**
- Visual status badge with color coding
- Reviewer selection dropdown
- Request review with message
- Approve/Reject buttons for reviewers
- Workflow history timeline
- Responsive design

### CollaboratorsPanel.jsx (446 lines)
**Location:** `frontend/app/dashboard/brds/components/CollaboratorsPanel.jsx`

**Props:**
```javascript
{
  brdId: string,      // UUID of BRD
  userId: number      // Current user ID
}
```

**Features:**
- Add collaborators from user list
- Set permission levels (view/comment/edit)
- Remove collaborators
- Display all collaborators with info
- Permission badges with icons

---

## 📊 Database Schema

### brd_documents (Modified)
```sql
-- Added workflow fields:
assigned_to INTEGER,              -- Reviewer
request_review_at DATETIME,       -- When review requested
approved_at DATETIME,             -- When approved
approved_by INTEGER               -- Who approved
```

### brd_workflow_history (NEW)
```sql
id, brd_id, from_status, to_status, 
changed_by, reason, created_at
```

### brd_review_assignments (NEW)
```sql
id, brd_id, assigned_to, assigned_by,
status, comment, assigned_at, reviewed_at
```

### brd_collaborators (NEW)
```sql
id, brd_id, user_id, permission_level,
added_by, added_at
```

### brd_section_comments (NEW)
```sql
id, brd_id, section_heading, comment_text,
commented_by, status, created_at, resolved_at
```

---

## 🔄 Workflow States

### State Diagram
```
DRAFT
  ↓ (request review)
IN-REVIEW
  ├→ (approve) → APPROVED
  └→ (reject) → DRAFT
```

### State Details
| State | What It Means | Possible Actions |
|-------|---------------|-----------------|
| **draft** | Initial state, editable | Edit, Request Review |
| **in-review** | Waiting for reviewer approval | (Owner: View) (Reviewer: Approve/Reject) |
| **approved** | Ready to use/publish | View only |

---

## 🔒 Permission Model

### Who Can Do What?

#### For Owner (who created BRD)
- ✅ Create BRD
- ✅ Edit when Draft
- ✅ Request Review
- ✅ View History
- ✅ Add/Remove Collaborators
- ✅ See Workflow Status

#### For Assigned Reviewer
- ✅ View BRD (when In-Review)
- ✅ Approve BRD
- ✅ Reject with Feedback
- ✅ Add Comments

#### For Collaborators
- ✅ View (if permission_level='view')
- ✅ Comment (if permission_level='comment')
- ✅ Edit (if permission_level='edit')

---

## 💻 Integration Examples

### React Hook - Using Workflow
```javascript
import WorkflowPanel from './components/WorkflowPanel';

export default function BRDViewer() {
  const [brdStatus, setBrdStatus] = useState('draft');
  
  return (
    <WorkflowPanel
      brdId={brd.id}
      currentStatus={brdStatus}
      assignedTo={brd.assigned_to}
      userId={user.id}
      onStatusChange={(newStatus) => setBrdStatus(newStatus)}
    />
  );
}
```

### API Call - Request Review
```javascript
const response = await api.post(`/api/brd/${brdId}/request-review`, {
  assigned_to: 2,
  reason: 'Please review'
});

if (response.success) {
  // Status changed to 'in-review'
  // Refresh BRD data
}
```

### API Call - Approve BRD
```javascript
const response = await api.post(`/api/brd/${brdId}/approve`, {
  reason: 'Approved!'
});

if (response.success) {
  // Status changed to 'approved'
}
```

---

## 🧪 Quick Testing

### Manual Test Flow
1. **Create BRD** - Get draft BRD
2. **Request Review** - Assign to user #2
3. **Switch User** - Login as user #2
4. **Approve** - Click approve button
5. **Verify** - Check status is now "approved"

### Database Verification
```sql
-- Check workflow history
SELECT * FROM brd_workflow_history 
WHERE brd_id = 'your-brd-id';

-- Check current status
SELECT id, status, assigned_to, approved_by 
FROM brd_documents 
WHERE id = 'your-brd-id';

-- Check collaborators
SELECT * FROM brd_collaborators 
WHERE brd_id = 'your-brd-id';
```

---

## 🐛 Troubleshooting

### "Cannot request review for BRD with status 'in-review'"
**Cause:** BRD is already in review  
**Fix:** Reject the BRD first to return to draft, then re-request

### "You are not authorized to approve this BRD"
**Cause:** You're not the assigned reviewer  
**Fix:** Have the assigned reviewer approve, or have owner reassign review

### "Collaborator endpoint not working"
**Cause:** API might not be loading mock data  
**Fix:** Check if `/api/users/reviewers` is available, component uses fallback mock data

### UI not updating after action
**Cause:** Component state not refreshed  
**Fix:** Check `onStatusChange` callback is called with new status

---

## 📈 Next Steps

### Immediate (Phase 2)
1. **Activity Log** - Track all changes, who made them, when
2. **Comments** - Section-level discussion threads
3. **Notifications** - Alert users of workflow events

### Medium Term (Phase 3)
1. **Email Alerts** - Notify reviewers, owners
2. **Workflow Templates** - Pre-defined review processes
3. **Automation** - Auto-approve based on rules

### Future (Phase 4)
1. **Real-time Collaboration** - Live editing with presence
2. **Advanced Permissions** - Role-based access control
3. **Analytics** - Track approval metrics, cycle times

---

## 🔗 References

- Full Implementation: `PUBLISH_WORKFLOW_IMPLEMENTATION.md`
- API Testing: `WORKFLOW_API_TESTING.md`
- BRD Controller: `backend/src/controllers/brdController.js`
- BRD Routes: `backend/src/routes/brdRoutes.js`
- Database: `backend/src/db/migrate-sqlite.js`

---

## 📞 Support

For issues or questions:
1. Check the **Error Codes** section above
2. Review **API Testing Guide** for endpoint format
3. Check browser **Console** for errors
4. Check backend **Terminal** for API errors
5. Query **Database** to verify data integrity

---

**Version:** 1.0  
**Status:** Production Ready ✅  
**Last Updated:** 2024  
**Maintained By:** Development Team
