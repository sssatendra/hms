// /backend-core/src/services/sms.ts
import twilio from 'twilio';
import { config } from '../config';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export async function sendSMS(to: string, message: string) {
  try {
    await client.messages.create({
      body: message,
      from: config.twilio.fromNumber,
      to: to
    });
    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error };
  }
}

export async function sendWhatsApp(to: string, message: string) {
  try {
    await client.messages.create({
      body: message,
      from: `whatsapp:${config.twilio.whatsappNumber}`,
      to: `whatsapp:${to}`
    });
    return { success: true };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error };
  }
}