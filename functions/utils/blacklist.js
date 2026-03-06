const { supabase } = require('./utils/supabase');

async function isManager(email) {
  if (email === process.env.OWNER_EMAIL) return true;
  const { data } = await supabase.from('admins').select('email').eq('email', email).maybeSingle();
  return !!data;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const claims = event.context?.clientContext?.user;
  if (!claims) return { statusCode: 401, body: 'Unauthorized' };
  if (!await isManager(claims.email)) return { statusCode: 403, body: 'Forbidden' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { id } = body;
  if (!id) return { statusCode: 400, body: 'Script ID required' };

  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) {
    console.error(error);
    return { statusCode: 500, body: 'Failed to delete script' };
  }
  return { statusCode: 200, body: 'Script deleted' };
};
