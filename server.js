import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Чтобы отдавало index.html и style.css

app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks } = req.body;

    const prompt = `
Подбери комплектующие для ПК с бюджетом ${budget} рублей.
Видеокарта: ${gpu}
Процессор: ${cpu}
Задачи: ${tasks}
Сделай полный список всех необходимых комплектующих с ссылками на покупки.
Ответь в формате JSON: { "completion": "текст" }.
`;

    try {
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral",   // легкая модель для RTX 3050
                prompt,
                stream: false,
                options: { temperature: 0.6 }
            })
        });

        const text = await response.text();
        console.log("Сырой ответ Ollama:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.error("Ошибка парсинга JSON:", err);
            return res.status(500).json({ result: "❌ Ошибка сервера: некорректный JSON от Ollama" });
        }

        const resultText = data.completion || data.response || "❌ Нейросеть не вернула результат";
        res.json({ result: resultText });

    } catch (err) {
        console.error("Ошибка при генерации сборки:", err);
        res.status(500).json({ result: "❌ Ошибка сервера. Попробуйте позже." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
