import { InputFile } from "grammy";
import type { Bot } from "grammy";
import type { MyContext } from "../types/context.js";

let cachedLogoFileId: string | null = null;

export function getLogoFileId(): string | null {
  return cachedLogoFileId || process.env.MAIN_LOGO || null;
}

// Bot ishga tushganda BIR MARTA chaqiriladi: public/logo.png faylini
// birinchi admin'ning shaxsiy chatiga yuborib, qaytgan file_id keshlanadi.
// Shundan keyin barcha menyularda shu file_id qayta ishlatiladi —
// rasm har safar qayta yuklanmaydi, bot tezroq ishlaydi.
export async function initLogo(bot: Bot<MyContext>): Promise<void> {
  const logoPath = process.env.MAIN_LOGO;
  const firstAdminId = process.env.ADMIN_IDS?.split(",")[0]?.trim();

  if (!logoPath) {
    console.warn("⚠️ MAIN_LOGO .env'da ko'rsatilmagan, logotipsiz ishlaydi");
    return;
  }
  if (!firstAdminId) {
    console.warn("⚠️ ADMIN_IDS bo'sh — logotipni keshlash uchun admin kerak");
    return;
  }

  try {
    const msg = await bot.api.sendPhoto(firstAdminId, new InputFile(logoPath), {
      caption: "✅ Logotip keshlandi (bu xabar faqat ishga tushganda yuboriladi)",
    });
    const sizes = msg.photo;
    cachedLogoFileId = sizes[sizes.length - 1]!.file_id;
    console.log("🖼 Logotip muvaffaqiyatli keshlandi");
  } catch (err) {
    console.warn(
      "⚠️ Logotipni yuklab bo'lmadi (fayl mavjudmi? admin botga /start bosganmi?):",
      (err as Error).message,
    );
  }
}
