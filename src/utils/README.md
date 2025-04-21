# HTTP and API Utilities

This directory contains utilities for making HTTP requests, including support for streaming responses. These utilities are built on top of the native Fetch API.

## HTTP Utility (`http.ts`)

The HTTP utility provides a wrapper around the Fetch API with additional features:

- Timeout support
- Automatic response parsing based on content type
- Query parameter handling
- Base URL configuration
- Streaming request support with progress tracking

### Basic Usage

```typescript
import { http } from "./utils/http";

// Regular GET request
const getResponse = await http.get("/api/endpoint");

// POST request with JSON data
const postResponse = await http.post("/api/endpoint", { key: "value" });

// PUT request
const putResponse = await http.put("/api/endpoint", { key: "updatedValue" });

// DELETE request
const deleteResponse = await http.delete("/api/endpoint");
```

### Streaming Response

```typescript
import { http, useStreamResponse } from "./utils/http";

// Using the streaming composable
const { text, isStreaming, error, startStream } = useStreamResponse();

// Start a streaming request
await startStream("/api/stream", {
  method: "POST",
  body: JSON.stringify(data),
});

// text will be reactively updated as chunks arrive
console.log(text.value);

// Or using the direct streaming API with callbacks
await http.stream(
  "/api/stream",
  { method: "POST", body: JSON.stringify(data) },
  {
    onChunk: (chunk) => console.log("Received chunk:", chunk),
    onComplete: () => console.log("Stream completed"),
    onError: (error) => console.error("Stream error:", error),
  }
);
```

## API Service (`api.ts`)

The API service provides specific methods for interacting with the backend API, using the HTTP utility under the hood.

### Chat API Methods

```typescript
import { chatApi } from "./utils/api";

// Send a regular message
const response = await chatApi.sendMessage("Hello, world!", "conversation-id");

// Send a message with streaming response
const streamResponse = await chatApi.streamMessage(
  "Hello, world!",
  "conversation-id"
);
console.log(streamResponse.text.value); // Access streaming text

// Get conversation history
const history = await chatApi.getConversationHistory("conversation-id");

// Create a new conversation
const newConv = await chatApi.createConversation("My new conversation");

// Delete a conversation
await chatApi.deleteConversation("conversation-id");
```

## Environment Configuration

API base URL is configured using environment variables:

```
VITE_API_BASE_URL=http://localhost:3000
```

You can change this in the `.env` file at the project root.
