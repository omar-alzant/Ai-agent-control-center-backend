import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { protect } from '../middleware/auth.ts'; // Import your middleware

const router = Router();

router.get('/my-tokens', protect, async (req: any, res) => {
  const userId = req.user.id; 
  
  try {
    const { data, error } = await supabaseAdmin
      .from('Message')
      .select('tokensUsed')
      .eq('userId', userId) 
      .eq('role', 'assistant');

    if (error) throw error;

    const total = data?.reduce((acc, msg) => acc + (msg.tokensUsed || 0), 0) || 0;
    
    res.json({ 
      totalTokens: total,
      userId: userId // Optional: return for confirmation
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
});

export default router;