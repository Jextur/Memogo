import { randomUUID } from 'crypto';

interface SessionPreferences {
  travelStyle?: string[];
  freeTextTags?: string[];
  cuisinePreferences?: string[];
  budgetLevel?: string;
  activityPreferences?: string[];
  avoidances?: string[];
  accessibilityNeeds?: string[];
  timePreferences?: { [key: string]: string }; // morning person, night owl, etc.
  customWeights?: { [key: string]: number };
}

interface UserSession {
  sessionId: string;
  conversationId?: string;
  preferences: SessionPreferences;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

class SessionManager {
  private sessions: Map<string, UserSession>;
  private readonly SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
  private readonly CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessions = new Map();
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL_MS);
  }

  private cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    this.sessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      console.log(`[SessionManager] Cleaning up expired session: ${sessionId}`);
      this.sessions.delete(sessionId);
    });
  }

  createSession(conversationId?: string): string {
    const sessionId = randomUUID();
    const now = new Date();
    
    const session: UserSession = {
      sessionId,
      conversationId,
      preferences: {},
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + this.SESSION_TTL_MS)
    };
    
    this.sessions.set(sessionId, session);
    console.log(`[SessionManager] Created new session: ${sessionId}`);
    return sessionId;
  }

  getSession(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    // Update last activity
    session.lastActivityAt = new Date();
    session.expiresAt = new Date(Date.now() + this.SESSION_TTL_MS);
    
    return session;
  }

  updatePreferences(sessionId: string, preferences: Partial<SessionPreferences>): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Merge preferences, never overwrite the entire object
    session.preferences = {
      ...session.preferences,
      ...preferences
    };
    
    // Ensure weights don't exceed 30% boost
    if (session.preferences.customWeights) {
      Object.keys(session.preferences.customWeights).forEach(key => {
        const weight = session.preferences.customWeights![key];
        session.preferences.customWeights![key] = Math.min(1.3, Math.max(0.7, weight));
      });
    }
    
    console.log(`[SessionManager] Updated preferences for session ${sessionId}:`, preferences);
    return true;
  }

  addFreeTextTag(sessionId: string, tag: string): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    if (!session.preferences.freeTextTags) {
      session.preferences.freeTextTags = [];
    }
    
    // Avoid duplicates
    if (!session.preferences.freeTextTags.includes(tag)) {
      session.preferences.freeTextTags.push(tag);
      console.log(`[SessionManager] Added free-text tag "${tag}" to session ${sessionId}`);
    }
    
    return true;
  }

  getPreferences(sessionId: string): SessionPreferences | null {
    const session = this.getSession(sessionId);
    return session?.preferences || null;
  }

  // Calculate personalization weights for POI scoring
  calculatePersonalizationWeights(sessionId: string, poi: any): number {
    const session = this.getSession(sessionId);
    
    if (!session || !session.preferences) {
      return 1.0; // No personalization
    }
    
    let weight = 1.0;
    const prefs = session.preferences;
    
    // Apply free-text tag matching (max 20% boost)
    if (prefs.freeTextTags && prefs.freeTextTags.length > 0) {
      const poiText = `${poi.name} ${poi.types?.join(' ')} ${poi.description || ''}`.toLowerCase();
      const matchingTags = prefs.freeTextTags.filter(tag => 
        poiText.includes(tag.toLowerCase())
      );
      
      if (matchingTags.length > 0) {
        weight *= 1.0 + (0.2 * Math.min(1, matchingTags.length / prefs.freeTextTags.length));
      }
    }
    
    // Apply cuisine preferences (max 10% boost for restaurants)
    if (prefs.cuisinePreferences && poi.types?.includes('restaurant')) {
      const cuisineMatch = prefs.cuisinePreferences.some(cuisine =>
        poi.name?.toLowerCase().includes(cuisine.toLowerCase()) ||
        poi.types?.some((t: string) => t.includes(cuisine.toLowerCase()))
      );
      
      if (cuisineMatch) {
        weight *= 1.1;
      }
    }
    
    // Apply activity preferences (max 10% boost)
    if (prefs.activityPreferences && prefs.activityPreferences.length > 0) {
      const activityMatch = prefs.activityPreferences.some(activity => {
        const activityLower = activity.toLowerCase();
        return poi.types?.some((t: string) => t.includes(activityLower)) ||
               poi.name?.toLowerCase().includes(activityLower);
      });
      
      if (activityMatch) {
        weight *= 1.1;
      }
    }
    
    // Apply avoidances (30% penalty)
    if (prefs.avoidances && prefs.avoidances.length > 0) {
      const shouldAvoid = prefs.avoidances.some(avoid => {
        const avoidLower = avoid.toLowerCase();
        return poi.name?.toLowerCase().includes(avoidLower) ||
               poi.types?.some((t: string) => t.includes(avoidLower));
      });
      
      if (shouldAvoid) {
        weight *= 0.7;
      }
    }
    
    // Apply custom weights if provided
    if (prefs.customWeights) {
      poi.types?.forEach((type: string) => {
        if (prefs.customWeights![type]) {
          weight *= prefs.customWeights![type];
        }
      });
    }
    
    // Ensure weight stays within bounds (0.7 to 1.3)
    return Math.min(1.3, Math.max(0.7, weight));
  }

  // Link a session to a conversation
  linkToConversation(sessionId: string, conversationId: string): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    session.conversationId = conversationId;
    console.log(`[SessionManager] Linked session ${sessionId} to conversation ${conversationId}`);
    return true;
  }

  // Get or create session from request
  getOrCreateSession(sessionId?: string, conversationId?: string): string {
    if (sessionId) {
      const existingSession = this.getSession(sessionId);
      if (existingSession) {
        if (conversationId && !existingSession.conversationId) {
          this.linkToConversation(sessionId, conversationId);
        }
        return sessionId;
      }
    }
    
    // Create new session
    return this.createSession(conversationId);
  }

  // Destroy session
  destroySession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`[SessionManager] Destroyed session: ${sessionId}`);
    }
    return deleted;
  }

  // Get all active sessions (for monitoring)
  getActiveSessions(): number {
    this.cleanupExpiredSessions();
    return this.sessions.size;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();