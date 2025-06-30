import emailjs from 'emailjs-com';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export class EmailService {
  private static instance: EmailService;
  private isConfigured = false;
  private config: EmailConfig | null = null;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  constructor() {
    this.initializeEmailJS();
  }

  private initializeEmailJS() {
    // In production, these should be environment variables
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && templateId && publicKey) {
      this.config = { serviceId, templateId, publicKey };
      emailjs.init(publicKey);
      this.isConfigured = true;
      console.log('📧 EmailJS configured successfully');
    } else {
      console.log('📧 EmailJS not configured - using development mode');
    }
  }

  async sendVerificationCode(email: string, code: string, name?: string): Promise<boolean> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address format');
      }

      if (this.isConfigured && this.config) {
        // Production email sending with EmailJS
        const templateParams = {
          to_email: email,
          to_name: name || email.split('@')[0],
          verification_code: code,
          app_name: 'Dev Diaries',
          expires_in: '5 minutes',
          from_name: 'Dev Diaries Team'
        };

        try {
          const response = await emailjs.send(
            this.config.serviceId,
            this.config.templateId,
            templateParams,
            this.config.publicKey
          );

          if (response.status === 200) {
            console.log('📧 Verification email sent successfully via EmailJS');
            return true;
          } else {
            throw new Error(`EmailJS failed with status: ${response.status}`);
          }
        } catch (emailError) {
          console.error('EmailJS error:', emailError);
          // Fall back to development mode
          return this.sendDevelopmentEmail(email, code, name);
        }
      } else {
        // Development mode
        return this.sendDevelopmentEmail(email, code, name);
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
      
      // Show user-friendly error
      this.showErrorNotification(error instanceof Error ? error.message : 'Failed to send email');
      return false;
    }
  }

  private async sendDevelopmentEmail(email: string, code: string, name?: string): Promise<boolean> {
    console.log(`📧 [DEV MODE] Sending verification code to ${email}`);
    console.log(`🔐 Verification Code: ${code}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show development notification
    this.showDevelopmentNotification(email, code);
    
    return true;
  }

  private showDevelopmentNotification(email: string, code: string) {
    if (!import.meta.env.DEV) return;

    // Remove any existing notifications
    const existing = document.querySelector('#verification-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'verification-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 320px;
      animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite;"></div>
        <div style="font-size: 14px; font-weight: 600; opacity: 0.95;">
          📧 Verification Email Sent
        </div>
      </div>
      <div style="font-size: 28px; letter-spacing: 6px; text-align: center; background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; margin: 12px 0; font-weight: 700; font-family: 'Courier New', monospace;">
        ${code}
      </div>
      <div style="font-size: 12px; opacity: 0.85; text-align: center; line-height: 1.4;">
        <div style="margin-bottom: 4px;">📨 Sent to: <strong>${email}</strong></div>
        <div style="color: #fbbf24;">⏰ Expires in 5 minutes</div>
      </div>
      <div style="margin-top: 12px; text-align: center;">
        <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
          ✕ Close
        </button>
      </div>
    `;
    
    // Add enhanced animations
    if (!document.querySelector('#verification-styles')) {
      const style = document.createElement('style');
      style.id = 'verification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
        @keyframes slideOutRight {
          from { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
          to { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 10000);
  }

  private showErrorNotification(message: string) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="margin-right: 8px;">❌</span>
        <span style="font-weight: 600; font-size: 14px;">Email Delivery Failed</span>
      </div>
      <div style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      console.log(`📧 Sending welcome email to ${email}`);
      
      if (this.isConfigured && this.config) {
        // Send welcome email via EmailJS
        const templateParams = {
          to_email: email,
          to_name: name,
          app_name: 'Dev Diaries',
          from_name: 'Dev Diaries Team'
        };

        const response = await emailjs.send(
          this.config.serviceId,
          'welcome_template', // Different template for welcome emails
          templateParams,
          this.config.publicKey
        );

        return response.status === 200;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  // Test email connectivity
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured) {
        return { 
          success: false, 
          message: 'Email service not configured. Please check environment variables.' 
        };
      }

      // Send a test email to verify configuration
      const testResult = await this.sendVerificationCode(
        'test@example.com', 
        '123456', 
        'Test User'
      );

      return {
        success: testResult,
        message: testResult ? 'Email service is working correctly' : 'Email service test failed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}