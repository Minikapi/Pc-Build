import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // для статики фронтенда

// Берём ключ OpenAI из переменной окружения
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Инициализация клиента OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// PORT для Render
const PORT = process.env.PORT || 3000;

// API endpoint для подбора ПК
app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи список всех комплектующих: CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Сделай текст удобным для чтения, чтобы каждое полное предложение с новой строки.
`;

    try {
        // Запрос к модели OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 600
        });

        const text = completion.choices[0].message.content;
        res.json({ result: text });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
