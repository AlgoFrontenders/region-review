const API_BASE_URL = 'http://127.0.0.1:5000';

async function sendMessage() {
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('send-button');
    const responseDiv = document.getElementById('response');

    const message = messageInput.value.trim();

    if (!message) {
        alert('Пожалуйста, введите сообщение');
        return;
    }

    // Блокируем кнопку и показываем загрузку
    sendButton.disabled = true;
    responseDiv.className = '';
    responseDiv.innerHTML = '<span class="loading">Отправка запроса к GigaChat...</span>';


    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'Ты умный ассистент на сайте о городе Санкт-Петербург и должен отвечать на вопросы о Санкт-Петербурге. На вопросы не по теме всегда отвечай ТОЛЬКО "Это вопрос не по теме."',
                text: `'${message}' - это вопрос по твоему промту?`,
                temperature: 0.7,
                max_tokens: 512
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.response.includes('нет') || data.response.includes('Нет')) {
            responseDiv.textContent = 'Это вопрос не по теме.'

        } else {
            try {
                const response = await fetch(`${API_BASE_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: 'Ты умный ассистент на сайте о городе Санкт-Петербург и должен отвечать на вопросы о Санкт-Петербурге. На вопросы не по теме всегда отвечай ТОЛЬКО "Это вопрос не по теме."',
                        text: message,
                        temperature: 0.7,
                        max_tokens: 512
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                responseDiv.textContent = data.response;

            } catch (error) {
                console.error('Ошибка:', error);
                responseDiv.className = 'error';
                responseDiv.textContent = `Ошибка: ${error.message}`;
            } finally {
                // Разблокируем кнопку
                sendButton.disabled = false;
            }
        }



    } catch (error) {
        console.error('Ошибка:', error);
        responseDiv.className = 'error';
        responseDiv.textContent = `Ошибка: ${error.message}`;
    } finally {
        // Разблокируем кнопку
        sendButton.disabled = false;
    }

}

// Обработка нажатия Enter (Ctrl+Enter для отправки)
document.getElementById('messageInput').addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'Enter') {
        sendMessage();
    }
});

// Проверка подключения к серверу при загрузке
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            console.log('Сервер доступен');
        }
    } catch (error) {
        console.error('Сервер недоступен:', error);
        const responseDiv = document.getElementById('response');
        responseDiv.className = 'error';
        responseDiv.textContent = 'Ошибка: Сервер Flask недоступен. Убедитесь, что server.py запущен.';
    }
});
class GigaChatClient {
    constructor(token) {
        this.token = token;
        this.accessToken = null;
        this.tokenExpires = null;
    }

    async getAccessToken() {
        // Проверяем, не истек ли токен
        if (this.accessToken && this.tokenExpires && Date.now() < this.tokenExpires) {
            return this.accessToken;
        }

        const authUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
        
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${this.token}`,
                'Accept': 'application/json'
            },
            body: 'scope=GIGACHAT_API_PERS'
        });

        if (!response.ok) {
            throw new Error(`Ошибка авторизации: ${response.status}`);
        }

        const result = await response.json();
        this.accessToken = result.access_token;
        // Устанавливаем время истечения токена (минус 1 минута для надежности)
        this.tokenExpires = Date.now() + (result.expires_in - 60) * 1000;
        
        return this.accessToken;
    }

    async sendMessage(prompt, systemMessage = "Ты полезный ассистент") {
        const apiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
        
        try {
            const accessToken = await this.getAccessToken();

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: "GigaChat",
                    messages: [
                        {
                            role: "system",
                            content: systemMessage
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }

            const result = await response.json();
            return result.choices[0].message.content;

        } catch (error) {
            console.error('Ошибка:', error);
            throw error;
        }
    }
}

// Использование
const client = new GigaChatClient('MDE5YTFmYWUtOGRmOS03NTI0LWI3NjgtN2NjMzg1YjA1MWE1Ojk3MTM0ZjNiLWRiYzctNGVlZC04OGZhLTk1NjBhODk2NzlhNg==');

// Отправка сообщения
client.sendMessage("Привет! Расскажи о себе.")
    .then(response => console.log("Ответ:", response))
    .catch(error => console.error("Ошибка:", error));
