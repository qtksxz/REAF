const { supabase } = require('./utils/supabase')

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id
  if (!id) {
    return { statusCode: 400, body: 'Missing script id' }
  }

  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return { statusCode: 404, body: 'Script not found' }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }
}
