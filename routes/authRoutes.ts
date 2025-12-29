import { Router } from 'express';
import { getAuthenticatedSupabaseClient, supabaseAdmin } from '../supabase.js';
import { protect } from '../middleware/auth.js';
import jwt from  'jsonwebtoken';

const router = Router();

// REQUEST PASSWORD RESET
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      // This is the URL of your Next.js reset page
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });
  
    if (error) return res.status(400).json({ error: error.message });
  
    res.json({ message: "Password reset link sent to your email." });
  });
  
  // UPDATE PASSWORD (Called from the reset page)
  router.post('/reset-password', protect, async (req, res) => {
    const { new_password } = req.body;
  
    const { error } = await supabaseAdmin.auth.updateUser({
      password: new_password
    });
  
    if (error) return res.status(400).json({ error: error.message });
  
    res.json({ message: "Password updated successfully." });
  });

// SIGN UP
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email,
    password,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  if (authData.user) {
    // 2. Create user in your custom public.User table
    const { error: dbError } = await supabaseAdmin
      .from('User')
      .insert([{ id: authData.user.id, email, name }]);

    if (dbError) return res.status(500).json({ error: dbError.message });
  }

  res.status(201).json({ message: "User created successfully", user: authData.user });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    
    if (loginError) return res.status(400).json({ error: loginError.message });
    const authenticatedClient = getAuthenticatedSupabaseClient(loginData.session.access_token);

    const { data: user, error } = await authenticatedClient
      .from('User')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
      
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const token = jwt.sign(
      { 
        id: loginData.user.id, 
        email, 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );


  const updatedAt = new Date().toISOString();  

  await supabaseAdmin
    .from('user')
    .update({ updated_at: updatedAt })
    .eq('id', loginData.user.id);

  res.json({ 
    message: 'Login successful', 
    token: token, 
    user: {
      id: loginData.user.id,
      email: loginData.user.email,
      permissionToDelete: user.permissionToDelete,
    } 
  });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  });

export default router; 
