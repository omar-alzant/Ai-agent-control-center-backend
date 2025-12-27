-- 1. Create the Agent Table
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- 2. Create the Conversation Table
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
    -- Cascade Delete: If Agent is deleted, delete conversations
    CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") 
        REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Create the Message Table
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    -- Cascade Delete: If Conversation is deleted, delete messages
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") 
        REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Indexes for faster lookups (Optional but Recommended)
CREATE INDEX "Conversation_agentId_idx" ON "Conversation"("agentId");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");s