// Mock email service - In production, integrate with SendGrid, AWS SES, etc.
export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendVerificationCode(email: string, code: string, name?: string): Promise<boolean> {
    try {
      // In production, replace this with actual email service
      console.log(`📧 Sending verification code to ${email}`);
      console.log(`🔐 Verification Code: ${code}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For development, show the code in a more visible way
      if (import.meta.env.DEV) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 600;
          max-width: 300px;
          animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
          <div style="margin-bottom: 8px; font-size: 14px; opacity: 0.9;">
            📧 Verification Code Sent
          </div>
          <div style="font-size: 24px; letter-spacing: 4px; text-align: center; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 6px;">
            ${code}
          </div>
          <div style="margin-top: 8px; font-size: 12px; opacity: 0.8; text-align: center;">
            Code sent to ${email}
          </div>
        `;
        
        // Add animation keyframes
        if (!document.querySelector('#verification-styles')) {
          const style = document.createElement('style');
          style.id = 'verification-styles';
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 8 seconds
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-in forwards';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 8000);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      console.log(`📧 Sending welcome email to ${email}`);
      // Implement welcome email logic
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }
}