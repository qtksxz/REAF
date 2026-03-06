const { supabase } = require('./utils/supabase')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const claims = event.context?.clientContext?.user
  if (!claims) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  const userEmail = claims.email
  if (!userEmail) {
    return { statusCode: 400, body: 'Email not found in user claims' }
  }

  // Check blacklist
  const { data: blacklisted } = await supabase
    .from('blacklist')
    .select('email')
    .eq('email', userEmail)
    .maybeSingle()
  if (blacklisted) {
    return { statusCode: 403, body: 'You are blacklisted from uploading.' }
  }

  // Check if whitelist has any entries
  const { count, error: countError } = await supabase
    .from('whitelist')
    .select('*', { count: 'exact', head: true })
  if (countError) {
    console.error(countError)
    return { statusCode: 500, body: 'Internal server error' }
  }

  if (count > 0) {
    const { data: whitelisted } = await supabase
      .from('whitelist')
      .select('email')
      .eq('email', userEmail)
      .maybeSingle()
    if (!whitelisted) {
      return { statusCode: 403, body: 'You are not whitelisted to upload.' }
    }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { title, content } = body
  if (!title || !content) {
    return { statusCode: 400, body: 'Title and content are required' }
  }

  const { data, error } = await supabase
    .from('scripts')
    .insert([{ title, content, user_email: userEmail }])
    .select()

  if (error) {
    console.error(error)
    return { statusCode: 500, body: 'Failed to save script' }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data[0])
  }
}
