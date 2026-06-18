export interface ESignProvider {
  initiateSign(agreementId: string, partyId: string): Promise<{ redirectUrl?: string; sessionId: string }>;
  checkStatus(sessionId: string): Promise<'pending' | 'signed' | 'failed'>;
  getSignedDocument(sessionId: string): Promise<Buffer | null>;
}

export class MockESignProvider implements ESignProvider {
  async initiateSign(agreementId: string, partyId: string): Promise<{ redirectUrl?: string; sessionId: string }> {
    const sessionId = `mock-session-${agreementId}-${partyId}`;
    return {
      redirectUrl: undefined,
      sessionId,
    };
  }

  async checkStatus(sessionId: string): Promise<'pending' | 'signed' | 'failed'> {
    return 'signed';
  }

  async getSignedDocument(sessionId: string): Promise<Buffer | null> {
    return null;
  }

  verifyMockOtp(aadhaar: string, otp: string): boolean {
    // Requires a 12-digit Aadhaar number and OTP '123456'
    return /^\d{12}$/.test(aadhaar) && otp === '123456';
  }
}

export const esignProvider = new MockESignProvider();
