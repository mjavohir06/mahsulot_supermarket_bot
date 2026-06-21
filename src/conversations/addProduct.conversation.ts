import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../types/context.js";
import { AppDataSource } from "../data-source.js";
import { Category } from "../entities/Category.entity.js";
import { Product } from "../entities/Product.entity.js";

type MyConversation = Conversation<MyContext>;

export async function addProductConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);

  await ctx.reply("Mahsulot nomini kiriting:");
  const name = (await conversation.waitFor("message:text")).message.text;

  await ctx.reply("Tavsifini kiriting (bo'lmasa, - belgisini yuboring):");
  const descRaw = (await conversation.waitFor("message:text")).message.text;
  const description = descRaw === "-" ? null : descRaw;

  await ctx.reply("Narxini kiriting (faqat raqam, masalan: 150000):");
  const price = (await conversation.waitFor("message:text")).message.text;

  const categories = await conversation.external(() => categoryRepo.find());
  if (categories.length === 0) {
    await ctx.reply(
      "❗️ Avval kamida bitta kategoriya yarating (/addcategory orqali).",
    );
    return;
  }
  const list = categories.map((c) => `${c.id} — ${c.name}`).join("\n");
  await ctx.reply(`Qaysi kategoriyaga tegishli? ID sini kiriting:\n\n${list}`);
  const categoryId = Number((await conversation.waitFor("message:text")).message.text);
  const category = await conversation.external(() =>
    categoryRepo.findOneBy({ id: categoryId }),
  );

  if (!category) {
    await ctx.reply("❗️ Bunday ID bilan kategoriya topilmadi. Boshidan boshlang.");
    return;
  }

  await ctx.reply(
    "Chegirma narxini kiriting (bo'lmasa, - belgisini yuboring):\n\n" +
      "Masalan, asl narx 150000 bo'lib, chegirmada 120000 bo'lsa — 120000 deb yozing.",
  );
  const discountRaw = (await conversation.waitFor("message:text")).message.text;
  const discountPrice = discountRaw === "-" ? null : discountRaw;

  await ctx.reply("Mahsulot rasmini yuboring:");
  const photoMsg = await conversation.waitFor("message:photo");
  const photos = photoMsg.message.photo;
  const fileId = photos[photos.length - 1]!.file_id;

  const product = productRepo.create({
    name,
    description,
    price,
    discountPrice,
    category,
    imageFileId: fileId,
  });
  await conversation.external(() => productRepo.save(product));

  await ctx.reply(`✅ "${name}" mahsuloti qo'shildi (ID: ${product.id})`);
}
