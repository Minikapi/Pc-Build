import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import 'dotenv/config'; // подключаем .env локально, на Render не обязательно

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // отдаёт фронтенд

// Проверка переменной окружения
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY не задан!");
    process.exit(1);
}

// Инициализация OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Порт для Render
const PORT = process.env.PORT || 3000;

// API endpoint для подбора ПК
app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    if (!budget || budget < 20000) {
        return res.json({ result: "⚠️ Минимальный бюджет 20 000 руб." });
    }

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи полный список всех комплектующих:
CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Сделай текст удобным для чтения: каждое предложение с новой строки.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
        });

        const text = completion.choices[0].message.content;
        res.json({ result: text });

    } catch (err) {
        console.error("❌ Ошибка OpenAI:", err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
