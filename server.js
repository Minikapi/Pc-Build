import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("⚠️ Установите OPENAI_API_KEY в переменных окружения!");
    process.exit(1);
}

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК с учётом бюджета и предпочтений пользователя.

Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Обязательные компоненты:
- Процессор
- Видеокарта
- Материнская плата
- Оперативная память
- Накопитель (SSD/HDD)
- Корпус
- Блок питания
- Кулер / система охлаждения

Для каждого компонента укажи:
- Название модели
- Примерная цена в рублях

Выведи в формате списка:
1. Компонент — Модель — Цена ₽
2. ...
`;

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 800
        });

        const text = completion.data.choices[0].message.content || "Нет ответа от модели";
        res.json({ result: text });

    } catch (err) {
        console.error("Ошибка OpenAI:", err.response?.data || err.message);
        res.status(500).json({ result: "Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
