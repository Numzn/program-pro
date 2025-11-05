# Form Usage Guide - How the Forms Work

## Overview

There are **two form modes** for creating/editing programs:

1. **Step-by-Step Form** (default) - Guided 3-step wizard
2. **Bulk Entry Form** - Text-based quick import

Both forms work the same way - they collect data locally and save everything at once when you click "Publish Program".

---

## How Schedule Items Work

### Important: Schedule Items Are Added Locally First

When you click **"Add Schedule Item"** in the form:

1. ✅ **Form opens** - You see input fields for Title, Time, Description, Type
2. ✅ **You fill in the details** - Enter title, optional time, description, and select type
3. ✅ **Click "Add Item"** - The item is added to **local state** (in memory)
4. ✅ **Item appears in the list** - You can see it, edit it, delete it, or reorder it
5. ⚠️ **NOT saved to database yet** - Items are only saved when you click "Publish Program"

### Why This Design?

- **For New Programs**: There's no program ID yet, so we can't save items to the database
- **For Editing Programs**: We collect all changes and save everything at once (bulk update)
- **Better UX**: You can add multiple items, reorder them, and make changes before saving

---

## Step-by-Step Form Flow

### Step 1: Basic Information
- **Title** (required) - Program name
- **Date** (required) - When the program happens
- **Theme** (optional) - Program theme
- **Active** checkbox - Make program visible

**Navigation**: Click "Next" to go to Step 2 (requires title and date)

### Step 2: Schedule Items
- **Add Schedule Item** button - Click to open form
- **Fill in details**:
  - Title (required)
  - Start Time (optional) - Format: HH:MM
  - Description (optional)
  - Type - Worship, Sermon, Announcement, or Special
- **Add Item** - Adds to local list
- **Manage items**:
  - ⬆️ ⬇️ Buttons to reorder
  - 🗑️ Button to delete
- **Navigation**: Previous/Next buttons

### Step 3: Special Guests
- **Add Special Guest** button - Click to open form
- **Fill in details**:
  - Name (required)
  - Role (optional)
  - Bio (optional)
  - Photo URL (optional)
- **Add Guest** - Adds to local list
- **Manage guests**: Same reorder/delete options

### Final Step: Publish
- **Save Draft** - Saves to browser localStorage (works offline)
- **Publish Program** - Saves everything to database (requires internet)

---

## Bulk Entry Form Flow

### Program Details Textarea
```
Title: 2025 Annual Conference
Date: 2025-10-23
Theme: THE GOD OF ALL FLESH
Active: yes
```

### Schedule Items Textarea
```
Thursday, October 23 | 14:00 | Conference Session | sermon | Rev. Isaac Mphande
Friday, October 24 | 14:00 | Afternoon Session | sermon | Rev. Isaac Mphande
```

**Format**: `Day | Time | Title | Type | Speaker`

### Special Guests Textarea
```
Bishop Maron Musonda | Guest Speaker | Spel Ministries International
Bishop Davison Soko | Guest Speaker | Bigoca (Agape City)
```

**Format**: `Name | Role | Affiliation`

### Parse & Apply
- Click **"Parse & Apply"** button
- Form validates and parses the text
- Data appears in preview
- **Important**: You still need to click "Publish Program" to save

---

## Understanding the "Not Found" Error

### When You Might See "Not Found"

1. **Editing a Non-Existent Program**
   - URL: `/admin/programs/999/edit` (program ID 999 doesn't exist)
   - **Solution**: Go back to programs list and edit an existing program

2. **Program Was Deleted**
   - Program existed but was deleted
   - **Solution**: Create a new program instead

3. **Wrong Program ID**
   - URL has incorrect ID
   - **Solution**: Check the program ID in the URL

4. **During Form Submission**
   - If you're editing and the program doesn't exist
   - **Solution**: Check browser console for detailed error

### When "Not Found" Should NOT Appear

✅ **Adding schedule items locally** - This should never show "not found" because it's just local state
✅ **Creating a new program** - No program ID needed until you publish

---

## How to Use the Forms Correctly

### Creating a New Program

1. Go to `/admin/programs/new` or click "Create New Program"
2. **Step-by-Step Form**:
   - Fill Step 1 (Basic Info)
   - Click "Next"
   - Fill Step 2 (Schedule Items) - Add items locally
   - Click "Next"
   - Fill Step 3 (Special Guests) - Add guests locally
   - Click "Publish Program" - Saves everything
3. **Bulk Entry Form**:
   - Switch to "Bulk Entry" tab
   - Paste or type data in text areas
   - Click "Parse & Apply"
   - Click "Publish Program" - Saves everything

### Editing an Existing Program

1. Go to `/admin/programs/{id}/edit` (from programs list)
2. Program data loads automatically
3. Make changes (add items, edit, delete)
4. Changes are saved locally until you click "Publish Update"
5. Click "Publish Update" - Saves all changes

---

## Troubleshooting

### "Not Found" When Adding Schedule Items

**If you see this when clicking "Add Schedule Item":**

1. **Check the URL**: Are you editing a program? The URL should be `/admin/programs/{id}/edit`
2. **Check console**: Open browser DevTools (F12) → Console tab
3. **Look for errors**: What exact error message appears?
4. **Check network tab**: Are there failed API requests?

**Common Causes:**
- ❌ Program ID in URL doesn't exist
- ❌ Authentication token expired (try logging out/in)
- ❌ Network error (check internet connection)

### Schedule Items Not Showing

**If items don't appear after adding:**

1. **Check form mode**: Are you in Step 2 (Schedule Items)?
2. **Refresh page**: Sometimes state doesn't update (shouldn't happen, but try)
3. **Check console**: Any JavaScript errors?
4. **Try adding again**: Fill form and click "Add Item"

### Items Not Saving

**If items disappear after refresh:**

1. **Did you click "Publish Program"?** - Items are only saved when you publish
2. **Check draft**: Did you save a draft? Try loading it
3. **Check database**: Are you sure the program was created?

---

## Data Flow Summary

```
┌─────────────────────────────────────────┐
│ 1. USER FILLS FORM                      │
│    - Basic Info (title, date, theme)    │
│    - Schedule Items (added locally)     │
│    - Special Guests (added locally)     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. CLICK "PUBLISH PROGRAM"              │
│    - All data collected                 │
│    - Formatted for API                  │
│    - Sent to backend                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. BACKEND PROCESSES                    │
│    - Creates/Updates program            │
│    - Inserts schedule items             │
│    - Inserts special guests             │
│    - All in one transaction             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 4. DATABASE SAVED                       │
│    - Program record created              │
│    - Schedule items saved                │
│    - Guests saved                        │
│    - Success message shown               │
└─────────────────────────────────────────┘
```

---

## Key Points to Remember

1. ✅ **Schedule items are added locally** - They don't save to database until you publish
2. ✅ **No API calls when adding items** - Just local state updates
3. ✅ **"Publish Program" saves everything** - One API call saves program + items + guests
4. ✅ **Drafts save to localStorage** - Works offline, persists across page refreshes
5. ✅ **"Not Found" usually means program doesn't exist** - Check the program ID in URL

---

## Need Help?

If you're still seeing "not found" errors:

1. **Check browser console** (F12) for detailed error messages
2. **Check network tab** to see what API calls are failing
3. **Verify program exists** - Go to programs list and check
4. **Try creating a new program** instead of editing

The forms are designed to work **offline** (draft mode) and only require internet when you **publish** to the database.

