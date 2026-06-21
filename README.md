# Mahsulotlar katalogi bot

GrammY + TypeScript + PostgreSQL + TypeORM asosida qurilgan, do'kon
mahsulotlarini kategoriya/subkategoriya bo'yicha ko'rsatadigan,
chegirmalar va qidiruvni qo'llab-quvvatlaydigan Telegram bot.

## Struktura

```
public/
└── logo.png                        # do'kon logotipi (o'zingiz qo'shasiz)
src/
├── bot.ts                          # kirish nuqtasi
├── data-source.ts                  # TypeORM DataSource
├── types/context.ts                # MyContext (session + conversation)
├── entities/
│   ├── Category.entity.ts          # self-referencing (parent/children)
│   └── Product.entity.ts           # narx, chegirma, rasm (majburiy)
├── middlewares/
│   └── admin.middleware.ts         # ADMIN_IDS orqali admin tekshiruvi
├── handlers/
│   ├── catalog.handler.ts          # foydalanuvchi: katalogni ko'rish
│   ├── search.handler.ts           # /search, inline qidiruv, matnli qidiruv
│   └── admin.handler.ts            # admin buyruqlari
├── conversations/
│   ├── addCategory.conversation.ts # ko'p bosqichli kategoriya qo'shish
│   └── addProduct.conversation.ts  # ko'p bosqichli mahsulot qo'shish
└── utils/
    ├── format.ts                   # narx/chegirma/HTML formatlash
    └── logo.ts                     # logotipni bir marta yuklab keshlash
```

## O'rnatish

```bash
npm install
cp .env.example .env   # va to'ldiring (BOT_TOKEN, DB_*, ADMIN_IDS, MAIN_LOGO)
createdb mahsulotlar_katalogi
# public/logo.png ga do'kon logotipini joylashtiring
npm run dev
```

**Muhim**: birinchi marta ishga tushirishdan oldin, `ADMIN_IDS` dagi birinchi
admin botga `/start` bosgan bo'lishi kerak — aks holda logotipni keshlash
ishlamaydi (Telegram botlarga, sizga yozmagan foydalanuvchilarga xabar
yuborishga ruxsat bermaydi). Bu holatda bot shunchaki matnli menyularga
o'tadi, xatolik bermaydi.

## Foydalanuvchi buyruqlari

- `/start` — katalogni ko'rsatadi (kategoriyalar → subkategoriyalar → mahsulotlar), logotip bilan
- `/search <so'rov>` — mahsulot qidirish
- Oddiy matn yuborilsa — avtomatik qidiruv sifatida qabul qilinadi
- **Inline qidiruv**: istalgan chatda `@bot_username mahsulot nomi` deb yozish orqali ham qidirish mumkin

## Inline qidiruvni yoqish

GrammY o'zi inline so'rovlarni qabul qiladi, lekin Telegram tomonidan bu
funksiya **@BotFather**'da alohida yoqilishi kerak:

1. @BotFather ga boring
2. `/setinline` buyrug'ini yuboring
3. Botingizni tanlang
4. Placeholder matn kiriting (masalan: "Mahsulot qidirish...")

Shundan keyin foydalanuvchilar istalgan chatda botingizni `@` orqali chaqirib,
to'g'ridan-to'g'ri mahsulot qidira oladi va rasm bilan natijani yuborishi mumkin.

## Admin buyruqlari

Faqat `.env` dagi `ADMIN_IDS` ro'yxatidagi Telegram ID'lar uchun ishlaydi:

- `/addcategory` — yangi kategoriya yoki subkategoriya qo'shish
- `/addproduct` — yangi mahsulot qo'shish (nom, tavsif, narx, **chegirma narxi**, kategoriya, rasm)
- `/products` — barcha mahsulotlar ro'yxati (chegirmalar bilan)
- `/delproduct <id>` — mahsulotni o'chirish
- `/setdiscount <id> <chegirma_narxi>` — mavjud mahsulotga chegirma qo'yish
- `/removediscount <id>` — chegirmani bekor qilish

O'z Telegram ID'ingizni bilish uchun @userinfobot ga yozing.

## Chegirmalar qanday ishlaydi

`Product` entity'sida ikkita narx maydoni bor: `price` (asl narx) va
`discountPrice` (ixtiyoriy, chegirma narxi). Agar `discountPrice` mavjud
bo'lsa va `price`dan kichik bo'lsa — mahsulot katalogda 🔥 belgisi va
chizilgan asl narx (`<s>...</s>`) bilan ko'rsatiladi. Barcha hisob-kitob
`src/utils/format.ts` ichida markazlashgan.

## Muhim eslatmalar

1. **`synchronize: true`** faqat development uchun (`data-source.ts` ichida) —
   entity'lar asosida jadvallarni avtomatik yaratadi. Production'ga chiqishdan
   oldin TypeORM migration'lariga o'ting (`synchronize: false` qiling).

2. **Rasm majburiy**: har bir mahsulotda rasm bo'lishi shart (`imageFileId`
   nullable emas) — admin `/addproduct` orqali qo'shganda rasm so'ralmasdan
   o'tib bo'lmaydi.

3. **HTML, Markdown emas**: barcha caption'lar `parse_mode: "HTML"` bilan
   yuboriladi va admin kiritgan matn `escapeHtml()` orqali tozalanadi.
   Sababi — mahsulot nomida `_`, `*`, `[` kabi belgilar bo'lsa, Markdown
   parse xato berishi mumkin, HTML esa bunga chidamliroq.

4. **`conversation.external()`**: conversation oqimlarida barcha DB so'rovlari
   shu wrapper ichida chaqirilgan — grammY conversations plugin ichki holatni
   "replay" qilgani uchun, bu bo'lmasa bir xil DB yozuvi bir necha marta
   bajarilib ketishi mumkin.

5. **Handler tartibi**: `search.handler.ts` ichidagi "har qanday matn =
   qidiruv" fallback `bot.ts`da ENG OXIRIDA ro'yxatdan o'tkazilgan — aks
   holda u boshqa buyruqlarni "ushlab qolgan" bo'lardi.

6. **tsconfig.json**: TypeORM dekoratorlari ishlashi uchun
   `experimentalDecorators`, `emitDecoratorMetadata` va
   `useDefineForClassFields: false` qo'shilgan; `verbatimModuleSyntax: true`
   bo'lgani uchun faqat tip sifatida ishlatiladigan importlar `import type`
   bilan yozilgan.

## Keyingi qadamlar (kengaytirish uchun g'oyalar)

- Mahsulotlar ko'p bo'lsa, inline keyboard'ga pagination qo'shish
- Mahsulotni tahrirlash (`/editproduct`)
- Buyurtma/savatcha funksiyasi
- Ko'p tillilik (`locales/uz.json`, `locales/ru.json`)
"# mahsulot_supermarket_bot" 
