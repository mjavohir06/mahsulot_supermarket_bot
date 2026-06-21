import { Bot, InlineKeyboard } from "grammy";
import type { InlineQueryResult } from "grammy/types";
import { ILike } from "typeorm";
import type { MyContext } from "../types/context.js";
import { AppDataSource } from "../data-source.js";
import { Product } from "../entities/Product.entity.js";
import { buildProductCaption, productButtonLabel } from "../utils/format.js";

const productRepo = AppDataSource.getRepository(Product);

export function registerSearchHandlers(bot: Bot<MyContext>) {
  bot.command("search", async (ctx) => {
    const query = ctx.match.toString().trim();
    if (!query) {
      await ctx.reply("Foydalanish: /search <mahsulot nomi>\n\nMasalan: /search telefon");
      return;
    }
    await runSearch(ctx, query);
  });

  // Inline qidiruv: foydalanuvchi istalgan chatda "@bot_username so'rov" deb yozsa ishlaydi.
  // Bot @BotFather'da /setinline orqali yoqilgan bo'lishi kerak.
  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query.trim();
    const products = await searchProducts(query, 20);

    const results: InlineQueryResult[] = products.map((p) => ({
      type: "photo",
      id: String(p.id),
      photo_file_id: p.imageFileId,
      title: p.name,
      description: productButtonLabel(p),
      caption: buildProductCaption(p),
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("📄 Batafsil", `prod:${p.id}`),
    }));

    await ctx.answerInlineQuery(results, { cache_time: 30, is_personal: false });
  });

  // Foydalanuvchi biror buyruq yoki conversation ichida bo'lmasa,
  // yuborgan har qanday matn avtomatik qidiruv so'rovi sifatida qabul qilinadi.
  // MUHIM: bu handler eng oxirida ro'yxatdan o'tishi kerak, aks holda
  // boshqa matn-asosli handlerlarni "ushlab qoladi".
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;
    await runSearch(ctx, text);
  });
}

async function searchProducts(query: string, limit: number): Promise<Product[]> {
  if (!query) {
    return productRepo.find({
      where: { isActive: true },
      relations: { category: true },
      order: { name: "ASC" },
      take: limit,
    });
  }

  // Avval nomi mos kelganlar (eng muhim), keyin tavsifida mos kelganlar bilan
  // to'ldiramiz — shunday qilib eng relevant natijalar tepada chiqadi.
  const byName = await productRepo.find({
    where: { name: ILike(`%${query}%`), isActive: true },
    relations: { category: true },
    order: { name: "ASC" },
    take: limit,
  });

  if (byName.length >= limit) return byName;

  const byDescription = await productRepo.find({
    where: { description: ILike(`%${query}%`), isActive: true },
    relations: { category: true },
    order: { name: "ASC" },
    take: limit,
  });

  const merged = [...byName];
  for (const p of byDescription) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.id === p.id)) merged.push(p);
  }
  return merged;
}

async function runSearch(ctx: MyContext, query: string) {
  const products = await searchProducts(query, 15);

  if (products.length === 0) {
    await ctx.reply(`"${query}" bo'yicha hech narsa topilmadi 😔\n\nBoshqa so'z bilan urinib ko'ring.`);
    return;
  }

  const kb = new InlineKeyboard();
  for (const p of products) kb.text(productButtonLabel(p), `prod:${p.id}`).row();

  await ctx.reply(`🔎 <b>"${query}"</b> bo'yicha ${products.length} ta natija:`, {
    parse_mode: "HTML",
    reply_markup: kb,
  });
}
