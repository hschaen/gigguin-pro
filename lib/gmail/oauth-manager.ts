import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Service account credentials
const serviceAccount = {
  type: "service_account",
  project_id: "gigguin",
  private_key_id: "cbf3ef996e61335808dc8f0b9814c42ebf5cac74",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQDZEgfKwudfqZqO\nqs/kVMtTMiRZx60W+MDIGBrVvsAGWd9dEpcCbr+1eW+A8uensfK6LE29kjVlWQaR\nVC+n0FtvXMOkpBCe8FRcKjce3AJS01Wlds1qT6gfF8nbXUToyU7CCNdjxl1aV3J6\n8QnWP7F5yV3rnsUH5NJuzLsmtcAMR37K2E/4Z+Kg5QqiXP8LXLYVqShmoKcMV/ED\nY8+mjTo333NNc9U1NppY7ELNZMMcVWi12c552FcPQ/phD+7BDGe9zIhKoTyvA7Zj\nz6+ywREEu9bd66OVNidhXvlNm8SfgLZMJLrcarwIo8dBg8DNQHfrK6TRGPC+J5Me\n9fhpvHfLAgMBAAECgf8w7AY2px7KQrQlQdPU2NL2y5sUfZrrecAVVSDvpskdvEUk\nv2sph5dVExWyfNraY1XLAp6e/PcrkpAn7bpe1pam4ekEltPYsLDVPV79dbZRrAq/\neHR7Bbh0YHOdHLstTlTC8daJhJVetyN8YGIvcrUk3U0zGTC6gYhJSaJ98d0MfRO8\nXuEX0Hv1g99RbPMEF5HsNo9bgq4Olsu2mcooG1oPiirapzmrRoXRXSkvZ59n7HrE\nbEz9pGxy2jiqGxV+4hz+q+vHnnUHYi1Hl5zdzvs0ykCigUofi57ONRf1l09ahtgP\nYPJ7ABT0WFvAU4EDpfeiqLTF9W9eJoqLfH4BEDECgYEA7zG8J6TEX1oqRsHgjtPp\n5XVs5SdkOKQgPa92nu9Tv8xJ3Rcoa800JXFT2A6FWBEIVxybFIXuFT9QrfO0Fkgp\nHfLHSej1dqe3S5kUJyJtgw4nmJJdZU//kAooW3wkMHwa3ZX6nJB28ezvBMYZt81g\nruZshFBWN7nLOiVdMEldB8cCgYEA6FJde5zwTCk76T7KE+0PVcr/TsK/mdHpAgk/\nUq/pSKfT2wdDOdTdrmqjX90a3qorXaoMVRBxOyqeEqfiIhbt9XMVAkzSv0xtYO8R\nyGFCycg5j05A2tkKQeDh36oD6K/XmPgRc/1cBwTxNtLz6y8WbUaC+11AizqWN+a/\nYzQ3N90CgYAMfj2EmI+FJ3Fz1qaC70CVMofohCEw8Cma7zIz5O4r42CsQoxi7Qnf\nNscZTtDaI7Ga0yyqasBfrbnqDAOI8mXrYYXVL2y6sNHbCfjKfnrX0IJy7pogM4h2\nnoEzHg3J1oGUt0Oqr8T2p9hoGGy5c+mr2O8sDgIi0PpzZAY1Am/wewKBgCDg/z/u\nTwfIUiVJcJnvU9tFdmp0H1+qmHpkSqTuJmrU7aOy3G3D1XfIucRoa1QV6zs/RK2J\nPS0tc9+aCOPgMN8q4U9JBg5yx4wPaYndUfFyt8qzPXR7gPsf03eu/QyiTjXk7btn\noO2RYn3qzwB60oa2kvT2FptduELDElT838+1AoGAcmPKYwzfpa0OogBA5VBQovQM\nb4IGCzAy2Fo34o0yRKlWubWFIKpEFaEzQD9ntmQuKz+TLZDdHXE8ulwe0/veQ+Kt\nNBJFJE9qNoN6dbKCe0r42Vh/8xjuRYvSGwQjf/9qWcRYaRo3cm0nl9jCtSvipNHM\naMuw9x7w0NDDuz8lAAo=\n-----END PRIVATE KEY-----\n",
  client_email: "gigguin@gigguin.iam.gserviceaccount.com",
  client_id: "118054893667292721568",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/gigguin%40gigguin.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// OAuth2 configuration
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose'
];

const REDIRECT_URI = process.env.NEXTAUTH_URL 
  ? `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
  : 'http://localhost:3000/api/auth/gmail/callback';

export interface GmailToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GmailConnection {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Create OAuth2 client for Gmail
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

/**
 * Create service account client for Gmail
 */
export function createServiceAccountClient() {
  return new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES
  });
}

/**
 * Generate OAuth2 authorization URL
 */
export function generateAuthUrl(userId: string): string {
  const oauth2Client = createOAuth2Client();
  
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailToken> {
  const oauth2Client = createOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token) {
    throw new Error('Failed to get access token');
  }
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || '',
    scope: tokens.scope || SCOPES.join(' '),
    token_type: tokens.token_type || 'Bearer',
    expiry_date: tokens.expiry_date || 0
  };
}

/**
 * Save Gmail connection to Firestore
 */
export async function saveGmailConnection(
  userId: string,
  email: string,
  tokens: GmailToken
): Promise<void> {
  const connectionData: Omit<GmailConnection, 'id'> = {
    userId,
    email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  const connectionsRef = collection(db, 'gmail_connections');
  await setDoc(doc(connectionsRef, userId), connectionData);
}

/**
 * Get Gmail connection from Firestore
 */
export async function getGmailConnection(userId: string): Promise<GmailConnection | null> {
  const connectionsRef = collection(db, 'gmail_connections');
  const connectionDoc = await getDoc(doc(connectionsRef, userId));
  
  if (!connectionDoc.exists()) {
    return null;
  }
  
  return { id: connectionDoc.id, ...connectionDoc.data() } as unknown as GmailConnection;
}

/**
 * Update Gmail connection tokens
 */
export async function updateGmailTokens(
  userId: string,
  tokens: GmailToken
): Promise<void> {
  const connectionsRef = collection(db, 'gmail_connections');
  await updateDoc(doc(connectionsRef, userId), {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date,
    updatedAt: Date.now()
  });
}

/**
 * Revoke Gmail connection
 */
export async function revokeGmailConnection(userId: string): Promise<void> {
  const connectionsRef = collection(db, 'gmail_connections');
  await updateDoc(doc(connectionsRef, userId), {
    isActive: false,
    updatedAt: Date.now()
  });
}

/**
 * Check if Gmail connection is valid
 */
export function isTokenValid(connection: GmailConnection): boolean {
  return connection.isActive && connection.expiresAt > Date.now();
}

/**
 * Refresh Gmail access token
 */
export async function refreshGmailToken(connection: GmailConnection): Promise<GmailToken> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: connection.refreshToken
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }
  
  const tokens: GmailToken = {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || connection.refreshToken,
    scope: credentials.scope || SCOPES.join(' '),
    token_type: credentials.token_type || 'Bearer',
    expiry_date: credentials.expiry_date || 0
  };
  
  // Update the connection with new tokens
  await updateGmailTokens(connection.userId, tokens);
  
  return tokens;
} 