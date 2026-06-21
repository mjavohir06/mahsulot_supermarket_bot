import type { Bot } from "grammy";
import type { MyContext } from "../types/context.js";

const PUBLIC_COMMANDS = [
  { command: "start", description: "Katalogni ko'rsatish" },
  { command: "search", description: "Mahsulot qidirish" },
];

const ADMIN_COMMANDS = [
  ...PUBLIC_COMMANDS,
  { command: "addcategory", description: "Kategoriya/subkategoriya qo'shish" },
  { command: "addproduct", description: "Yangi mahsulot qo'shish" },
  { command: "products", description: "Barcha mahsulotlar ro'yxati" },
  { command: "delproduct", description: "Mahsulotni o'chirish" },
  { command: "setdiscount", description: "Mahsulotga chegirma qo'yish" },
  { command: "removediscount", description: "Chegirmani bekor qilish" },
];

export async function registerBotCommands(bot: Bot<MyContext>) {
  // Hammaga ko'rinadigan asosiy buyruqlar (default scope)
  await bot.api.setMyCommands(PUBLIC_COMMANDS);

  // Har bir admin uchun — FAQAT o'sha adminning shaxsiy chatida to'liq ro'yxat chiqadi,
  // oddiy foydalanuvchilar admin buyruqlarini "Menu"da ko'rmaydi.
  const adminIds = (process.env.ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  for (const adminId of adminIds) {
    try {
      await bot.api.setMyCommands(ADMIN_COMMANDS, {
        scope: { type: "chat", chat_id: Number(adminId) },
      });
    } catch (err) {
      console.warn(`⚠️ ${adminId} uchun buyruqlar o'rnatilmadi:`, (err as Error).message);
    }
  }

  console.log("📋 Bot buyruqlari o'rnatildi");
}