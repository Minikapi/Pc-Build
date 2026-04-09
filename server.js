import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const userCooldowns = {};
const COOLDOWN = 20000;

app.post("/api/build", async (req, res) => {
    const ip = req.ip;
    const now = Date.now();

    if (userCooldowns[ip] && now - userCooldowns[ip] < COOLDOWN) {
        return res.status(429).json({
            result: "⏳ Too many requests. Wait 20 seconds."
        });
    }
    userCooldowns[ip] = now;
});

const app = express();
app.use(cors());
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));


app.post("/api/build", async (req, res) => {
    const { budget, gpu, cpu, tasks, lang } = req.body;

    try {

        const prompt = `
You are a professional PC builder.

Create a detailed PC build.

User input:
- Budget: ${budget}
- GPU: ${gpu}
- CPU: ${cpu}
- Purpose: ${tasks}

Rules:
- Best price/performance
- No bottlenecks
- Realistic modern components
- Balanced build

Format:
CPU:
GPU:
RAM:
Motherboard:
Storage:
PSU:
Case:
Total price:

Language: ${lang === "ru" ? "Russian" : "English"}
        `;

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        const text = data.choices?.[0]?.message?.content || "Ошибка генерации";

        res.json({ result: text });

    } catch (err) {
        console.error(err);
        res.status(500).json({ result: "Server error" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
