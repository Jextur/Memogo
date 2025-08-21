import { Request, Response, NextFunction } from 'express';
import { sessionManager } from '../services/sessionManager';

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      sessionPreferences?: any;
    }
  }
}

export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Try to get session ID from multiple sources
  let sessionId = req.headers['x-session-id'] as string || 
                  req.cookies?.sessionId ||
                  req.query.sessionId as string;
  
  // Get or create session
  const conversationId = req.body?.conversationId || req.params?.conversationId;
  sessionId = sessionManager.getOrCreateSession(sessionId, conversationId);
  
  // Set session ID in request
  req.sessionId = sessionId;
  req.sessionPreferences = sessionManager.getPreferences(sessionId);
  
  // Set session ID in response header and cookie
  res.setHeader('X-Session-Id', sessionId);
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
  });
  
  next();
}

export function extractSessionPreferences(req: Request) {
  if (!req.sessionId) {
    return null;
  }
  
  const conversation = req.body;
  if (!conversation) {
    return null;
  }
  
  // Extract preferences from conversation messages
  const preferences: any = {
    freeTextTags: [],
    cuisinePreferences: [],
    activityPreferences: [],
    travelStyle: []
  };
  
  // Extract from selected tags
  if (conversation.selectedTags) {
    preferences.freeTextTags.push(...conversation.selectedTags);
  }
  
  // Extract from conversation messages
  if (conversation.messages) {
    conversation.messages.forEach((msg: any) => {
      if (msg.role === 'user') {
        const text = msg.content.toLowerCase();
        
        // Extract activity preferences
        if (text.includes('water') || text.includes('beach') || text.includes('swim')) {
          preferences.activityPreferences.push('water activities');
        }
        if (text.includes('food') || text.includes('eat') || text.includes('restaurant')) {
          preferences.activityPreferences.push('dining');
        }
        if (text.includes('culture') || text.includes('museum') || text.includes('history')) {
          preferences.activityPreferences.push('cultural');
        }
        if (text.includes('nature') || text.includes('park') || text.includes('outdoor')) {
          preferences.activityPreferences.push('nature');
        }
        if (text.includes('shopping') || text.includes('market')) {
          preferences.activityPreferences.push('shopping');
        }
        if (text.includes('nightlife') || text.includes('bar') || text.includes('club')) {
          preferences.activityPreferences.push('nightlife');
        }
        
        // Extract cuisine preferences
        const cuisines = ['japanese', 'italian', 'chinese', 'korean', 'thai', 'indian', 
                         'mexican', 'french', 'mediterranean', 'american', 'burgers', 
                         'pizza', 'sushi', 'ramen', 'bbq', 'seafood', 'vegetarian', 'vegan'];
        cuisines.forEach(cuisine => {
          if (text.includes(cuisine)) {
            preferences.cuisinePreferences.push(cuisine);
          }
        });
        
        // Extract travel style
        if (text.includes('budget') || text.includes('cheap') || text.includes('affordable')) {
          preferences.travelStyle.push('budget');
        }
        if (text.includes('luxury') || text.includes('premium') || text.includes('high-end')) {
          preferences.travelStyle.push('luxury');
        }
        if (text.includes('adventure') || text.includes('active')) {
          preferences.travelStyle.push('adventure');
        }
        if (text.includes('relax') || text.includes('peaceful') || text.includes('quiet')) {
          preferences.travelStyle.push('relaxing');
        }
        if (text.includes('family') || text.includes('kids') || text.includes('children')) {
          preferences.travelStyle.push('family-friendly');
        }
        
        // Extract avoidances
        if (text.includes('no crowd') || text.includes('avoid crowd') || text.includes('not crowded')) {
          if (!preferences.avoidances) preferences.avoidances = [];
          preferences.avoidances.push('crowded');
        }
        if (text.includes('no spicy') || text.includes('not spicy')) {
          if (!preferences.avoidances) preferences.avoidances = [];
          preferences.avoidances.push('spicy');
        }
      }
    });
  }
  
  // Remove duplicates
  Object.keys(preferences).forEach(key => {
    if (Array.isArray(preferences[key])) {
      preferences[key] = Array.from(new Set(preferences[key]));
    }
  });
  
  // Update session with extracted preferences
  if (req.sessionId) {
    sessionManager.updatePreferences(req.sessionId, preferences);
  }
  
  return preferences;
}