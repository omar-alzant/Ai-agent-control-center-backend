import { Router } from 'express';
import { OpenAI } from 'openai';
import { supabaseAdmin } from '../supabase.js';
import { protect } from '../middleware/auth.ts';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', protect, async (req: any, res) => {
  const { agentId, message } = req.body; 
  const start = Date.now();
  const userId = req.user.id; 
  const io = req.io; 

  try {
    // 1. Fetch Agent & Verify Ownership
    const { data: agent, error: agentErr } = await supabaseAdmin
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .eq('userId', userId) 
      .single();

    if (agentErr || !agent) return res.status(404).json({ error: "Agent not found" });

    // 2. Get/Create Conversation
    let { data: conversation } = await supabaseAdmin
      .from('Conversation')
      .select('id')
      .eq('agentId', agentId)
      .eq('userId', userId)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabaseAdmin
        .from('Conversation')
        .insert([{ agentId, userId }])
        .select().single();
      conversation = newConv;
    }

    // 3. Save User Message
    await supabaseAdmin.from('Message').insert([{
      conversationId: conversation?.id,
      userId,
      role: 'user',
      content: message
    }]);

    // 4. OpenAI Completion
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
    const completionTokens = response.usage?.completion_tokens || 0; // The actual AI output
    // 5. EMIT REAL-TIME METRICS
    // Emit to the general telemetry_update that your useSocketMetrics hook listens to
    io.to(agentId).emit('telemetry_update', {
      type: 'latency',
      value: latency,
      timestamp: new Date().toLocaleTimeString()
    });
    
    io.to(agentId).emit('telemetry_update', {
      type: 'tokens',
      value: tokens, 
      timestamp: new Date().toLocaleTimeString()
    });

    // 6. Save Assistant Message
    await supabaseAdmin.from('Message').insert([{
      conversationId: conversation?.id,
      userId,
      role: 'assistant',
      content: aiContent,
      latencyMs: latency,
      tokensUsed: completionTokens
    }]);

    res.json({ content: aiContent });

  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "LLM failed" });
  }
});

export default router;