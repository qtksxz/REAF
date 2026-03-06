const { supabase } = require('./utils/supabase');

async function isManager(email) {
  if (email === process.env.OWNER_EMAIL) return true;
  const { data } = await supabase.from('admins').select('email').eq('email', email).maybeSingle();
  return !!data;
}

exports.handler = async (event) => {
  const claims = event.context?.clientContext?.user;
  if (!claims || !await isManager(claims.email)) return { statusCode: 403, body: 'Forbidden' };

  const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return { statusCode: 500, body: 'Failed to fetch managers' };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
};
