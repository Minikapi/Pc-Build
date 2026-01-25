import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // для фронтенда

const HF_TOKEN = process.env.HF_TOKEN; // токен Hugging Face
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи полный список комплектующих: процессор, видеокарта, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Сделай текст удобным для чтения, каждое полное предложение с новой строки.
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
                parameters: {
                    max_new_tokens: 700, // увеличено, чтобы ответ полностью влез
                    temperature: 0.7
                }
            })
        });

        const text = await response.text();

        // Проверяем, JSON ли пришёл
        let resultText = '';
        try {
            const data = JSON.parse(text);
            resultText = data?.generated_text || '❌ Модель не вернула ответ.';
        } catch {
            // если не JSON, просто возвращаем текст
            resultText = text.length > 0 ? text : '❌ Модель не вернула ответ.';
        }

        res.json({ result: resultText });

    } catch (err) {
        console.error("HF ERROR:", err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
