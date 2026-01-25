import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

console.log("OPENAI_API_KEY =", process.env.OPENAI_API_KEY ? "OK" : "NOT SET");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // отдаёт index.html и другие статические файлы

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY не задана!");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
  const { budget, gpu, cpu, tasks } = req.body;

  if (!budget || budget < 20000) {
    return res.json({ result: "⚠️ Минимальный бюджет 20 000 руб." });
  }

  const prompt = `
Подбери оптимальную сборку ПК в рублях.
Бюджет: ${budget}.
Производитель видеокарты: ${gpu}.
Процессор: ${cpu}.
Назначение: ${tasks}.

Выведи полный список комплектующих:
- CPU
- GPU
- Материнская плата
- Кулер
- Оперативная память
- Накопитель (SSD/HDD)
- Корпус
- Блок питания
- Дополнительные аксессуары

Для каждого компонента укажи примерную цену в рублях.
Пиши красиво, каждое предложение с новой строки.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    console.log("OpenAI response:", completion);

    const text = completion.choices?.[0]?.message?.content || "❌ Модель не вернула данных";
    res.json({ result: text });

  } catch (err) {
    console.error("❌ Ошибка OpenAI:", err.message);
    res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
