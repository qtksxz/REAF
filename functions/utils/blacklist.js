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

  const { action, email } = body
  if (!action || !email || !['add', 'remove'].includes(action)) {
    return { statusCode: 400, body: 'action (add/remove) and email required' }
  }

  if (action === 'add') {
    const { error } = await supabase
      .from('blacklist')
      .insert([{ email }])
    if (error) {
      if (error.code === '23505') {
        return { statusCode: 409, body: 'Email already blacklisted' }
      }
      console.error(error)
      return { statusCode: 500, body: 'Database error' }
    }
    return { statusCode: 200, body: 'Added to blacklist' }
  } else {
    const { error } = await supabase
      .from('blacklist')
      .delete()
      .eq('email', email)
    if (error) {
      console.error(error)
      return { statusCode: 500, body: 'Database error' }
    }
    return { statusCode: 200, body: 'Removed from blacklist' }
  }
}
