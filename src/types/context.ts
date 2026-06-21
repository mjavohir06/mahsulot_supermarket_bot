import { Context } from "grammy";
import type { SessionFlavor } from "grammy";
import type { ConversationFlavor } from "@grammyjs/conversations";

export interface SessionData {
  // Hozircha bo'sh — kerak bo'lganda kengaytiriladi
  // (masalan: savatcha, oxirgi ko'rilgan kategoriya va h.k.)
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
