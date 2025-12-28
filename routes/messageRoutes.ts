import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { protect } from '../middleware/auth.ts'; // Import your new middleware

const router = Router();

// GET messages for a specific agent (Securely)
router.get('/:agentId', protect, async (req: any, res) => {
  const { agentId } = req.params;
  const userId = req.user.id; // Get the verified ID from the JWT token

  const { data, error } = await supabaseAdmin
    .from('Conversation')
    .select(`
      id,
      Message (*)
    `)
    .eq('agentId', agentId)
    .eq('userId', userId) // SECURITY: Only fetch if the conversation belongs to the user
    .single();

  // If there's an error (like the conversation doesn't exist yet), return an empty array
  if (error || !data) {
    return res.status(200).json([]);
  }

  // Sort messages by creation date if not already handled by DB
  const sortedMessages = data.Message.sort(
    (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  res.json(sortedMessages);
});

export default router;