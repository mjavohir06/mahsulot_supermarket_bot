import { Bot } from "grammy";
import type { MyContext } from "../types/context.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import { AppDataSource } from "../data-source.js";
import { Product } from "../entities/Product.entity.js";
import { hasDiscount, getDiscountPercent } from "../utils/format.js";

const productRepo = AppDataSource.getRepository(Product);

export function registerAdminHandlers(bot: Bot<MyContext>) {
  bot.command("addcategory", adminOnly, async (ctx) => {
    await ctx.conversation.enter("addCategory");
  });

  bot.command("addproduct", adminOnly, async (ctx) => {
    await ctx.conversation.enter("addProduct");
  });

  bot.command("products", adminOnly, async (ctx) => {
    const products = await productRepo.find({ relations: { category: true } });
    if (products.length === 0) {
      await ctx.reply("Hozircha mahsulotlar yo'q.");
      return;
    }
    const text = products
      .map((p) => {
        const categoryName = p.category?.name ?? "kategoriyasiz";
        const priceText = hasDiscount(p)
          ? `${p.price} so'm → ${p.discountPrice} so'm (-${getDiscountPercent(p)}%) 🔥`
          : `${p.price} so'm`;
        return `#${p.id} — ${p.name} (${categoryName}) — ${priceText}`;
      })
      .join("\n");
    await ctx.reply(text);
  });

  bot.command("delproduct", adminOnly, async (ctx) => {
    const id = Number(ctx.match);
    if (!id) {
      await ctx.reply("Foydalanish: /delproduct <id>");
      return;
    }
    const result = await productRepo.delete(id);
    if (result.affected) {
      await ctx.reply(`✅ Mahsulot #${id} o'chirildi.`);
    } else {
      await ctx.reply(`❗️ #${id} li mahsulot topilmadi.`);
    }
  });

  bot.command("setdiscount", adminOnly, async (ctx) => {
    const [idRaw, priceRaw] = ctx.match.toString().trim().split(/\s+/);
    const id = Number(idRaw);
    const discountPrice = Number(priceRaw);

    if (!id || !discountPrice) {
      await ctx.reply("Foydalanish: /setdiscount <mahsulot_id> <chegirma_narxi>\n\nMasalan: /setdiscount 5 99000");
      return;
    }

    const product = await productRepo.findOneBy({ id });
    if (!product) {
      await ctx.reply(`❗️ #${id} li mahsulot topilmadi.`);
      return;
    }
    if (discountPrice >= Number(product.price)) {
      await ctx.reply("❗️ Chegirma narxi asl narxdan kichik bo'lishi kerak.");
      return;
    }

    product.discountPrice = String(discountPrice);
    await productRepo.save(product);

    const percent = Math.round((1 - discountPrice / Number(product.price)) * 100);
    await ctx.reply(
      `🔥 "${product.name}" uchun chegirma o'rnatildi: ${product.price} so'm → ${discountPrice} so'm (-${percent}%)`,
    );
  });

  bot.command("removediscount", adminOnly, async (ctx) => {
    const id = Number(ctx.match);
    if (!id) {
      await ctx.reply("Foydalanish: /removediscount <mahsulot_id>");
      return;
    }
    const product = await productRepo.findOneBy({ id });
    if (!product) {
      await ctx.reply(`❗️ #${id} li mahsulot topilmadi.`);
      return;
    }
    product.discountPrice = null;
    await productRepo.save(product);
    await ctx.reply(`✅ "${product.name}" uchun chegirma bekor qilindi.`);
  });
}
