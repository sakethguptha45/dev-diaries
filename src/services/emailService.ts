// Email service for sending verification codes
// This uses a simple email API that works in development

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Generate a secure 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email using a reliable email service
export const sendVerificationEmail = async (
  email: string, 
  code: string, 
  userName?: string
): Promise<EmailResponse> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email address format'
      };
    }

    // Create email content
    const emailContent = {
      to: email,
      subject: 'Dev Diaries - Email Verification Code',
      html: createEmailTemplate(code, userName || 'User'),
      text: createTextEmail(code, userName || 'User')
    };

    // For development, we'll use a mock email service
    // In production, replace this with your preferred email service
    const response = await sendEmailViaMockService(emailContent);
    
    if (response.success) {
      console.log(`✅ Verification email sent to ${email} with code: ${code}`);
      return {
        success: true,
        message: 'Verification code sent to your email address'
      };
    } else {
      throw new Error(response.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: 'Failed to send verification email. Please try again.'
    };
  }
};

// Mock email service for development (replace with real service in production)
const sendEmailViaMockService = async (emailData: any): Promise<EmailResponse> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log email details for development
    console.log('📧 EMAIL SENT:', {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString()
    });
    
    console.log('📧 EMAIL CONTENT:');
    console.log(emailData.text);
    
    // Simulate successful email delivery
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Create HTML email template
const createEmailTemplate = (code: string, userName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Dev Diaries</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #374151;
        }
        .code-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: white;
          font-family: 'Courier New', monospace;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .code-label {
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          margin-top: 10px;
          font-weight: 500;
        }
        .instructions {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .instructions h3 {
          margin: 0 0 15px 0;
          color: #1e293b;
          font-size: 16px;
        }
        .instructions ul {
          margin: 0;
          padding-left: 20px;
          color: #475569;
        }
        .instructions li {
          margin-bottom: 8px;
        }
        .warning {
          background: #fef3cd;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
        .footer {
          background: #f8fafc;
          padding: 25px 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
        .timer {
          display: inline-flex;
          align-items: center;
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 20px;
          margin-top: 10px;
          font-size: 14px;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding-left: 20px;
            padding-right: 20px;
          }
          .code {
            font-size: 28px;
            letter-spacing: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Email Verification</h1>
          <p>Dev Diaries - Secure Your Account</p>
          <div class="timer">⏰ Expires in 5 minutes</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${userName}! 👋
          </div>
          
          <p>Thank you for signing up for <strong>Dev Diaries</strong>. To complete your registration and secure your account, please use the verification code below:</p>
          
          <div class="code-container">
            <div class="code">${code}</div>
            <div class="code-label">Your Verification Code</div>
          </div>
          
          <div class="instructions">
            <h3>📋 How to verify:</h3>
            <ul>
              <li>Copy the 6-digit code above</li>
              <li>Return to the Dev Diaries verification page</li>
              <li>Paste or type the code in the input fields</li>
              <li>Click "Verify Email" to complete setup</li>
            </ul>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Information:</strong><br>
            • This code expires in <strong>5 minutes</strong><br>
            • Never share this code with anyone<br>
            • If you didn't request this, please ignore this email
          </div>
          
          <p>If you're having trouble, you can request a new verification code from the verification page.</p>
        </div>
        
        <div class="footer">
          <p><strong>Dev Diaries</strong> - Your Personal Knowledge Management System</p>
          <p>This is an automated security email. Please do not reply.</p>
          <p>© 2024 Dev Diaries. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Create plain text email for email clients that don't support HTML
const createTextEmail = (code: string, userName: string): string => {
  return `
Dev Diaries - Email Verification

Hello ${userName}!

Thank you for signing up for Dev Diaries. To complete your registration, please use this verification code:

VERIFICATION CODE: ${code}

Instructions:
1. Copy the 6-digit code above
2. Return to the Dev Diaries verification page
3. Enter the code in the input fields
4. Click "Verify Email" to complete setup

IMPORTANT:
- This code expires in 5 minutes
- Never share this code with anyone
- If you didn't request this, please ignore this email

If you're having trouble, you can request a new verification code from the verification page.

---
Dev Diaries - Your Personal Knowledge Management System
This is an automated security email. Please do not reply.
© 2024 Dev Diaries. All rights reserved.
  `;
};

// Production email service integration examples:

// Example 1: Using Resend (recommended)
export const sendEmailWithResend = async (email: string, code: string): Promise<EmailResponse> => {
  try {
    // Uncomment and configure for production:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'Dev Diaries <noreply@devdiaries.com>',
      to: [email],
      subject: 'Dev Diaries - Email Verification Code',
      html: createEmailTemplate(code, 'User'),
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: 'Email sent successfully' };
    */
    
    // For now, use mock service
    return sendEmailViaMockService({
      to: email,
      subject: 'Dev Diaries - Email Verification Code',
      html: createEmailTemplate(code, 'User')
    });
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to send email via Resend' 
    };
  }
};

// Example 2: Using SendGrid
export const sendEmailWithSendGrid = async (email: string, code: string): Promise<EmailResponse> => {
  try {
    // Uncomment and configure for production:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: 'noreply@devdiaries.com',
      subject: 'Dev Diaries - Email Verification Code',
      html: createEmailTemplate(code, 'User'),
    };

    await sgMail.send(msg);
    return { success: true, message: 'Email sent successfully' };
    */
    
    // For now, use mock service
    return sendEmailViaMockService({
      to: email,
      subject: 'Dev Diaries - Email Verification Code',
      html: createEmailTemplate(code, 'User')
    });
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to send email via SendGrid' 
    };
  }
};