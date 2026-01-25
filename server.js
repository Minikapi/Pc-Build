import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // отдаём фронтенд

// Берём ключ OpenAI из переменной окружения
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) console.error("❌ OPENAI_API_KEY не установлен!");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
  const { budget, gpu, cpu, tasks } = req.body;

  const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи полный список комплектующих: процессор, видеокарта, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и др.
Укажи примерные цены в рублях.
Каждое предложение с новой строки.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // можно заменить на "gpt-4o" если доступно
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500 // увеличиваем для полного списка
    });

    const text = completion.choices[0].message.content;
    res.json({ result: text });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
