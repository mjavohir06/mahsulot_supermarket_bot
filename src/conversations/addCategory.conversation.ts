import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../types/context.js";
import { AppDataSource } from "../data-source.js";
import { Category } from "../entities/Category.entity.js";

type MyConversation = Conversation<MyContext>;

export async function addCategoryConversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const categoryRepo = AppDataSource.getRepository(Category);

  await ctx.reply("Kategoriya nomini kiriting:");
  const nameMsg = await conversation.waitFor("message:text");
  const name = nameMsg.message.text;

  // DB so'rovlari conversation.external() ichida bo'lishi SHART —
  // aks holda grammY conversation qayta ishga tushganda DB ga
  // bir nechta marta yozilib ketishi mumkin.
  const allCategories = await conversation.external(() => categoryRepo.find());
  const list =
    allCategories.length > 0
      ? allCategories.map((c) => `${c.id} — ${c.name}`).join("\n")
      : "(hozircha kategoriyalar yo'q)";

  await ctx.reply(
    `Agar bu sub-kategoriya bo'lsa, ota-kategoriya ID sini kiriting.\n` +
      `Top-level kategoriya bo'lsa, 0 yozing.\n\nMavjud kategoriyalar:\n${list}`,
  );
  const parentMsg = await conversation.waitFor("message:text");
  const parentId = Number(parentMsg.message.text);

  const parent =
    parentId > 0
      ? await conversation.external(() => categoryRepo.findOneBy({ id: parentId }))
      : null;

  const category = categoryRepo.create({ name, parent });
  await conversation.external(() => categoryRepo.save(category));

  await ctx.reply(`✅ "${name}" kategoriyasi qo'shildi (ID: ${category.id})`);
}
