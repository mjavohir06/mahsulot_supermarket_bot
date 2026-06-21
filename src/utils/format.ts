import type { Product } from "../entities/Product.entity.js";

// Telegram HTML parse_mode uchun maxsus belgilarni xavfsiz qilish.
// Admin tomonidan kiritilgan ixtiyoriy matn (nom, tavsif) shu orqali o'tishi SHART,
// aks holda mahsulot nomida "<" yoki "&" bo'lsa, Telegram xabarni rad etadi.
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function hasDiscount(product: Product): boolean {
  return (
    product.discountPrice !== null &&
    Number(product.discountPrice) < Number(product.price)
  );
}

export function getDiscountPercent(product: Product): number {
  if (!hasDiscount(product)) return 0;
  return Math.round(
    (1 - Number(product.discountPrice) / Number(product.price)) * 100,
  );
}

export function getFinalPrice(product: Product): string {
  return hasDiscount(product) ? product.discountPrice! : product.price;
}

// Tugma matni uchun — Telegram inline tugmalarda HTML/Markdown ishlamaydi,
// shuning uchun bu oddiy matn qaytaradi.
export function productButtonLabel(product: Product): string {
  const prefix = hasDiscount(product) ? "🔥" : "🛍";
  const priceText = hasDiscount(product)
    ? `${product.discountPrice} so'm (-${getDiscountPercent(product)}%)`
    : `${product.price} so'm`;
  return `${prefix} ${product.name} — ${priceText}`;
}

// To'liq mahsulot kartochkasi uchun narx bloki (HTML).
export function formatPriceBlock(product: Product): string {
  if (hasDiscount(product)) {
    return (
      `<s>${product.price} so'm</s>\n` +
      `🔥 <b>${product.discountPrice} so'm</b>  (−${getDiscountPercent(product)}%)`
    );
  }
  return `💰 <b>${product.price} so'm</b>`;
}

// Mahsulot kartochkasi uchun to'liq HTML caption.
export function buildProductCaption(product: Product): string {
  const name = escapeHtml(product.name);
  const description = product.description ? escapeHtml(product.description) : "";
  const parts = [`<b>${name}</b>`];
  if (description) parts.push(description);
  parts.push(formatPriceBlock(product));
  return parts.join("\n\n");
}
