const crypto = require('node:crypto');
const config = require('../config/env');

const COOKIE_NAME = 'sg_session';
const sessions = new Map();

function signSessionId(sessionId) {
  return crypto
    .createHmac('sha256', config.sessionSecret)
    .update(sessionId)
    .digest('hex');
}

function parseCookies(cookieHeader = '') {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  }
  return cookies;
}

function verifySignedToken(token) {
  if (!token || !token.includes('.')) return null;
  const [sessionId, signature] = token.split('.');
  if (!sessionId || !signature) return null;

  const expectedSig = signSessionId(sessionId);
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  return sessionId;
}

/**
 * Creates an authenticated admin session and sets an HttpOnly SameSite cookie.
 */
function createSession(res, admin) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(sessionId, {
    adminId: admin.admin_id,
    username: admin.username,
    createdAt: now,
    lastActivity: now,
  });

  const signedValue = `${sessionId}.${signSessionId(sessionId)}`;
  res.cookie(COOKIE_NAME, signedValue, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: config.sessionTtlMs,
    secure: config.nodeEnv === 'production',
  });
  return sessionId;
}

function getActiveSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = verifySignedToken(cookies[COOKIE_NAME]);
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  const now = Date.now();
  if (now - session.lastActivity > config.sessionTtlMs) {
    sessions.delete(sessionId);
    return null;
  }

  session.lastActivity = now;
  return { sessionId, ...session };
}

function destroySession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = verifySignedToken(cookies[COOKIE_NAME]);
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/**
 * Middleware protecting administrative API routes (Appendix B.5).
 */
function requireAdmin(req, res, next) {
  const session = getActiveSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.adminSession = session;
  return next();
}

function clearAllSessions() {
  sessions.clear();
}

module.exports = {
  COOKIE_NAME,
  createSession,
  getActiveSession,
  destroySession,
  requireAdmin,
  clearAllSessions,
};
