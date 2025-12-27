import { Router } from 'express';
import { OpenAI } from 'openai';
import { supabaseAdmin } from '../supabase.js';
import { io } from '../socket.ts'; 

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { agentId, message } = req.body;
  const start = Date.now();

  // 1. Fetch the Agent to get the System Prompt
  const { data: agent, error: agentErr } = await supabaseAdmin
    .from('Agent')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agentErr || !agent) return res.status(404).json({ error: "Agent not found" });

  // 2. Get or Create a Conversation
  let { data: conversation } = await supabaseAdmin
    .from('Conversation')
    .select('id')
    .eq('agentId', agentId)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabaseAdmin
      .from('Conversation')
      .insert([{ id: crypto.randomUUID(), agentId }])
      .select()
      .single();
    conversation = newConv;
  }

  // 3. Save User Message
  if (conversation) {
    await supabaseAdmin.from('Message').insert([{
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      role: 'user',
      content: message
    }]);
  }

  try {
    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
      model: agent.model || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: agent.systemPrompt }, 
        { role: "user", content: message }
      ],
    });

    const aiContent = response.choices[0].message.content;
    const latency = Date.now() - start;
    const tokens = response.usage?.total_tokens || 0;

    // ---------------------------------------------------------
    // 5. EMIT REAL-TIME METRICS VIA SOCKET
    // ---------------------------------------------------------
    // This tells the frontend to update the charts immediately
    io.emit('telemetry_update', {
      type: 'latency',
      value: latency,
      timestamp: new Date().toLocaleTimeString()
    });

    io.emit('telemetry_update', {
      type: 'tokens',
      value: tokens,
      timestamp: new Date().toLocaleTimeString()
    });
    // ---------------------------------------------------------

    // 6. Save Assistant Message to DB
    if (conversation) {
      await supabaseAdmin.from('Message').insert([{
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        role: 'assistant',
        content: aiContent,
        latencyMs: latency,
        tokensUsed: tokens
      }]);
    }

    res.json({ content: aiContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "LLM failed" });
  }
});

export default router;