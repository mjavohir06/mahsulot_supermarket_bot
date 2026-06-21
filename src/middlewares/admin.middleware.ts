import type { MyContext } from "../types/context.js";

const ADMIN_IDS = (process.env.ADMIN_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isAdmin(ctx: MyContext): boolean {
  const userId = ctx.from?.id?.toString();
  return !!userId && ADMIN_IDS.includes(userId);
}

export async function adminOnly(ctx: MyContext, next: () => Promise<void>) {
  if (!isAdmin(ctx)) {
    await ctx.reply("⛔ Bu buyruq faqat adminlar uchun.");
    return;
  }
  await next();
}
