const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Environment Variables Validation
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const PORT = process.env.PORT || 3000;

if (!APP_ID || !APP_CERTIFICATE) {
  console.error('Error: AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in environment variables.');
  process.exit(1);
}

// Middleware to prevent caching
const nocache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', appId: APP_ID });
});

// Endpoint to generate RTC token
app.post('/rtc', nocache, (req, res) => {
  try {
    const { channelName, uid, role } = req.body;

    // Input Validation
    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }
    if (typeof channelName !== 'string' || channelName.trim() === '') {
      return res.status(400).json({ error: 'channelName must be a non-empty string' });
    }
    if (uid !== undefined && (!Number.isInteger(uid) || uid < 0)) {
      return res.status(400).json({ error: 'uid must be a non-negative integer' });
    }
    if (role && !['publisher', 'subscriber'].includes(role)) {
      return res.status(400).json({ error: 'role must be either "publisher" or "subscriber"' });
    }

    const userId = uid !== undefined ? uid : 0; // Default to 0 if uid is not provided
    const userRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const tokenExpirationInSeconds = 3600; // 1 hour
    const privilegeExpirationInSeconds = 3600;

    // Log parameters for debugging
    console.log('Generating token with:');
    console.log('APP_ID:', APP_ID);
    console.log('APP_CERTIFICATE:', APP_CERTIFICATE);
    console.log('channelName:', channelName);
    console.log('userId:', userId);
    console.log('userRole:', userRole === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER');
    console.log('tokenExpirationInSeconds:', tokenExpirationInSeconds);
    console.log('privilegeExpirationInSeconds:', privilegeExpirationInSeconds);

    // Generate the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      userId,
      userRole,
      tokenExpirationInSeconds,
      privilegeExpirationInSeconds
    );

    // Log the generated token
    console.log('Generated token:', token);

    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
  console.log('Environment variables:');
  console.log('APP_ID:', APP_ID);
  console.log('APP_CERTIFICATE:', APP_CERTIFICATE);
});