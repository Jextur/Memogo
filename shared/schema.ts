import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  destination: text("destination"),
  days: integer("days"),
  people: integer("people"),
  theme: text("theme"),
  status: text("status").default("active"), // active, completed
  messages: jsonb("messages").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  refinementCount: integer("refinement_count").default(0),
});

export const travelPackages = pgTable("travel_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // classic, foodie, budget
  destination: text("destination").notNull(),
  days: integer("days").notNull(),
  budget: text("budget").notNull(),
  description: text("description"),
  route: text("route"),
  accommodation: text("accommodation"),
  diningCount: integer("dining_count"),
  attractionCount: integer("attraction_count"),
  highlights: jsonb("highlights").default([]),
  itinerary: jsonb("itinerary").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pois = pgTable("pois", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  placeId: text("place_id").notNull().unique(),
  name: text("name").notNull(),
  rating: integer("rating"),
  userRatingsTotal: integer("user_ratings_total"),
  priceLevel: integer("price_level"),
  types: jsonb("types").default([]),
  address: text("address"),
  location: jsonb("location"), // { lat: number, lng: number }
  photoRef: text("photo_ref"),
  openNow: boolean("open_now"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  destination: true,
  days: true,
  people: true,
  theme: true,
  status: true,
  messages: true,
  refinementCount: true,
});

export const insertTravelPackageSchema = createInsertSchema(travelPackages).pick({
  conversationId: true,
  name: true,
  type: true,
  destination: true,
  days: true,
  budget: true,
  description: true,
  route: true,
  accommodation: true,
  diningCount: true,
  attractionCount: true,
  highlights: true,
  itinerary: true,
});

export const insertPOISchema = createInsertSchema(pois).pick({
  placeId: true,
  name: true,
  rating: true,
  userRatingsTotal: true,
  priceLevel: true,
  types: true,
  address: true,
  location: true,
  photoRef: true,
  openNow: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertTravelPackage = z.infer<typeof insertTravelPackageSchema>;
export type TravelPackage = typeof travelPackages.$inferSelect;

export type InsertPOI = z.infer<typeof insertPOISchema>;
export type POI = typeof pois.$inferSelect;

// Message types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  options?: string[];
}

// Itinerary types
export interface ItineraryDay {
  day: number;
  date: string;
  location: string;
  title: string;
  description: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: "morning" | "afternoon" | "evening";
  name: string;
  type: "restaurant" | "attraction" | "accommodation" | "transportation";
  address?: string;
  rating?: number;
  priceLevel?: number;
  placeId?: string;
  photoRef?: string;
  duration?: string;
}
