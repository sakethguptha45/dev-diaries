import crypto from 'crypto';

export interface VerificationAttempt {
  timestamp: Date;
  ip?: string;
  success: boolean;
  userAgent?: string;
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
  resendCount: number;
  lastResendAt?: Date;
}

class VerificationManager {
  private sessions = new Map<string, VerificationSession>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_EXPIRY_MINUTES = 5;
  private readonly LOCK_DURATION_MINUTES = 15;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly RATE_LIMIT_WINDOW_MINUTES = 10;
  private readonly MAX_REQUESTS_PER_WINDOW = 5;
  private readonly MAX_RESENDS_PER_SESSION = 3;

  generateCode(): string {
    // Generate cryptographically secure 6-digit code
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = (array[0] % 900000 + 100000).toString();
    return code;
  }

  hashCode(code: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(code + 'dev-diaries-salt'); // Add salt for security
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  }

  async createSession(email: string): Promise<{ code: string; session: VerificationSession }> {
    const code = this.generateCode();
    const hashedCode = await this.hashCode(code);
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

    // Clean up any existing session for this email
    this.sessions.delete(email);

    const session: VerificationSession = {
      email,
      code,
      hashedCode,
      expiresAt,
      attempts: [],
      createdAt: new Date(),
      isLocked: false,
      resendCount: 0,
    };

    this.sessions.set(email, session);
    
    // Log session creation for security audit
    console.log(`🔐 Verification session created for ${email} at ${new Date().toISOString()}`);
    
    return { code, session };
  }

  getSession(email: string): VerificationSession | null {
    const session = this.sessions.get(email);
    if (!session) return null;

    // Auto-cleanup expired sessions
    if (this.isSessionExpired(session) && !this.isSessionLocked(session)) {
      this.sessions.delete(email);
      return null;
    }

    return session;
  }

  isSessionExpired(session: VerificationSession): boolean {
    return new Date() > session.expiresAt;
  }

  isSessionLocked(session: VerificationSession): boolean {
    if (!session.isLocked || !session.lockUntil) return false;
    
    if (new Date() > session.lockUntil) {
      // Auto-unlock the session
      session.isLocked = false;
      session.lockUntil = undefined;
      session.attempts = [];
      console.log(`🔓 Session auto-unlocked for ${session.email}`);
      return false;
    }
    
    return true;
  }

  canResendCode(session: VerificationSession): { canResend: boolean; reason?: string; waitTime?: number } {
    if (this.isSessionLocked(session)) {
      return { 
        canResend: false, 
        reason: 'Account is temporarily locked',
        waitTime: session.lockUntil ? Math.max(0, session.lockUntil.getTime() - Date.now()) : 0
      };
    }

    if (session.resendCount >= this.MAX_RESENDS_PER_SESSION) {
      return { 
        canResend: false, 
        reason: 'Maximum resend attempts reached for this session'
      };
    }
    
    if (session.lastResendAt) {
      const cooldownEnd = new Date(session.lastResendAt.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000);
      const now = new Date();
      
      if (now < cooldownEnd) {
        return { 
          canResend: false, 
          reason: 'Please wait before requesting another code',
          waitTime: cooldownEnd.getTime() - now.getTime()
        };
      }
    }

    return { canResend: true };
  }

