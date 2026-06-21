import { Bot, InlineKeyboard } from "grammy";
import { IsNull } from "typeorm";
import type { MyContext } from "../types/context.js";
import { AppDataSource } from "../data-source.js";
import { Category } from "../entities/Category.entity.js";
import { Product } from "../entities/Product.entity.js";
import { getLogoFileId } from "../utils/logo.js";
import { buildProductCaption, escapeHtml, productButtonLabel } from "../utils/format.js";

const categoryRepo = AppDataSource.getRepository(Category);
const productRepo = AppDataSource.getRepository(Product);

export function registerCatalogHandlers(bot: Bot<MyContext>) {
  bot.command("start", async (ctx) => {
    await showCategory(ctx, null);
  });

  // callback_data: "cat:root" yoki "cat:<id>"
  bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
    const param = ctx.match[1];
    const categoryId = param === "root" ? null : Number(param);
    await showCategory(ctx, categoryId);
  });

  // callback_data: "prod:<id>"
  bot.callbackQuery(/^prod:(\d+)$/, async (ctx) => {
    const productId = Number(ctx.match[1]);
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: { category: true },
    });

    if (!product) {
      await ctx.answerCallbackQuery("Mahsulot topilmadi");
      return;
    }
    await ctx.answerCallbackQuery();

    const backTarget = product.category ? String(product.category.id) : "root";
    const kb = new InlineKeyboard().text("⬅️ Orqaga", `cat:${backTarget}`);

    // Mahsulotda rasm har doim mavjud (entity darajasida majburiy),
    // shuning uchun bu yerda null tekshiruvi shart emas.
    await ctx.replyWithPhoto(product.imageFileId, {
      caption: buildProductCaption(product),
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });
}

async function showCategory(ctx: MyContext, categoryId: number | null) {
  const children = await categoryRepo.find({
    where: { parent: categoryId === null ? IsNull() : { id: categoryId } },
    order: { name: "ASC" },
  });

  let products: Product[] = [];
  let currentCategory: Category | null = null;
  let backTarget = "root";

  if (categoryId !== null) {
    currentCategory = await categoryRepo.findOne({
      where: { id: categoryId },
      relations: { parent: true },
    });
    products = await productRepo.find({
      where: { category: { id: categoryId }, isActive: true },
      order: { name: "ASC" },
    });
    backTarget = currentCategory?.parent ? String(currentCategory.parent.id) : "root";
  }

  const kb = new InlineKeyboard();
  for (const cat of children) kb.text(`📁 ${cat.name}`, `cat:${cat.id}`).row();
  for (const p of products) kb.text(productButtonLabel(p), `prod:${p.id}`).row();

  if (categoryId === null) {
    // Faqat asosiy menyuda — inline qidiruvni sinab ko'rish uchun tugma.
    // Bosilganda chat ichida "@bot_username " avtomatik yoziladi.
    kb.row().switchInlineCurrent("🔍 Qidirish", "");
  } else {
    kb.row().text("⬅️ Orqaga", `cat:${backTarget}`);
  }

  const headerTitle = currentCategory
    ? `📁 <b>${escapeHtml(currentCategory.name)}</b>`
    : "🛍 <b>Bizning katalog</b>";
  const emptyNote =
    children.length === 0 && products.length === 0
      ? "\n\nHozircha bu yerda hech narsa yo'q."
      : "\n\nKerakli bo'limni tanlang 👇";
  const text = headerTitle + emptyNote;

  const logoFileId = getLogoFileId();

  // Avval mavjud xabarni tahrirlashga harakat qilamiz (tezroq, kamroq spam),
  // bo'lmasa yangi xabar yuboramiz.
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
    try {
      if (logoFileId) {
        await ctx.editMessageMedia(
          { type: "photo", media: logoFileId, caption: text, parse_mode: "HTML" },
          { reply_markup: kb },
        );
      } else {
        await ctx.editMessageText(text, { reply_markup: kb, parse_mode: "HTML" });
      }
      return;
    } catch {
      // Tahrirlab bo'lmadi (masalan, xabar turi mos kelmaydi) — pastga tushamiz
    }
  }

  if (logoFileId) {
    await ctx.replyWithPhoto(logoFileId, {
      caption: text,
      parse_mode: "HTML",
      reply_markup: kb,
    });
  } else {
    await ctx.reply(text, { reply_markup: kb, parse_mode: "HTML" });
  }
}
