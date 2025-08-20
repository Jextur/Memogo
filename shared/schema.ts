import { pgTable, serial, text, varchar, decimal, boolean, timestamp, jsonb, index, uniqueIndex, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Cities table with Google Places integration
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  googlePlaceId: varchar('google_place_id', { length: 255 }).notNull().unique(),
  cityName: varchar('city_name', { length: 255 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(), // ISO-2 code
  countryName: varchar('country_name', { length: 100 }).notNull(),
  adminLevel1: varchar('admin_level_1', { length: 255 }), // State/Province/Prefecture
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  isCurated: boolean('is_curated').default(false).notNull(), // True for our hand-picked cities
  popularity: integer('popularity').default(0), // For ranking in suggestions
  metadata: jsonb('metadata').$type<{
    formattedAddress?: string;
    types?: string[];
    photoReferences?: string[];
    timezone?: string;
    population?: number;
  }>(),
  lastValidated: timestamp('last_validated'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  countryCodeIdx: index('idx_country_code').on(table.countryCode),
  cityNameIdx: index('idx_city_name').on(table.cityName),
  isCuratedIdx: index('idx_is_curated').on(table.isCurated),
  popularityIdx: index('idx_popularity').on(table.popularity)
}));

// Cache table for Google Places API responses
export const placesCache = pgTable('places_cache', {
  id: serial('id').primaryKey(),
  cacheKey: varchar('cache_key', { length: 500 }).notNull().unique(),
  responseData: jsonb('response_data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  expiresAtIdx: index('idx_expires_at').on(table.expiresAt)
}));

// Travel packages table (expanded)
export const travelPackages = pgTable('travel_packages', {
  id: serial('id').primaryKey(),
  conversationId: varchar('conversation_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // Alternative to packageName
  packageName: varchar('package_name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // Alternative to packageType
  packageType: varchar('package_type', { length: 50 }).notNull(),
  destination: varchar('destination', { length: 255 }).notNull(),
  cityId: integer('city_id').references(() => cities.id), // Link to cities table
  days: integer('days').notNull(),
  people: integer('people'),
  theme: varchar('theme', { length: 100 }),
  budget: varchar('budget', { length: 100 }),
  description: text('description'),
  route: text('route'),
  accommodation: text('accommodation'),
  diningCount: integer('dining_count'),
  attractionCount: integer('attraction_count'),
  highlights: jsonb('highlights').$type<string[]>(),
  itinerary: jsonb('itinerary'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('idx_conversation_id').on(table.conversationId)
}));

// Users table (minimal for now)
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// POIs table (Points of Interest from Google Places)
export const pois = pgTable('pois', {
  id: varchar('id', { length: 255 }).primaryKey(),
  placeId: varchar('place_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  rating: decimal('rating', { precision: 2, scale: 1 }),
  userRatingsTotal: integer('user_ratings_total'),
  priceLevel: integer('price_level'),
  types: jsonb('types').$type<string[]>(),
  address: text('address'),
  location: jsonb('location').$type<{ lat: number; lng: number }>(),
  photoRef: varchar('photo_ref', { length: 500 }),
  openNow: boolean('open_now'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  placeIdIdx: index('idx_place_id').on(table.placeId)
}));

// City Tags table - localized attractions/experiences per city
export const cityTags = pgTable('city_tags', {
  id: serial('id').primaryKey(),
  cityId: integer('city_id').references(() => cities.id).notNull(),
  label: varchar('label', { length: 255 }).notNull(), // Display name
  normalizedLabel: varchar('normalized_label', { length: 255 }).notNull(), // Lowercase, no spaces
  source: varchar('source', { length: 50 }).notNull(), // 'curated', 'places_enrich', 'user_add'
  score: decimal('score', { precision: 5, scale: 2 }).default('1.00'), // Popularity/relevance score
  placeIds: jsonb('place_ids').$type<string[]>(), // Sample Google Place IDs
  metadata: jsonb('metadata').$type<{
    category?: string; // 'attraction', 'district', 'experience', 'food'
    description?: string;
    photoUrl?: string;
    avgRating?: number;
    reviewCount?: number;
  }>(),
  usageCount: integer('usage_count').default(0), // Track how often selected
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  cityIdIdx: index('idx_tag_city_id').on(table.cityId),
  normalizedLabelIdx: index('idx_normalized_label').on(table.normalizedLabel),
  sourceIdx: index('idx_tag_source').on(table.source),
  scoreIdx: index('idx_tag_score').on(table.score),
  uniqueCityTag: uniqueIndex('idx_unique_city_tag').on(table.cityId, table.normalizedLabel)
}));

// Tag Aliases table - multi-lingual and variations
export const tagAliases = pgTable('tag_aliases', {
  id: serial('id').primaryKey(),
  tagId: integer('tag_id').references(() => cityTags.id).notNull(),
  alias: varchar('alias', { length: 255 }).notNull(),
  normalizedAlias: varchar('normalized_alias', { length: 255 }).notNull(),
  language: varchar('language', { length: 10 }), // ISO language code (e.g., 'ja', 'en')
  aliasType: varchar('alias_type', { length: 50 }), // 'synonym', 'abbreviation', 'translation', 'typo'
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('1.00'), // Confidence score
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  tagIdIdx: index('idx_alias_tag_id').on(table.tagId),
  normalizedAliasIdx: index('idx_normalized_alias').on(table.normalizedAlias),
  uniqueAlias: uniqueIndex('idx_unique_alias').on(table.tagId, table.normalizedAlias)
}));

// Tag Embeddings table - for semantic similarity matching
export const tagEmbeddings = pgTable('tag_embeddings', {
  id: serial('id').primaryKey(),
  tagId: integer('tag_id').references(() => cityTags.id).notNull().unique(),
  embedding: jsonb('embedding').$type<number[]>().notNull(), // Vector embedding
  model: varchar('model', { length: 100 }).notNull(), // Model used for embedding
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  tagIdIdx: index('idx_embedding_tag_id').on(table.tagId)
}));

// User Tag Selections - track what users select
export const userTagSelections = pgTable('user_tag_selections', {
  id: serial('id').primaryKey(),
  conversationId: varchar('conversation_id', { length: 255 }).notNull(),
  tagId: integer('tag_id').references(() => cityTags.id),
  customText: varchar('custom_text', { length: 255 }), // For user-entered custom tags
  isCustom: boolean('is_custom').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index('idx_selection_conversation_id').on(table.conversationId),
  tagIdIdx: index('idx_selection_tag_id').on(table.tagId)
}));

