# Realtime Updates Without Supabase Replication

## Overview

Supabase Realtime with `postgres_changes` requires replication to be enabled on tables. If you can't enable replication, here are alternative approaches:

## Option 1: Polling (Simplest - Recommended)

**Pros:**
- No Supabase setup required
- Works immediately
- Simple to implement
- Reliable

**Cons:**
- Not truly "realtime" (has delay based on interval)
- Uses more bandwidth
- Less efficient than true realtime

### Implementation

Replace the Supabase subscription with polling:

```javascript
// In Dashboard.jsx
useEffect(() => {
  // Fetch initial statistics
  fetchStatistics(selectedYear);

  // Set up polling interval (e.g., every 30 seconds)
  const pollInterval = setInterval(() => {
    fetchStatistics(selectedYear);
  }, 30000); // 30 seconds

  // Cleanup interval on unmount
  return () => {
    clearInterval(pollInterval);
  };
}, [selectedYear, token]);
```

## Option 2: Supabase Broadcast Channels (No Replication Needed)

**Pros:**
- Uses Supabase infrastructure
- True realtime when triggered
- No replication required

**Cons:**
- Requires manual triggering from backend
- More complex setup
- Need to trigger broadcasts on every change

### Backend Implementation

Add broadcast trigger after flight changes:

```python
# In flight_blueprint.py after flight commit
from supabase import create_client, Client

# Initialize Supabase client (add to config or separate file)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service role key, not anon key
)

# After session.commit() in POST/PATCH/DELETE routes:
supabase.realtime.send({
    "channel": "flights-changes",
    "event": "flight-updated",
    "payload": {"year": flight.date.year}
})
```

### Frontend Implementation

```javascript
// In Dashboard.jsx
useEffect(() => {
  fetchStatistics(selectedYear);

  // Subscribe to broadcast channel
  const channel = supabase
    .channel("flights-changes")
    .on("broadcast", { event: "flight-updated" }, (payload) => {
      const year = payload.payload.year;
      if (year === selectedYear) {
        fetchStatistics(selectedYear);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedYear, token]);
```

## Option 3: Server-Sent Events (SSE)

**Pros:**
- True realtime
- One-way server-to-client
- Simple protocol

**Cons:**
- Requires backend SSE endpoint
- More complex than polling

### Backend Implementation

```python
# New endpoint in flight_blueprint.py
from flask import Response, stream_with_context
import json
import time

@flights.route("/statistics/stream", methods=["GET"])
def stream_statistics():
    def event_stream():
        last_year = None
        while True:
            year = request.args.get("year", type=int) or datetime.now(UTC).year
            if year != last_year:
                # Fetch and send statistics
                stats = get_flight_statistics_data(year)
                yield f"data: {json.dumps(stats)}\n\n"
                last_year = year
            time.sleep(5)  # Check every 5 seconds
    
    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream"
    )
```

### Frontend Implementation

```javascript
useEffect(() => {
  const eventSource = new EventSource(
    `/api/flights/statistics/stream?year=${selectedYear}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Update state with new statistics
    setTotalFlights(data.total_flights);
    // ... update other state
  };

  return () => {
    eventSource.close();
  };
}, [selectedYear]);
```

## Option 4: WebSocket (Most Complex)

**Pros:**
- True bidirectional realtime
- Most flexible

**Cons:**
- Requires WebSocket server
- Most complex to implement
- Overkill for this use case

## Recommendation

**Use Polling (Option 1)** for simplicity and reliability. It's the easiest to implement and maintain, and for a dashboard that doesn't need instant updates, a 30-second refresh is perfectly acceptable.

If you need true realtime and can trigger broadcasts, use **Supabase Broadcast (Option 2)**.

