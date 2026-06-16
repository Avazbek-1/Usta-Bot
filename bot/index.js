import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.BOT_TOKEN || 'placeholder';
export const bot = new Bot(token);

bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'Mehmon';
  const text =
    `Assalomu alaykum, ${name}! 👋\n\n` +
    `🏗 *Farg'ona Usta* — Farg'ona viloyatidagi qurilish ustalarini tez va oson topish platformasi.\n\n` +
    `*Nima qila olasiz?*\n` +
    `👷 Usta — ro'yxatdan o'ting va mijozlar toping\n` +
    `🔍 Mijoz — kerakli ustani toping va bog'laning\n\n` +
    `*Qanday ishlaydi?*\n` +
    `1️⃣ "Ilovani ochish" tugmasini bosing\n` +
    `2️⃣ Usta yoki mijoz ekaningizni tanlang\n` +
    `3️⃣ Kasb va hududni tanlang\n` +
    `4️⃣ Toping yoki topiling!\n\n` +
    `⚡️ Bepul · Tez · Ishonchli`;

  if (!process.env.WEBAPP_URL) {
    await ctx.reply(text, { parse_mode: 'Markdown' });
    return;
  }

  const keyboard = new InlineKeyboard().webApp('🚀 Ilovani ochish', process.env.WEBAPP_URL);
  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
});

bot.catch((err) => {
  console.error('Bot xatosi:', err);
});
