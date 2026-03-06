const { supabase } = require('./utils/supabase')

exports.handler = async (event) => {
  // Optionally restrict to owner only
  const claims = event.context?.clientContext?.user
  if (!claims || claims.email !== process.env.OWNER_EMAIL) {
    return { statusCode: 403, body: 'Forbidden' }
  }

  const { data, error } = await supabase
    .from('whitelist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return { statusCode: 500, body: 'Failed to fetch whitelist' }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }
}
