const { supabase } = require('./utils/supabase');

async function isManager(email) {
  if (email === process.env.OWNER_EMAIL) return true;
  const { data } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return !!data;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const claims = event.context?.clientContext?.user;
  if (!claims) return { statusCode: 401, body: 'Unauthorized' };
  if (!await isManager(claims.email)) return { statusCode: 403, body: 'Forbidden' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { action, email } = body;
  if (!action || !email || !['add', 'remove'].includes(action))
    return { statusCode: 400, body: 'action (add/remove) and email required' };

  if (action === 'add') {
    const { error } = await supabase.from('whitelist').insert([{ email }]);
    if (error) {
      if (error.code === '23505') return { statusCode: 409, body: 'Email already whitelisted' };
      console.error(error);
      return { statusCode: 500, body: 'Database error' };
    }
    return { statusCode: 200, body: 'Added to whitelist' };
  } else {
    const { error } = await supabase.from('whitelist').delete().eq('email', email);
    if (error) {
      console.error(error);
      return { statusCode: 500, body: 'Database error' };
    }
    return { statusCode: 200, body: 'Removed from whitelist' };
  }
};
