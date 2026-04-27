const { google } = require('googleapis');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const getOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
    );
};

const loadTokenFromDB = async (dbQuery) => {
    try {
        const res = await dbQuery("SELECT token_data FROM gmail_tokens WHERE id = 1");
        if (res.rows.length > 0) {
            return res.rows[0].token_data;
        }
    } catch (err) {
        console.error('DB Load Error:', err.message);
    }
    return null;
};

const saveTokenToDB = async (dbQuery, token) => {
    try {
        await dbQuery(`
            INSERT INTO gmail_tokens (id, token_data, updated_at) 
            VALUES (1, $1, NOW()) 
            ON CONFLICT (id) DO UPDATE SET token_data = $1, updated_at = NOW()
        `, [token]);
    } catch (err) {
        console.error('DB Save Error:', err.message);
    }
};

const parseFrom = (from) => {
    if (!from) return { name: 'Unknown', email: '' };
    const match = from.match(/^(.*?)\s*<(.+)>$/);
    if (match) {
        return {
            name: match[1].trim().replace(/"/g, '') || match[2],
            email: match[2]
        };
    }
    return { name: from, email: from };
};

const registerGmailRoutes = (app, dbQuery) => {

    app.get('/auth/gmail', (req, res) => {
        const oauth2Client = getOAuthClient();
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/contacts.readonly'
            ],
            prompt: 'consent'
        });
        res.redirect(url);
    });

    app.get('/auth/gmail/callback', async (req, res) => {
        const { code } = req.query;
        try {
            const oauth2Client = getOAuthClient();
            const { tokens } = await oauth2Client.getToken(code);
            await saveTokenToDB(dbQuery, tokens);
            res.send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#111;color:white">
                    <h2>✅ Gmail connected successfully!</h2>
                    <p>Token saved to database. you can close this tab.</p>
                    <script>setTimeout(() => window.close(), 2000)</script>
                </body></html>
            `);
        } catch (err) {
            res.status(500).send('Failed to authenticate Gmail.');
        }
    });

    app.get('/api/gmail/status', async (req, res) => {
        const token = await loadTokenFromDB(dbQuery);
        res.json({ connected: !!token });
    });

    app.get('/api/gmail/messages', async (req, res) => {
        const token = await loadTokenFromDB(dbQuery);
        if (!token) return res.status(401).json({ error: 'Gmail not connected.' });

        try {
            const oauth2Client = getOAuthClient();
            oauth2Client.setCredentials(token);

            oauth2Client.on('tokens', async (newTokens) => {
                await saveTokenToDB(dbQuery, { ...token, ...newTokens });
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const listRes = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 20,
                labelIds: ['INBOX']
            });

            const messages = listRes.data.messages || [];
            const detailed = await Promise.all(
                messages.map(async (msg) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'Subject', 'Date']
                    });

                    const headers = detail.data.payload.headers;
                    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
                    const { name, email } = parseFrom(getHeader('From'));

                    return {
                        id: msg.id,
                        senderName: name,
                        senderEmail: email,
                        senderAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=40&bold=true`,
                        subject: getHeader('Subject') || '(no subject)',
                        date: getHeader('Date'),
                        snippet: detail.data.snippet,
                        isUnread: detail.data.labelIds?.includes('UNREAD')
                    };
                })
            );
            res.json(detailed);
        } catch (err) {
            if (err.message.includes('invalid_grant')) {
                await dbQuery("DELETE FROM gmail_tokens");
            }
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/gmail/sent', async (req, res) => {
        const token = await loadTokenFromDB(dbQuery);
        if (!token) return res.status(401).json({ error: 'Gmail not connected.' });

        try {
            const oauth2Client = getOAuthClient();
            oauth2Client.setCredentials(token);
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const listRes = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 15,
                labelIds: ['SENT']
            });

            const messages = listRes.data.messages || [];
            const detailed = await Promise.all(
                messages.map(async (msg) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['To', 'Subject', 'Date']
                    });
                    const headers = detail.data.payload.headers;
                    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

                    return {
                        id: msg.id,
                        senderName: getHeader('To'),
                        subject: getHeader('Subject') || '(no subject)',
                        date: getHeader('Date'),
                        snippet: detail.data.snippet
                    };
                })
            );
            res.json(detailed);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/gmail/send', upload.array('attachments'), async (req, res) => {
        const { to, subject, body } = req.body || {};
        if (!to || !subject || !body) return res.status(400).json({ error: 'Missing fields' });

        const token = await loadTokenFromDB(dbQuery);
        if (!token) return res.status(401).json({ error: 'Gmail not connected.' });

        try {
            const oauth2Client = getOAuthClient();
            oauth2Client.setCredentials(token);
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            const boundary = `boundary_${Date.now()}`;
            const files = req.files || [];
            const htmlBody = body.includes('<br') ? body : body.replace(/\r\n|\n/g, '<br>');
            const bodyB64 = Buffer.from(htmlBody, 'utf-8').toString('base64');

            let rawEmail;
            if (files.length === 0) {
                rawEmail = [
                    `To: ${to}`,
                    'MIME-Version: 1.0',
                    'Content-Type: text/html; charset=utf-8',
                    'Content-Transfer-Encoding: base64',
                    `Subject: ${subject}`,
                    '',
                    bodyB64
                ].join('\r\n');
            } else {
                const parts = [
                    `To: ${to}`,
                    'MIME-Version: 1.0',
                    `Content-Type: multipart/mixed; boundary="${boundary}"`,
                    `Subject: ${subject}`,
                    '',
                    `--${boundary}`,
                    'Content-Type: text/html; charset=utf-8',
                    'Content-Transfer-Encoding: base64',
                    '',
                    bodyB64,
                ];
                for (const file of files) {
                    parts.push(`--${boundary}`);
                    parts.push(`Content-Type: ${file.mimetype}`);
                    parts.push('Content-Transfer-Encoding: base64');
                    parts.push(`Content-Disposition: attachment; filename="${file.originalname}"`);
                    parts.push('');
                    parts.push(file.buffer.toString('base64'));
                }
                parts.push(`--${boundary}--`);
                rawEmail = parts.join('\r\n');
            }

            const encoded = Buffer.from(rawEmail)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to send email.' });
        }
    });
};

module.exports = { registerGmailRoutes };