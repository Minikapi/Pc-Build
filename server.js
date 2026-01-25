import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) console.error("❌ HF_TOKEN не задан!");

const MODEL = 'tiiuae/falcon-7b-instruct';
const PORT = process.env.PORT || 3000;

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    if (!budget || budget < 20000) {
        return res.status(400).json({ result: "⚠️ Минимальный бюджет 20 000 руб." });
    }

    const prompt = `
Подбери оптимальную сборку ПК.
Бюджет: ${budget} руб.
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Выведи список всех комплектующих: CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Сделай текст удобным для чтения, каждое полное предложение с новой строки.
`;

    try {
        const response = await fetch(`https://router.huggingface.co/models/${MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 800,
                    temperature: 0.7,
                }
            })
        });

        const data = await response.json();

        if (!data || data.error) {
            console.error(data);
            return res.status(500).json({ result: "❌ Модель не вернула ответ. Попробуйте позже." });
        }

        // У Router API текст в data.generated_text
        const text = data.generated_text || "❌ Модель вернула пустой ответ";

        res.json({ result: text });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
