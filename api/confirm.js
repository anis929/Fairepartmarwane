const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non autorisee' });

  const { prenom, nom, telephone, nb_invites } = req.body;

  if (!prenom || !nom || !telephone || !nb_invites) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error: dbError } = await supabase
      .from('confirmations')
      .insert([{ prenom, nom, telephone, nb_invites, confirme_le: new Date().toISOString() }]);

    if (dbError) throw new Error('Supabase: ' + dbError.message);

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const notifBody = '🌹 Nouvelle confirmation — Mariage Marwane & Imane\n\n👤 ' + prenom + ' ' + nom + '\n📱 ' + telephone + '\n👥 ' + nb_invites + ' invite(s)\n\nبِإِذْنِ اللهِ';

    await client.messages.create({
      body: notifBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: '+33760056747'
    });

    await client.messages.create({
      body: notifBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: '+33768479429'
    });

    await client.messages.create({
      body: 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ\n\nAssalamou Alaykoum ' + prenom + ',\n\nVotre presence au Mariage de Marwane & Imane a bien ete confirmee. Nous sommes heureux de vous compter parmi nous. 🌹\n\n📅 Samedi 1er Aout 2026\n📍 1 chemin des vignes, Saint Victor la Coste 30290\n\nبَارَكَ اللهُ فِيكُمْ',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telephone
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Erreur confirmation:', err);
    return res.status(500).json({ error: 'Erreur serveur, reessayez.' });
  }
};
