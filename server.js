import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Идеальный промпт для сборки ПК
function buildPrompt({ budget, gpu, cpu, tasks, currency }) {
    return `
Ты — профессиональный сборщик ПК с 15-летним опытом. 
Собери лучшую конфигурацию ПК в бюджете ${budget} ${currency}.

Входные данные:
- Бюджет: ${budget} ${currency}
- Производитель видеокарты: ${gpu}
- Производитель процессора: ${cpu}
- Назначение ПК: ${tasks}

Требования:
1. Собери полностью совместимые комплектующие: процессор, материнская плата, оперативная память, видеокарта, SSD/HDD, блок питания, корпус, система охлаждения.
2. Укажи реальные модели комплектующих и примерные цены.
3. Подсчитай итоговую стоимость и оставь небольшой запас бюджета (~5-10%).
4. Объясни свой выбор каждого компонента, чтобы пользователь понимал, почему эта сборка оптимальна.
5. Оптимизируй соотношение цена/производительность.
6. Выводи результат структурированно и красиво.
7. Не используй фантазийные компоненты, только реальные существующие модели.
8. Подскажи пользователю, если можно улучшить сборку за счет бюджета или если бюджет ограничен.
`;
}

// Endpoint для фронтенда
app.post('/api/build', async (req, res) => {
    const { budget, gpu, cpu, tasks, lang } = req.body;
    const currency = lang === 'ru' ? 'рублях' : 'долларах';

    const prompt = buildPrompt({ budget, gpu, cpu, tasks, currency });

    try {
        // Отправка запроса к LLM (DeepSeek / Llama 3 через Ollama)
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'deepseek',
                prompt: prompt,
                stream: false
            })
        });

        const data = await response.json();

        // Возвращаем фронту результат
        res.json({ result: data.response });

    } catch (err) {
        console.error(err);
        res.json({ result: lang === 'ru' ? '❌ Ошибка сервера. Попробуйте позже.' : '❌ Server error. Try later.' });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
