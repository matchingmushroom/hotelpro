const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

router.post('/register', async (req, res) => {
  try {
    const { hotel_name, hotel_email, hotel_phone, hotel_address, currency, admin_name, admin_email, admin_password } = req.body;

    if (!hotel_name || !admin_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'hotel_name, admin_name, admin_email, and admin_password are required' });
    }

    // 1. Create hotel
    const { data: hotel, error: hotelErr } = await supabase
      .from('hotels')
      .insert({
        name: hotel_name,
        email: hotel_email || null,
        phone: hotel_phone || null,
        address: hotel_address || null,
        currency: currency || 'NPR',
      })
      .select()
      .single();

    if (hotelErr) return res.status(400).json({ error: 'Failed to create hotel: ' + hotelErr.message });

    // 2. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { name: admin_name, role: 'admin' },
    });

    if (authErr) {
      await supabase.from('hotels').delete().eq('id', hotel.id);
      return res.status(400).json({ error: 'Failed to create admin user: ' + authErr.message });
    }

    // 3. Create admin profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        hotel_id: hotel.id,
        name: admin_name,
        role: 'admin',
        phone: req.body.admin_phone || null,
      });

    if (profileErr) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('hotels').delete().eq('id', hotel.id);
      return res.status(400).json({ error: 'Failed to create profile: ' + profileErr.message });
    }

    res.json({
      success: true,
      hotel_id: hotel.id,
      message: 'Hotel registered successfully. You can now log in.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check', async (req, res) => {
  try {
    const { data, error } = await supabase.from('hotels').select('id, name').limit(10);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ hotels: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
