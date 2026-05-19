import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const userCooldowns = {};
const COOLDOWN = 20000;

function checkCooldown(req, res) {
    const ip = req.ip;
    const now = Date.now();

    if (userCooldowns[ip] && now - userCooldowns[ip] < COOLDOWN) {
        return res.status(429).json({
            result: "⏳ Too many requests. Wait 20 seconds."
        });
    }

    userCooldowns[ip] = now;
    return false;
}

app.post("/api/build", async (req, res) => {

    // Проверка cooldown
    const cooldownResponse = checkCooldown(req, res);
    if (cooldownResponse) return;

    const { budget, gpu, cpu, tasks, lang } = req.body;

    try {
        // Генерация промпта для нейронки
const prompt = `
You are a PC building assistant.

Create a concise PC build.

User:
- Budget: ${budget} ${lang === "ru" ? "RUB" : "USD"}
- GPU preference: ${gpu}
- CPU preference: ${cpu}
- Purpose: ${tasks}

Rules:
- Use the exact budget currency
- No markdown
- No ** symbols
- No hashtags
- No explanations
- No intro text
- Only plain text
- Short response
- One component per line

Format exactly:

CPU - price
GPU - price
Motherboard - price
RAM - price
Storage - price
PSU - price
Case - price
Cooler CPU - price
Total - price
Do not output random or fake precise market fluctuations.
Use stable approximate prices in RUB based on 2026 average market values.
Keep prices realistic and consistent.
If language is English, use USD ($).
If language is Russian, use RUB (₽).
Do not mix currencies.
Use realistic modern components.
Stay within budget.

Language: ${lang === "ru" ? "Russian" : "English"}
`;

        // Запрос к Deepseek API
       const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
            {
                role: "system",
                content: "You are a professional PC builder."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 700
    })
});

const data = await response.json();

console.log("STATUS:", response.status);
console.log("DATA:", data);

if (!response.ok) {
    return res.status(500).json({
        result: JSON.stringify(data)
    });
}

const text = data.choices?.[0]?.message?.content;

if (!text) {
    return res.status(500).json({
        result: "DeepSeek returned empty response"
    });
}

res.json({ result: text });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: lang === "ru" ? "Ошибка сервера" : "Server error" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