  checkRateLimit(email: string): { allowed: boolean; reason?: string; resetTime?: Date } {
    const session = this.getSession(email);
    if (!session) return { allowed: true };

    const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    const recentAttempts = session.attempts.filter(attempt => attempt.timestamp > windowStart);
    
    if (recentAttempts.length >= this.MAX_REQUESTS_PER_WINDOW) {
      const resetTime = new Date(recentAttempts[0].timestamp.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
      return { 
        allowed: false, 
        reason: 'Rate limit exceeded',
        resetTime
      };
    }

    return { allowed: true };
  }

  async verifyCode(email: string, inputCode: string, ip?: string, userAgent?: string): Promise<{ 
    success: boolean; 
    message: string; 
    attemptsRemaining?: number;
    isLocked?: boolean;
    lockUntil?: Date;
  }> {
    const session = this.getSession(email);
    
    if (!session) {
      return { success: false, message: 'No verification session found. Please request a new code.' };
    }

    if (this.isSessionExpired(session)) {
      this.sessions.delete(email);
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (this.isSessionLocked(session)) {
      const waitTime = session.lockUntil ? Math.ceil((session.lockUntil.getTime() - Date.now()) / 60000) : 0;
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again in ${waitTime} minutes.`,
        isLocked: true,
        lockUntil: session.lockUntil
      };
    }

    // Check rate limiting
    const rateLimit = this.checkRateLimit(email);
    if (!rateLimit.allowed) {
      return { success: false, message: rateLimit.reason || 'Too many attempts. Please try again later.' };
    }

    // Verify the code
    const hashedInput = await this.hashCode(inputCode);
    const isValid = hashedInput === session.hashedCode;

    // Record the attempt
    const attempt: VerificationAttempt = {
      timestamp: new Date(),
      ip,
      userAgent,
      success: isValid,
    };
    session.attempts.push(attempt);

    // Log attempt for security audit
    console.log(`🔍 Verification attempt for ${email}: ${isValid ? 'SUCCESS' : 'FAILED'} at ${attempt.timestamp.toISOString()}`);

    if (isValid) {
      // Success - clean up session
      this.sessions.delete(email);
      console.log(`✅ Email verified successfully for ${email}`);
      return { success: true, message: 'Email verified successfully!' };
    }

    // Failed attempt
    const failedAttempts = session.attempts.filter(a => !a.success).length;
    const attemptsRemaining = this.MAX_ATTEMPTS - failedAttempts;

    if (attemptsRemaining <= 0) {
      // Lock the session
      session.isLocked = true;
      session.lockUntil = new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000);
      
      console.log(`🔒 Account locked for ${email} until ${session.lockUntil.toISOString()}`);
      
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
      message: `Invalid verification code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`,
      attemptsRemaining
    };
  }

  async resendCode(email: string): Promise<{ success: boolean; message: string; code?: string }> {
    const session = this.getSession(email);
    
    if (!session) {
      return { success: false, message: 'No verification session found.' };
    }

    if (this.isSessionLocked(session)) {
      const waitTime = session.lockUntil ? Math.ceil((session.lockUntil.getTime() - Date.now()) / 60000) : 0;
      return { 
        success: false, 
        message: `Account is temporarily locked. Try again in ${waitTime} minutes.`
      };
    }

    const resendCheck = this.canResendCode(session);
    if (!resendCheck.canResend) {
      if (resendCheck.waitTime) {
        const waitSeconds = Math.ceil(resendCheck.waitTime / 1000);
        return { 
          success: false, 
          message: `Please wait ${waitSeconds} seconds before requesting a new code.`
        };
      }
      return { 
        success: false, 
        message: resendCheck.reason || 'Cannot resend code at this time.'
      };
    }

    // Generate new code
    const newCode = this.generateCode();
    session.code = newCode;
    session.hashedCode = await this.hashCode(newCode);
    session.expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);
    session.resendCount++;
    session.lastResendAt = new Date();
    
    // Reset failed attempts on resend
    session.attempts = session.attempts.filter(a => a.success);

    console.log(`🔄 Code resent for ${email} (resend #${session.resendCount})`);

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

  getSessionStats(email: string): {
    exists: boolean;
    timeRemaining: number;
    attemptsRemaining: number;
    resendCount: number;
    isLocked: boolean;
    canResend: boolean;
  } {
    const session = this.getSession(email);
    
    if (!session) {
      return {
        exists: false,
        timeRemaining: 0,
        attemptsRemaining: this.MAX_ATTEMPTS,
        resendCount: 0,
        isLocked: false,
        canResend: false,
      };
    }

    return {
      exists: true,
      timeRemaining: this.getTimeRemaining(email),
      attemptsRemaining: this.getAttemptsRemaining(email),
      resendCount: session.resendCount,
      isLocked: this.isSessionLocked(session),
      canResend: this.canResendCode(session).canResend,
    };
  }

  cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [email, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session) && !this.isSessionLocked(session)) {
        this.sessions.delete(email);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired verification sessions`);
    }
  }

  // Enhanced cleanup with detailed logging
  startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('🔄 Verification session cleanup interval started');
  }

  // Get all active sessions (for admin/debugging)
  getActiveSessions(): Array<{
    email: string;
    createdAt: Date;
    expiresAt: Date;
    attempts: number;
    isLocked: boolean;
    resendCount: number;
  }> {
    return Array.from(this.sessions.entries()).map(([email, session]) => ({
      email,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      attempts: session.attempts.length,
      isLocked: session.isLocked,
      resendCount: session.resendCount,
    }));
  }
}

export const verificationManager = new VerificationManager();

// Start cleanup interval
verificationManager.startCleanupInterval();