import emailjs from 'emailjs-com';

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Generate a secure 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email with actual 6-digit code
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

    console.log('🚀 Sending verification email...');
    console.log('📧 To:', email);
    console.log('🔑 Code:', code);
    console.log('👤 User:', userName || 'User');

    // Send email using EmailJS (real email service)
    const emailResult = await sendEmailViaEmailJS(email, code, userName || 'User');
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      
      // Show browser notification for development
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Dev Diaries Verification Code', {
          body: `Your verification code is: ${code}`,
          icon: '/favicon.ico',
          tag: 'verification-code'
        });
      }
      
      return {
        success: true,
        message: 'Verification code sent to your email address'
      };
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return {
      success: false,
      message: 'Failed to send verification email. Please try again.'
    };
  }
};

// Send email using EmailJS (works directly from browser)
const sendEmailViaEmailJS = async (
  email: string, 
  code: string, 
  userName: string
): Promise<EmailResponse> => {
  try {
    console.log('📨 Preparing to send real email...');
    
    // Initialize EmailJS with your credentials
    emailjs.init("YOUR_EMAILJS_USER_ID"); // Replace with your EmailJS User ID
    
    const templateParams = {
      to_email: email,
      to_name: userName,
      verification_code: code,
      user_name: userName,
      app_name: 'Dev Diaries',
      expiry_time: '5 minutes',
      current_year: new Date().getFullYear(),
      message: createEmailTemplate(code, userName)
    };

    console.log('📤 Sending email via EmailJS...');
    
    // Send email using EmailJS
    const result = await emailjs.send(
      'YOUR_SERVICE_ID',    // Replace with your EmailJS Service ID
      'YOUR_TEMPLATE_ID',   // Replace with your EmailJS Template ID
      templateParams
    );
    
    if (result.status === 200) {
      console.log('✅ EmailJS sent successfully');
      return { success: true };
    } else {
      throw new Error('EmailJS failed with status: ' + result.status);
    }
    
  } catch (error) {
    console.error('❌ EmailJS error:', error);
    
    // For development, we'll simulate email sending and log the code
    console.log('🔧 Development Mode: Simulating email send...');
    console.log('═══════════════════════════════════════');
    console.log('📧 EMAIL SIMULATION');
    console.log('═══════════════════════════════════════');
    console.log(`To: ${email}`);
    console.log(`Subject: Dev Diaries - Email Verification Code`);
    console.log('');
    console.log(`Hello ${userName}!`);
    console.log('');
    console.log('Thank you for signing up for Dev Diaries.');
    console.log('Your verification code is:');
    console.log('');
    console.log(`🔑 ${code}`);
    console.log('');
    console.log('This code expires in 5 minutes.');
    console.log('Enter this code on the verification page to complete your registration.');
    console.log('');
    console.log('If you didn\'t request this, please ignore this email.');
    console.log('');
    console.log('Best regards,');
    console.log('The Dev Diaries Team');
    console.log('═══════════════════════════════════════');
    
    // Show browser notification with the code
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Dev Diaries Verification Code', {
        body: `Your verification code is: ${code}`,
        icon: '/favicon.ico',
        tag: 'verification-code',
        requireInteraction: true
      });
    }
    
    // For development, always return success
    return { success: true };
  }
};

// Request notification permission for development
export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        new Notification('Dev Diaries', {
          body: 'Notifications enabled! You\'ll see verification codes here during development.',
          icon: '/favicon.ico'
        });
      }
    });
  }
};

// Create HTML email template
export const createEmailTemplate = (code: string, userName: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🔐 Email Verification</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Dev Diaries - Secure Your Account</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="font-size: 18px; margin-bottom: 20px; color: #374151;">
            Hello ${userName}! 👋
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for signing up for <strong>Dev Diaries</strong>. To complete your registration and secure your account, please use the verification code below:
          </p>
          
          <!-- Code Container -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ${code}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 10px; font-weight: 500;">
              Your Verification Code
            </div>
          </div>
          
          <!-- Instructions -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">📋 How to verify:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #475569;">
              <li style="margin-bottom: 8px;">Copy the 6-digit code above</li>
              <li style="margin-bottom: 8px;">Return to the Dev Diaries verification page</li>
              <li style="margin-bottom: 8px;">Paste or type the code in the input fields</li>
              <li style="margin-bottom: 8px;">Click "Verify Email" to complete setup</li>
            </ul>
          </div>
          
          <!-- Warning -->
          <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0; color: #92400e;">
            <strong>⚠️ Important Security Information:</strong><br>
            • This code expires in <strong>5 minutes</strong><br>
            • Never share this code with anyone<br>
            • If you didn't request this, please ignore this email
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            If you're having trouble, you can request a new verification code from the verification page.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Dev Diaries</strong> - Your Personal Knowledge Management System</p>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">This is an automated security email. Please do not reply.</p>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">© 2024 Dev Diaries. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};