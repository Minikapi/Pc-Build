import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // для статики фронтенда

const HF_TOKEN = process.env.HF_TOKEN; // Убедись, что переменная HF_TOKEN задана
const MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // или любую бесплатную модель, которая работает

const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи список всех комплектующих:
CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Сделай текст удобным для чтения, каждое полное предложение с новой строки.
`;

    try {
        const response = await fetch(`https://router.huggingface.co/models/${MODEL}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 800,
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("HF Router error:", data);
            return res.status(500).json({ result: `❌ HF Router error: ${data.error}` });
        }

        // Mistral обычно возвращает массив с generated_text
        const text = data[0]?.generated_text || "❌ Нет ответа от модели";
        res.json({ result: text });

    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
