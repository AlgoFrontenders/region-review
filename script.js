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