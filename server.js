import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = "google/flan-t5-large";
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

const PORT = process.env.PORT || 3000;

app.post("/api/build", async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери оптимальную сборку ПК.

Бюджет: ${budget} рублей
Производитель видеокарты: ${gpu}
Производитель процессора: ${cpu}
Назначение ПК: ${tasks}

Обязательно выведи:
Процессор — цена
Видеокарта — цена
Кулер — цена
Материнская плата — цена
Оперативная память — цена
Накопитель — цена
Блок питания — цена
Корпус — цена

Каждый пункт с новой строки.
`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 700,
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();

        if (!Array.isArray(data) || !data[0]?.generated_text) {
            return res.json({
                result: "❌ Модель не вернула ответ. Попробуйте ещё раз."
            });
        }

        res.json({ result: data[0].generated_text });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        res.status(500).json({
            result: "❌ Ошибка сервера. Попробуйте позже."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
