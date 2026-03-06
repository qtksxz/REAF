const { supabase } = require('./utils/supabase')

exports.handler = async () => {
  const { data, error } = await supabase
    .from('scripts')
    .select('id, title, created_at, user_email')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return { statusCode: 500, body: 'Failed to fetch scripts' }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }
}
