import express from 'express';
import { supabaseAdmin } from '../supabase.js';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', protect, async (req: any, res) => {
  const userId = req.user.id; 

  if (!userId) return res.status(400).json({ error: "userId is required" });

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .select('*')
    .eq('userId', userId)
    .or('isDeleted.eq.false,isDeleted.is.null')
    .order('createdAt', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});


// router.get('/:id', protect, async (req: any, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;

//   const { data, error } = await supabaseAdmin
//     .from('Agent')
//     .select('*')
//     .eq('id', id)
//     .eq('userId', userId)
//     .or('isDeleted.eq.false,isDeleted.is.null') 
//     .single();

//   if (error || !data) return res.status(404).json({ error: "Agent not found" });
//   res.json(data);
// });

router.post('/', protect, async (req: any, res) => {
  const { name, systemPrompt, model } = req.body;
  const userId = req.user.id;

  try {
    const { count, error: countError } = await supabaseAdmin
      .from('Agent')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .or('isDeleted.eq.false,isDeleted.is.null');

    if (countError) throw countError;

    const MAX_AGENTS = 5;
    if (count !== null && count >= MAX_AGENTS) {
      return res.status(403).json({ 
        error: "Quota exceeded", 
        message: `You have reached the maximum limit of ${MAX_AGENTS} agents.` 
      });
    }


    const { data, error } = await supabaseAdmin
      .from('Agent')
      .insert([{ name, systemPrompt, model, userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', protect, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Get ID from the verified token
  const updates = req.body;   // This will contain { isDeleted: true }

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .update({ 
      ...updates, 
      updatedAt: new Date().toISOString() // Good practice to track when it was archived
    })
    .eq('id', id)
    .eq('userId', userId) 
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Agent not found or unauthorized" });
  
  res.json(data);
});
router.delete('/:id', protect, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // This will physically remove the row. 
  // If you have "Cascade Delete" set up in DB, it will also wipe token logs.
  const { error } = await supabaseAdmin
    .from('Agent')
    .delete()
    .eq('id', id)
    .eq('userId', userId);

  if (error) return res.status(500).json({ error: error.message });
  
  res.status(200).json({ message: "Agent permanently deleted" });
});

router.get('/archived', protect, async (req: any, res) => {
  const userId = req.user.id;

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .select('*')
    .eq('userId', userId)
    .eq('isDeleted', true) 
    .order('updatedAt', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id/restore', protect, async (req: any, res) => {
  const userId = req.user.id;
  const agentId = req.params.id;

  const { count } = await supabaseAdmin
    .from('Agent')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .eq('isDeleted', false);

  if (count !== null && count >= 5) {
    return res.status(403).json({ 
      error: "Quota Full", 
      message: "You already have 5 active agents. Delete or archive one to restore this agent." 
    });
  }

  const { data, error } = await supabaseAdmin
    .from('Agent')
    .update({ isDeleted: false })
    .eq('id', agentId)
    .eq('userId', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;