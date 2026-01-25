import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // статика фронтенда

const HF_TOKEN = process.env.HF_TOKEN;
if (!HF_TOKEN) {
    console.error("❌ HF_TOKEN не задан в переменных окружения!");
}

const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const ROUTER_URL = `https://router.huggingface.co/models/${MODEL}`;

const PORT = process.env.PORT || 3000;

app.post("/api/build", async (req, res) => {
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

Выведи полный список комплектующих:
CPU, GPU, кулер, материнская плата, корпус, оперативная память, накопитель, блок питания и т.д.
Укажи примерные цены в рублях для каждого компонента.
Делай каждую строку как отдельное предложение.
`;

    try {
        const response = await fetch(ROUTER_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 1200,
                    temperature: 0.7,
                },
            }),
        });

        // Нам нужно безопасно обработать ответ
        const textResp = await response.text();

        // Если это не JSON — покажем текст
        let data;
        try {
            data = JSON.parse(textResp);
        } catch (e) {
            console.error("❌ HF Router вернул не JSON:", textResp);
            return res.status(500).json({ result: "❌ Модель вернула некорректный ответ. Попробуйте позже." });
        }

        if (data.error) {
            console.error("❌ HF Router error:", data.error);
            return res.status(500).json({ result: `❌ Ошибка модели: ${data.error}` });
        }

        // Получаем результат
        const text = data.generated_text || data[0]?.generated_text || "❌ Модель вернула пустой ответ";
        res.json({ result: text });

    } catch (err) {
        console.error("❌ Ошибка сервера:", err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
