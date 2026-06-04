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
    const cooldownResponse = checkCooldown(req, res);
    if (cooldownResponse) return;

    const { budget, gpu, cpu, tasks, lang } = req.body;

    try {
        // Улучшенный промпт с жестким контролем распределения бюджета
        const prompt = `
You are an expert PC builder. Your absolute priority is to spend AT LEAST 90-100% of the user's total budget. Do not under-spend. If the budget is high, select premium, high-tier components (e.g., RTX 4070/4080/4090, Ryzen 7/9, Intel i7/i9) to fully match the price.

User Configuration:
- Total Budget: ${budget} ${lang === "ru" ? "RUB" : "USD"}
- GPU Brand Preference: ${gpu}
- CPU Brand Preference: ${cpu}
- Purpose: ${tasks}

Budget Distribution Guide (Aim for these ratios):
- GPU: ~40-50% of budget
- CPU: ~20-25% of budget
- Motherboard: ~10% of budget
- RAM & Storage: ~10-15% of budget
- PSU, Case, Cooler: ~10-15% of budget

CRITICAL RULES:
1. The sum of all individual component prices MUST exactly equal the 'Total' price.
2. The 'Total' price MUST be equal to or slightly less than the User Budget (${budget}), but never lower than 90% of it. For example, if budget is 140000, Total must be between 130000 and 140000.
3. No markdown, no asterisks (**), no hashtags (#), no introductory or concluding text.
4. Output ONLY plain text, one component per line.

Format exactly like this (use ${lang === "ru" ? "₽" : "$"} as the currency symbol):
CPU - [Model Name] - [Price]
GPU - [Model Name] - [Price]
Motherboard - [Model Name] - [Price]
RAM - [Model Name] - [Price]
Storage - [Model Name] - [Price]
PSU - [Model Name] - [Price]
Case - [Model Name] - [Price]
Cooler CPU - [Model Name] - [Price]
Total - [Sum of all above]

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
                    {
                        role: "system",
                        content: "You are a professional PC builder that always maximizes performance for the given budget without leaving unspent money."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
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