// Conversations table (expanded)
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  conversationId: varchar('conversation_id', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }),
  destination: varchar('destination', { length: 255 }),
  days: integer('days'),
  people: integer('people'),
  theme: varchar('theme', { length: 100 }),
  selectedTags: jsonb('selected_tags').$type<string[]>(), // Store selected tag labels
  status: varchar('status', { length: 50 }).default('active'),
  messages: jsonb('messages').$type<ChatMessage[]>().notNull(),
  refinementCount: integer('refinement_count').default(0),
  packagesGenerated: boolean('packages_generated').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const citiesRelations = relations(cities, ({ many }) => ({
  travelPackages: many(travelPackages),
  cityTags: many(cityTags)
}));

export const travelPackagesRelations = relations(travelPackages, ({ one }) => ({
  city: one(cities, {
    fields: [travelPackages.cityId],
    references: [cities.id]
  })
}));

export const cityTagsRelations = relations(cityTags, ({ one, many }) => ({
  city: one(cities, {
    fields: [cityTags.cityId],
    references: [cities.id]
  }),
  aliases: many(tagAliases),
  embedding: one(tagEmbeddings, {
    fields: [cityTags.id],
    references: [tagEmbeddings.tagId]
  }),
  selections: many(userTagSelections)
}));

export const tagAliasesRelations = relations(tagAliases, ({ one }) => ({
  tag: one(cityTags, {
    fields: [tagAliases.tagId],
    references: [cityTags.id]
  })
}));

export const tagEmbeddingsRelations = relations(tagEmbeddings, ({ one }) => ({
  tag: one(cityTags, {
    fields: [tagEmbeddings.tagId],
    references: [cityTags.id]
  })
}));

export const userTagSelectionsRelations = relations(userTagSelections, ({ one }) => ({
  tag: one(cityTags, {
    fields: [userTagSelections.tagId],
    references: [cityTags.id]
  })
}));

// Insert schemas and types for new tables
export const insertCityTagSchema = createInsertSchema(cityTags).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCityTag = z.infer<typeof insertCityTagSchema>;
export type CityTag = typeof cityTags.$inferSelect;

export const insertTagAliasSchema = createInsertSchema(tagAliases).omit({ id: true, createdAt: true });
export type InsertTagAlias = z.infer<typeof insertTagAliasSchema>;
export type TagAlias = typeof tagAliases.$inferSelect;

export const insertTagEmbeddingSchema = createInsertSchema(tagEmbeddings).omit({ id: true, createdAt: true });
export type InsertTagEmbedding = z.infer<typeof insertTagEmbeddingSchema>;
export type TagEmbedding = typeof tagEmbeddings.$inferSelect;

export const insertUserTagSelectionSchema = createInsertSchema(userTagSelections).omit({ id: true, createdAt: true });
export type InsertUserTagSelection = z.infer<typeof insertUserTagSelectionSchema>;
export type UserTagSelection = typeof userTagSelections.$inferSelect;

// Export City types
export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

// Chat message type
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertPOISchema = createInsertSchema(pois).omit({
  id: true,
  createdAt: true
});
export type InsertPOI = z.infer<typeof insertPOISchema>;
export type POI = typeof pois.$inferSelect;

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlacesCacheSchema = createInsertSchema(placesCache).omit({
  id: true,
  createdAt: true
});
export type InsertPlacesCache = z.infer<typeof insertPlacesCacheSchema>;
export type PlacesCache = typeof placesCache.$inferSelect;

export const insertTravelPackageSchema = createInsertSchema(travelPackages).omit({
  id: true,
  createdAt: true
});
export type InsertTravelPackage = z.infer<typeof insertTravelPackageSchema>;
export type TravelPackage = typeof travelPackages.$inferSelect;

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;