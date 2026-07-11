const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Create auth user + profile
router.post('/invite', async (req, res) => {
  try {
    const { email, password, name, phone, role, hotel_id } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, and role are required' });
    }

    const validRoles = ['admin', 'receptionist', 'housekeeping', 'housekeeping_manager', 'food_staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const { data: user, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) return res.status(400).json({ error: authErr.message });

    const hotelId = hotel_id || (await supabase.from('hotels').select('id').limit(1)).data?.[0]?.id;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .insert({ id: user.user.id, hotel_id: hotelId, name, phone, role })
      .select()
      .single();

    if (profileErr) return res.status(500).json({ error: profileErr.message });

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile (name, phone, role, is_active)
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password for a staff member (admin only)
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const { error } = await supabase.auth.admin.updateUserById(req.params.id, { password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete profile + disable auth user
router.delete('/:id', async (req, res) => {
  try {
    await supabase.auth.admin.deleteUser(req.params.id);
    await supabase.from('profiles').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
