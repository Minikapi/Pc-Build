import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // для фронтенда

const HF_TOKEN = process.env.HF_INFERENCE_API_KEY; // токен Hugging Face
const MODEL = 'google/flan-t5-small'; // стабильная бесплатная модель
const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи список всех комплектующих: CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания.
Примерные цены в рублях.
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
                parameters: { max_new_tokens: 500, temperature: 0.7 }
            })
        });

        // HF иногда возвращает не JSON, поэтому проверяем
        const text = await response.text();

        if (!text || text.includes('error')) {
            return res.status(500).json({ result: '❌ HF Router error или модель не вернула ответ.' });
        }

        res.json({ result: text });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ result: '❌ Ошибка сервера. Попробуйте позже.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
