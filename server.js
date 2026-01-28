import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // статика фронтенда

// Инициализация OpenAI с ключом из переменных окружения
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const PORT = process.env.PORT || 3000;

// Endpoint для подбора ПК
app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks, lang } = req.body;

    // Проверка бюджета
    const minBudget = lang === 'en' ? 250 : 20000;
    if (!budget || budget < minBudget) {
        return res.json({
            result: lang === 'en' ? "⚠️ Minimum budget $250" : "⚠️ Минимальный бюджет 20 000 руб."
        });
    }

    // Формируем prompt для нейросети
    let prompt = '';
    if (lang === 'en') {
        prompt = `
You are a professional PC builder. Your task is to create the **best PC build** for the user
considering the budget, GPU and CPU brands, and current prices as of January 2026.
Provide accurate, realistic prices for January 2026.

Budget: $${budget}
GPU: ${gpu}
CPU: ${cpu}
PC tasks: ${tasks}

List all components: CPU, GPU, cooler, motherboard, case, RAM, storage, PSU, etc.
Include approximate prices in USD for each component.
Start each sentence on a new line.
Aim for the **best value for money** within the budget.
`;
    } else {
        prompt = `
Ты профессиональный сборщик ПК. Твоя задача – составить **оптимальную сборку ПК** для пользователя
с учётом бюджета, брендов видеокарты и процессора, а также актуальных цен на январь 2026 года.
Цены должны быть точными и реалистичными для января 2026 года, и каждый месяц ты обновляешь их в своей базе знаний.

Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Задачи ПК: ${tasks}

Выведи полный список комплектующих: CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Каждое полное предложение начинай с новой строки.
Старайся сделать **лучшее соотношение цена/качество** в пределах бюджета.
`;
    }

    try {
        // Логируем prompt для отладки
        console.log("Prompt:", prompt);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // или "gpt-3.5-turbo", если нужна стабильность
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1200
        });

        const text = completion.choices[0].message.content;
        res.json({ result: text });

    } catch (err) {
        console.error('❌ Server error:', err);
        res.status(500).json({
            result: lang === 'en' ? "❌ Server error. Try later." : "❌ Ошибка сервера. Попробуйте позже."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
