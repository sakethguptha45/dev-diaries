import crypto from 'crypto';

export interface VerificationAttempt {
  timestamp: Date;
  ip?: string;
  success: boolean;
}

export interface VerificationSession {
  email: string;
  code: string;
  hashedCode: string;
  expiresAt: Date;
  attempts: VerificationAttempt[];
  createdAt: Date;
  isLocked: boolean;
  lockUntil?: Date;
}

class VerificationManager {
  private sessions = new Map<string, VerificationSession>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_EXPIRY_MINUTES = 5;
  private readonly LOCK_DURATION_MINUTES = 15;
  private readonly RESEND_COOLDOWN_MINUTES = 1;
  private readonly RATE_LIMIT_WINDOW_MINUTES = 10;
  private readonly MAX_REQUESTS_PER_WINDOW = 5;

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  createSession(email: string): { code: string; session: VerificationSession } {
    const code = this.generateCode();
    const hashedCode = this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

    const session: VerificationSession = {
      email,
      code,
      hashedCode,
      expiresAt,
      attempts: [],
      createdAt: new Date(),
      isLocked: false,
    };

    this.sessions.set(email, session);
    return { code, session };
  }

  getSession(email: string): VerificationSession | null {
    return this.sessions.get(email) || null;
  }

  isSessionExpired(session: VerificationSession): boolean {
    return new Date() > session.expiresAt;
  }

  isSessionLocked(session: VerificationSession): boolean {
    if (!session.isLocked || !session.lockUntil) return false;
    
    if (new Date() > session.lockUntil) {
      // Unlock the session
      session.isLocked = false;
      session.lockUntil = undefined;
      session.attempts = [];
      return false;
    }
    
    return true;
  }

  canResendCode(session: VerificationSession): boolean {
    if (this.isSessionLocked(session)) return false;
    
    const lastAttempt = session.attempts[session.attempts.length - 1];
    if (!lastAttempt) return true;
    
    const cooldownEnd = new Date(lastAttempt.timestamp.getTime() + this.RESEND_COOLDOWN_MINUTES * 60 * 1000);
    return new Date() > cooldownEnd;
  }

  checkRateLimit(email: string): boolean {
    const session = this.getSession(email);
    if (!session) return true;

    const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    const recentAttempts = session.attempts.filter(attempt => attempt.timestamp > windowStart);
    
    return recentAttempts.length < this.MAX_REQUESTS_PER_WINDOW;
  }

  verifyCode(email: string, inputCode: string, ip?: string): { 
    success: boolean; 
    message: string; 
    attemptsRemaining?: number;
    isLocked?: boolean;
    lockUntil?: Date;
  } {
    const session = this.getSession(email);
    
    if (!session) {
      return { success: false, message: 'No verification session found. Please request a new code.' };
    }

    if (this.isSessionExpired(session)) {
      this.sessions.delete(email);
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (this.isSessionLocked(session)) {
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again after ${session.lockUntil?.toLocaleTimeString()}.`,
        isLocked: true,
        lockUntil: session.lockUntil
      };
    }

    // Check rate limiting
    if (!this.checkRateLimit(email)) {
      return { success: false, message: 'Too many attempts. Please try again later.' };
    }

    const hashedInput = this.hashCode(inputCode);
    const isValid = hashedInput === session.hashedCode;

    // Record the attempt
    const attempt: VerificationAttempt = {
      timestamp: new Date(),
      ip,
      success: isValid,
    };
    session.attempts.push(attempt);

    if (isValid) {
      // Success - clean up session
      this.sessions.delete(email);
      return { success: true, message: 'Email verified successfully!' };
    }

    // Failed attempt
    const failedAttempts = session.attempts.filter(a => !a.success).length;
    const attemptsRemaining = this.MAX_ATTEMPTS - failedAttempts;

    if (attemptsRemaining <= 0) {
      // Lock the session
      session.isLocked = true;
      session.lockUntil = new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000);
      
      return { 
        success: false, 
        message: `Too many failed attempts. Account locked for ${this.LOCK_DURATION_MINUTES} minutes.`,
        attemptsRemaining: 0,
        isLocked: true,
        lockUntil: session.lockUntil
      };
    }

    return { 
      success: false, 
      message: `Invalid verification code. ${attemptsRemaining} attempts remaining.`,
      attemptsRemaining
    };
  }

  resendCode(email: string): { success: boolean; message: string; code?: string } {
    const session = this.getSession(email);
    
    if (!session) {
      return { success: false, message: 'No verification session found.' };
    }

    if (this.isSessionLocked(session)) {
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again after ${session.lockUntil?.toLocaleTimeString()}.`
      };
    }

    if (!this.canResendCode(session)) {
      return { 
        success: false, 
        message: `Please wait ${this.RESEND_COOLDOWN_MINUTES} minute(s) before requesting a new code.`
      };
    }

    // Generate new code
    const newCode = this.generateCode();
    session.code = newCode;
    session.hashedCode = this.hashCode(newCode);
    session.expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);
    
    // Record resend attempt
    session.attempts.push({
      timestamp: new Date(),
      success: false, // Resend is not a verification attempt
    });

    return { 
      success: true, 
      message: 'New verification code sent!',
      code: newCode
    };
  }

  getTimeRemaining(email: string): number {
    const session = this.getSession(email);
    if (!session || this.isSessionExpired(session)) return 0;
    
    return Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
  }

  getAttemptsRemaining(email: string): number {
    const session = this.getSession(email);
    if (!session) return this.MAX_ATTEMPTS;
    
    const failedAttempts = session.attempts.filter(a => !a.success).length;
    return Math.max(0, this.MAX_ATTEMPTS - failedAttempts);
  }

  cleanup(): void {
    const now = new Date();
    for (const [email, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session) && !this.isSessionLocked(session)) {
        this.sessions.delete(email);
      }
    }
  }

  // Clean up expired sessions every 5 minutes
  startCleanupInterval(): void {
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
}

export const verificationManager = new VerificationManager();

// Start cleanup interval
verificationManager.startCleanupInterval();