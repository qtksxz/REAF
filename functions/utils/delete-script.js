const { supabase } = require('./utils/supabase')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const claims = event.context?.clientContext?.user
  if (!claims || claims.email !== process.env.OWNER_EMAIL) {
    return { statusCode: 403, body: 'Forbidden' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { id } = body
  if (!id) {
    return { statusCode: 400, body: 'Script ID required' }
  }

  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    return { statusCode: 500, body: 'Failed to delete script' }
  }

  return { statusCode: 200, body: 'Script deleted' }
}
