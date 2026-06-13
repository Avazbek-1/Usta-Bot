import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.BOT_TOKEN || 'placeholder';
export const bot = new Bot(token);

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    '🚀 Ilovani ochish',
    process.env.WEBAPP_URL
  );

  await ctx.reply(
    `Assalomu alaykum! 👋\n\nFarg'ona Usta — qurilish ustalarini\ntopish platformasi.\n\n✅ 200+ usta\n✅ Reyting va izohlar\n✅ Tez va bepul`,
    { reply_markup: keyboard }
  );
});

bot.catch((err) => {
  console.error('Bot xatosi:', err);
});
