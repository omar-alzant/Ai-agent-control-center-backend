import express from 'express';
import { supabaseAdmin } from '../supabase.js';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

// 1. GET agents ONLY for a specific user
router.get('/', protect, async (req: any, res) => {
  const userId = req.user.id; 

  if (!userId) return res.status(400).json({ error: "userId is required" });

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .select('*')
    .eq('userId', userId) // CRITICAL: Only show the user's agents
    .order('createdAt', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', protect, async (req: any, res) => {
  const { name, systemPrompt, model } = req.body;
  const userId = req.user.id; 

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .insert([{ name, systemPrompt, model, userId }]) // Saves the verified owner
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, ...updates } = req.body; // Ensure user owns the agent they are editing

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .update(updates)
    .eq('id', id)
    .eq('userId', userId) // SECURITY: Only allow update if userId matches
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;