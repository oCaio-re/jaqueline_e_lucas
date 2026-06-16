import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY environment variable is not configured.');
}

export const resend = new Resend(resendApiKey || 're_missing_key');
