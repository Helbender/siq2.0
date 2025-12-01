# Supabase Realtime Setup for Dashboard

## Overview
The Dashboard component uses Supabase realtime to automatically update flight statistics when flights are added, modified, or deleted.

## Setup Instructions

### 1. Get Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

### 2. Configure Environment Variables

Create or update `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Enable Realtime in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Enable replication for the `flights_table` table:
   - Find `flights_table` in the list
   - Toggle the switch to enable replication
   - This allows realtime subscriptions to work

### 4. Verify Table Name

Make sure your Supabase table name matches exactly:
- Table name: `flights_table`
- Schema: `public`

If your table has a different name, update the subscription in `Dashboard.jsx`:

```javascript
table: "your_table_name",  // Change this to match your actual table name
```

## How It Works

1. **Initial Load**: The dashboard fetches statistics from the API endpoint `/api/flights/statistics`
2. **Realtime Updates**: Supabase listens for changes (INSERT, UPDATE, DELETE) on the `flights_table`
3. **Auto-refresh**: When any change is detected, the statistics are automatically refetched

## Testing

1. Open the Dashboard page
2. Add, edit, or delete a flight from another tab/window
3. Watch the dashboard update automatically without refreshing

## Troubleshooting

### Dashboard shows "Loading..." indefinitely
- Check that your Supabase credentials are correct in `.env`
- Verify the Supabase client is initialized (check browser console)

### Statistics don't update in realtime
- Ensure Realtime is enabled for `flights_table` in Supabase dashboard
- Check browser console for Supabase connection errors
- Verify the table name matches exactly

### "Supabase credentials not found" warning
- Make sure `.env` file exists in `frontend/` directory
- Restart the development server after adding environment variables
- Variables must start with `VITE_` to be accessible in Vite


