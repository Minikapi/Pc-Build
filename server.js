import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // статика фронтенда

// Hugging Face
const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2'; // бесплатная модель

const PORT = process.env.PORT || 3000;

// Endpoint для подбора ПК
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

Выведи полный список комплектующих: CPU, GPU, кулер, материнская плата, корпус, RAM, накопитель, блок питания и другие.
Укажи примерные цены в рублях.
Каждое полное предложение с новой строки.
`;

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_new_tokens: 800, temperature: 0.7 }
            })
        });

        const data = await response.json();
        const text = data?.generated_text || data?.[0]?.generated_text || '❌ Модель не вернула ответ';

        res.json({ result: text });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: '❌ Ошибка сервера. Попробуйте позже.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
