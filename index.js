const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors'); // Add this line
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors()); // Add this line to enable CORS

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const PORT = process.env.PORT || 3000;

// Middleware to prevent caching
const nocache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

// Endpoint to generate RTC token
app.post('/rtc', nocache, (req, res) => {
  try {
    const { channelName, uid, role } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }

    const userId = uid || 0; // 0 lets Agora assign a UID
    const userRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const tokenExpirationInSeconds = 3600; // Token valid for 1 hour
    const privilegeExpirationInSeconds = 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      userId,
      userRole,
      tokenExpirationInSeconds,
      privilegeExpirationInSeconds
    );

    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Token server running on port ${PORT}`);
});