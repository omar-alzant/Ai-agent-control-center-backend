import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

router.get('/:agentId', async (req, res) => {
    const { agentId } = req.params;
  
    const { data, error } = await supabaseAdmin
      .from('Conversation')
      .select(`
        id,
        Message (*)
      `)
      .eq('agentId', agentId)
      .single();
  
    if (error) return res.status(200).json([]); // Return empty if no conversation yet
    res.json(data.Message); // Return the list of messages
  });

  export default router;