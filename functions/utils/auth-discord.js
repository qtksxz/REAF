// netlify/functions/auth-discord/auth-discord.js
exports.handler = async (event) => {
  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing code' }),
    };
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://lua-file-uploader.netlify.app/.netlify/functions/auth-discord',
        scope: 'identify email',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Fetch user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userResponse.json();

    // Return user data as JSON (you could also set a cookie here)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Set a cookie for session (optional, more secure)
        'Set-Cookie': `discord_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; Secure; SameSite=Strict`,
      },
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
