console.log('feddfghtd')
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

