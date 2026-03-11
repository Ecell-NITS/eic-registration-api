/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import * as Brevo from '@getbrevo/brevo';

if (!process.env.BREVO_API_KEY || !process.env.BREVO_EMAIL) {
  throw new Error('Brevo credentials are missing in environment variables');
}

// Initialize Brevo client
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

/**
 * Send an email using Brevo's transactional API.
 */
const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  try {
    const sendSmtpEmail: Brevo.SendSmtpEmail = {
      sender: { name: 'ECELL NIT Silchar', email: process.env.BREVO_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully:', response.body.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending email:', error?.response?.body || error);
    return false;
  }
};

export default sendEmail;
