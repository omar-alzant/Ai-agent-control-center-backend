-- 1. Create the User Table (for Authentication & Ownership)
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 2. Updated Agent Table (Added userId)
create table public."Agent" (
  id text not null default gen_random_uuid (),
  "userId" text not null,
  name text not null,
  "systemPrompt" text not null,
  model text not null default 'gpt-4'::text,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "isDeleted" boolean null default false,
  "updatedAt" timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
  constraint Agent_pkey primary key (id),
  constraint Agent_userId_fkey foreign KEY ("userId") references "User" (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists "Agent_userId_idx" on public."Agent" using btree ("userId") TABLESPACE pg_default;

-- 3. Updated Conversation Table (Added userId)
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL, -- Who is having the conversation
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") 
        REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Updated Message Table (Added userId for fast token sum)
CREATE TABLE "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL, -- Added for fast filtering by user without joins
    "role" TEXT NOT NULL, -- 'user' or 'assistant'
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER DEFAULT 0,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") 
        REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Updated Indexes for Multi-Tenant performance
CREATE INDEX "Agent_userId_idx" ON "Agent"("userId");
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");
CREATE INDEX "Message_userId_idx" ON "Message"("userId");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");