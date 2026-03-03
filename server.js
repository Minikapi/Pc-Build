import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PC Build AI API is running 🚀");
});

function buildPrompt({ budget, gpu, cpu, tasks, currency }) {
  return `
Ты — профессиональный сборщик ПК.

Собери лучшую конфигурацию ПК в бюджете ${budget} ${currency}.

Производитель видеокарты: ${gpu}
Производитель процессора: ${cpu}
Назначение ПК: ${tasks}

Требования:
- Только реальные модели комплектующих
- Указать примерные рыночные цены 2026 года
- Подсчитать итоговую стоимость
- Объяснить выбор
- Структурировать красиво
`;
}

app.post("/api/build", async (req, res) => {
  const { budget, gpu, cpu, tasks, lang } = req.body;
  const currency = lang === "ru" ? "рублях" : "долларах";

  const prompt = buildPrompt({ budget, gpu, cpu, tasks, currency });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    res.json({
      result: data.choices?.[0]?.message?.content || "Ошибка генерации"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: lang === "ru"
        ? "❌ Ошибка сервера. Попробуйте позже."
        : "❌ Server error. Try later."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
