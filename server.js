import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // для фронтенда

// Hugging Face token (созданный с разрешением Inference)
const HF_TOKEN = process.env.HF_TOKEN; // В Render добавь переменную окружения HF_TOKEN

// Модель Mistral 7B Instruct
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const ROUTER_URL = `https://api-inference.huggingface.co/v1/models/${MODEL}`;

const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи полный список комплектующих: CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Сделай текст удобным для чтения, каждое предложение с новой строки.
`;

    try {
        const response = await fetch(ROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 700,
                    temperature: 0.7
                }
            })
        });

        // HF Router может вернуть не JSON напрямую, поэтому проверяем
        const data = await response.json().catch(() => null);
        if (!data || !data.generated_text) {
            return res.status(500).json({ result: "❌ HF Router не вернул ответ. Проверьте токен и разрешения." });
        }

        res.json({ result: data.generated_text });

    } catch (err) {
        console.error("HF ERROR:", err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
