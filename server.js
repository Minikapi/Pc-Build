import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const HF_TOKEN = process.env.HF_TOKEN;
const PORT = process.env.PORT || 3000;

app.post("/api/build", async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    if (!budget || budget < 20000) {
        return res.json({ result: "⚠️ Минимальный бюджет — 20 000 руб." });
    }

    const prompt = `
Подбери оптимальную сборку ПК.

Бюджет: ${budget} руб
Видеокарта: ${gpu}
Процессор: ${cpu}
Назначение: ${tasks}

Обязательно выведи ВСЕ комплектующие:
• Процессор
• Видеокарта
• Кулер
• Материнская плата
• Оперативная память
• Накопитель
• Блок питания
• Корпус

Для каждого компонента укажи примерную цену в рублях.
Каждый компонент — с новой строки.
`;

    try {
        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "mistralai/Mistral-7B-Instruct-v0.2",
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 1200,
                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("HF ERROR:", data.error);
            return res.json({ result: "❌ Ошибка нейросети" });
        }

        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            return res.json({ result: "❌ Пустой ответ от модели" });
        }

        res.json({ result: text });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        res.json({ result: "❌ Ошибка сервера, попробуйте позже" });
    }
});

app.listen(PORT, () => {
    console.log("🚀 Server started on port", PORT);
});
