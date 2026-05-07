import express from "express";
import { createServer as createViteServer } from "vite";
import { Telegraf } from "telegraf";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory stats (in a real app, use a DB)
const STATS_FILE = path.join(process.cwd(), "stats.json");
let stats = {
  totalTests: 0,
  gradeStats: {} as Record<number, number>,
  topicStats: {} as Record<string, number>,
  logs: [] as string[]
};

// Load stats
if (fs.existsSync(STATS_FILE)) {
  try {
    stats = JSON.parse(fs.readFileSync(STATS_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to load stats", e);
  }
}

function saveStats() {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

// Telegram Bot Setup
const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot: Telegraf | null = null;

if (botToken && botToken !== "MY_BOT_TOKEN") {
  bot = new Telegraf(botToken);

  bot.start((ctx) => {
    ctx.reply("Assalomu alaykum! MathMaster AI Statistika botiga xush kelibsiz.\n\nBuyruqlar:\n/stats - Umumiy statistika\n/topics - Oxirgi o'rganilgan mavzular");
  });

  bot.command("stats", (ctx) => {
    let gradeInfo = Object.entries(stats.gradeStats)
      .map(([grade, count]) => `${grade}-sinf: ${count} ta test`)
      .join("\n");

    ctx.reply(`📊 Umumiy statistika:\n\n✅ Jami yechilgan testlar: ${stats.totalTests}\n\nSinflar kesimida:\n${gradeInfo || "Ma'lumot yo'q"}`);
  });

  bot.command("topics", (ctx) => {
    const lastLogs = stats.logs.slice(-5).reverse().join("\n");
    ctx.reply(`📚 Oxirgi o'rganilgan mavzular va faollik:\n\n${lastLogs || "Hozircha faollik yo'q"}`);
  });

  bot.launch().then(() => {
    console.log("Telegram bot is running...");
  }).catch(err => {
    console.error("Failed to start bot", err);
  });
} else {
  console.log("TELEGRAM_BOT_TOKEN topilmadi yoki standart qiymatda. Bot ishga tushmadi.");
}

// API Routes
app.get("/api/stats", (req, res) => {
  res.json(stats);
});

app.post("/api/track", (req, res) => {
  const { grade, subject, message } = req.body;
  
  stats.totalTests++;
  stats.gradeStats[grade] = (stats.gradeStats[grade] || 0) + 1;
  
  if (message) {
    stats.logs.push(`${new Date().toLocaleTimeString()}: ${message}`);
    if (stats.logs.length > 50) stats.logs.shift();
  }
  
  saveStats();

  // Notify bot if enabled
  if (bot && message) {
    // Optionally notify an admin chat ID if set
    // bot.telegram.sendMessage(ADMIN_CHAT_ID, `Yangi faollik: ${message}`);
  }

  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
