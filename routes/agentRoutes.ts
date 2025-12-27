import express from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = express.Router();

// GET all agents
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('Agent')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST a new agent
router.post('/', async (req, res) => {
  const { name, systemPrompt, model } = req.body;
  const { data, error } = await supabaseAdmin
    .from('Agent')
    .insert([{ name, systemPrompt, model }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH agent settings
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabaseAdmin
    .from('Agent')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;