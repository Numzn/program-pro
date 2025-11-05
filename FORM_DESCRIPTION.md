# Form Description - How It Works

## The Two Form Modes

### 1. Step-by-Step Form (Default)
A guided 3-step wizard that walks you through creating a program.

### 2. Bulk Entry Form
A text-based form where you paste or type all data at once.

---

## Step-by-Step Form Detailed Walkthrough

### Step 1: Basic Information

**Fields:**
- **Program Title** (required) - Text input
- **Date** (required) - Date picker
- **Theme** (optional) - Text input
- **Active** checkbox - Toggles program visibility

**What happens:**
- Data is stored in local state (in memory)
- Nothing is saved to database yet
- You can't proceed to Step 2 without title and date

**Navigation:**
- Click "Next" to go to Step 2 (only if title and date are filled)

---

### Step 2: Schedule Items

**How to Add Items:**

1. **Click "Add Schedule Item" button** (at the bottom of the card)
   - This opens a form inside the card
   - NO API call is made
   - NO database save happens
   - Just shows the form

2. **Fill in the form:**
   - **Title** (required) - e.g., "Conference Session"
   - **Start Time** (optional) - Time picker (HH:MM format)
   - **Description** (optional) - e.g., "Speaker: Rev. Isaac Mphande"
   - **Type** (dropdown) - Worship, Sermon, Announcement, or Special

3. **Click "Add Item" button**
   - Item is added to **local state only** (in memory)
   - Item appears in the list above
   - Form closes automatically
   - NO API call is made
   - NO database save happens

4. **Manage items:**
   - Items appear in a list with:
     - ⬆️ Up arrow - Move item up
     - ⬇️ Down arrow - Move item down
     - 🗑️ Trash icon - Delete item
   - All changes are local only

**Important:**
- ✅ Items are stored in memory only
- ✅ No database connection needed
- ✅ Works offline
- ⚠️ Items are NOT saved until you click "Publish Program"

**Navigation:**
- Click "Previous" to go back to Step 1
- Click "Next" to go to Step 3

---

### Step 3: Special Guests

**How to Add Guests:**

1. **Click "Add Special Guest" button**
   - Opens form (same as schedule items)

2. **Fill in the form:**
   - **Name** (required) - Guest's full name
   - **Role** (optional) - e.g., "Guest Speaker"
   - **Photo URL** (optional) - Image URL
   - **Bio** (optional) - Text area for description

3. **Click "Add Guest"**
   - Guest is added to local state
   - Appears in the list
   - NO API call is made

4. **Manage guests:**
   - Same reorder/delete options as schedule items

**Navigation:**
- Click "Previous" to go back to Step 2
- No "Next" button (this is the last step)

---

### Final Step: Publishing

**At the bottom of the form (always visible):**

**Three buttons:**

1. **Cancel** - Go back to programs list (loses all unsaved changes)

2. **Save Draft** (Secondary button)
   - Saves everything to browser localStorage
   - Works offline
   - Persists across page refreshes
   - Does NOT save to database
   - You can load the draft later

3. **Publish Program** (Primary button)
   - Saves everything to database
   - Requires internet connection
   - Creates/updates program record
   - Saves all schedule items
   - Saves all special guests
   - One API call saves everything
   - Redirects to programs list on success

---

## Understanding the "Not Found" Error

### When You Should NOT See "Not Found"

✅ **Adding schedule items locally** - This should NEVER show "not found"
✅ **Creating a new program** - No program ID exists yet, so no API calls happen
✅ **Filling out the form** - Everything is local until you publish

### When You MIGHT See "Not Found"

❌ **Editing a program that doesn't exist:**
   - URL: `/admin/programs/999/edit` (program 999 doesn't exist)
   - Error appears when page loads (trying to fetch program)
   - **Solution**: Check the program ID in the URL

❌ **Program was deleted:**
   - You're editing a program that was deleted
   - Error appears on page load
   - **Solution**: Create a new program instead

❌ **Wrong program ID:**
   - URL has incorrect ID
   - **Solution**: Verify the program ID

---

## Current Form Behavior

### For NEW Programs (Creating)

1. You land on `/admin/programs/new` or create page
2. **No program ID exists yet**
3. You fill Step 1 (Basic Info)
4. You go to Step 2 (Schedule Items)
5. **When you click "Add Schedule Item":**
   - ✅ Form opens (local only)
   - ✅ You fill in details
   - ✅ Click "Add Item"
   - ✅ Item appears in list (local state)
   - ✅ NO API call is made
   - ✅ NO "not found" error should occur

### For EXISTING Programs (Editing)

1. You land on `/admin/programs/{id}/edit`
2. **Program ID exists**
3. Page tries to load program data
4. **If program doesn't exist:**
   - ❌ "Not found" error appears
   - ❌ This happens on page load, NOT when adding items

5. **If program exists:**
   - ✅ Data loads
   - ✅ You can add items (local only)
   - ✅ NO "not found" error

---

## Troubleshooting "Not Found" When Adding Items

### Check These Things:

1. **What URL are you on?**
   - `/admin/programs/new` - Creating new (should work)
   - `/admin/programs/{id}/edit` - Editing (check if ID is correct)

2. **Open Browser Console (F12)**
   - Look for red error messages
   - Check what API calls are being made
   - See if "not found" is from an API call

3. **When does the error appear?**
   - On page load? → Program doesn't exist
   - When clicking "Add Schedule Item"? → Should NOT happen (bug)
   - When clicking "Add Item"? → Should NOT happen (bug)
   - When clicking "Publish Program"? → Program might not exist

4. **Check Network Tab (F12 → Network)**
   - See what API endpoints are being called
   - Check if any return 404 (Not Found)
   - Look at the request URL

---

## Expected Behavior

### ✅ CORRECT Behavior

1. Click "Add Schedule Item" → Form opens
2. Fill form → Type in fields
3. Click "Add Item" → Item appears in list
4. No errors, no API calls, everything works

### ❌ INCORRECT Behavior (Bug)

1. Click "Add Schedule Item" → Error appears
2. Click "Add Item" → Error appears
3. Items don't appear in list
4. API calls are being made when they shouldn't be

---

## If You're Seeing "Not Found" When Adding Items

**This is a bug!** Adding items should NOT make API calls.

**Please provide:**
1. Are you creating a NEW program or EDITING an existing one?
2. What exact error message do you see?
3. When does it appear? (on click, on submit, etc.)
4. What does the browser console show? (F12 → Console)
5. What does the network tab show? (F12 → Network)

The form is designed to work **completely offline** until you click "Publish Program".

