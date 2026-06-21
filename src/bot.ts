import "reflect-metadata";
import "dotenv/config";
import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import { AppDataSource } from "./data-source.js";
import type { MyContext, SessionData } from "./types/context.js";
import { registerCatalogHandlers } from "./handlers/catalog.handler.js";
import { registerAdminHandlers } from "./handlers/admin.handler.js";
import { registerSearchHandlers } from "./handlers/search.handler.js";
import { addCategoryConversation } from "./conversations/addCategory.conversation.js";
import { addProductConversation } from "./conversations/addProduct.conversation.js";
import { initLogo } from "./utils/logo.js";
import { registerBotCommands } from "./utils/command.js";

async function main() {
  await AppDataSource.initialize();
  console.log("✅ Database ulandi");

  const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

  bot.use(session({
    initial: (): SessionData => ({}),
    getSessionKey: (ctx) => ctx.from?.id.toString(),
  }));
  bot.use(conversations());
  bot.use(createConversation(addCategoryConversation, "addCategory"));
  bot.use(createConversation(addProductConversation, "addProduct"));

  registerCatalogHandlers(bot);
  registerAdminHandlers(bot);
  // Eslatma: search handler ICHIDA "har qanday matn = qidiruv" fallback bor,
  // shuning uchun bu ENG OXIRIDA ro'yxatdan o'tishi kerak.
  registerSearchHandlers(bot);

  bot.catch((err) => {
    console.error("❌ Bot xatosi:", err);
  });

  await initLogo(bot);
  await registerBotCommands(bot)
  bot.start();
  console.log("🤖 Bot ishga tushdi");
}

main().catch((err) => {
  console.error("❌ Ishga tushirishda xato:", err);
  process.exit(1);
});
