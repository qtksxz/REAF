const https = require('https');

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
    const tokenData = await new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://lua-file-uploader.netlify.app/.netlify/functions/auth-discord',
        scope: 'identify email',
      });

      const options = {
        hostname: 'discord.com',
        path: '/api/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Discord token error: ${res.statusCode} ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });

    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    // Fetch user info
    const user = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'discord.com',
        path: '/api/users/@me',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      };

      const req = https.get(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Discord user error: ${res.statusCode} ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
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
