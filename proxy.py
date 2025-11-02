import requests
import json
import time
import base64
import uuid
from typing import Dict


from flask import Flask, request, jsonify
from flask_cors import CORS




class GigaChatModel():
   def __init__(self):
       self.client_id = '019a1fae-8df9-7524-b768-7cc385b051a5'
       self.client_secret ='e03fff22-ad7d-4242-ab69-1680a29a2ae2'
       self.scope = 'GIGACHAT_API_PERS'
       self.base_url = 'https://gigachat.devices.sberbank.ru/api/v1'
       self.token_url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
      
       self.access_token = None
       self.token_expires_at = 0
      
   def _get_basic_auth_header(self) -> str:
       credentials = f"{self.client_id}:{self.client_secret}"
       encoded_credentials = base64.b64encode(credentials.encode()).decode()
       return f"Basic {encoded_credentials}"
      
   def _get_access_token(self) -> str:
       if self.access_token and time.time() < self.token_expires_at:
           return self.access_token


       headers = {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Accept': 'application/json',
           'RqUID': str(uuid.uuid4()),
           'Authorization': self._get_basic_auth_header()
       }
      
       data = {
           'scope': self.scope
       }
      
       try:
           response = requests.post(
               self.token_url,
               headers=headers,
               data=data,
               verify=False,
               timeout=10
           )


           response.raise_for_status()
           token_data = response.json()
          
           self.access_token = token_data.get('access_token')
           expires_in = token_data.get('expires_in', 1800)
          
           self.token_expires_at = time.time() + expires_in - 60
          
           return self.access_token
          
       except requests.exceptions.RequestException as e:
           raise Exception(f"Ошибка получения токена: {e}")
  
   def _get_auth_headers(self) -> Dict[str, str]:
       token = self._get_access_token()
       return {
           'Authorization': f'Bearer {token}',
           'Content-Type': 'application/json'
       }
  
   def query(self, text: str, temperature: float = 0.7, max_tokens: int = 1024, prompt='') -> str:
       try:
           payload = {
               "model": "GigaChat", 
               "messages": [
                    {
                        'role': 'system',
                        'content': prompt,
                    },
                   {
                       "role": "user",
                       "content": text,
                   }
               ],
               "temperature": temperature,
               "max_tokens": max_tokens,
               "stream": False
           }
          
           response = requests.post(
               f"{self.base_url}/chat/completions",
               headers=self._get_auth_headers(),
               json=payload,
               verify=False,
               timeout=30
           )
          
           response.raise_for_status()
           result = response.json()
          
           return result['choices'][0]['message']['content']
          
       except requests.exceptions.RequestException as e:
           raise Exception(f"Ошибка API: {e}")
      


model = GigaChatModel()
app = Flask(__name__)
CORS(app)


# Исправленный endpoint
@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
   try:
       data = request.get_json()
       print(f"Received data: {data}")  # Для отладки
      
       # Исправление: получаем текст из JSON тела
       if isinstance(data, str):
           text = data
       elif isinstance(data, dict):
           text = data.get('text', '') if data else ''
       else:
           text = ''
      
       if not text:
           return jsonify({"error": "Текст запроса не может быть пустым"}), 400
          
       response_text = model.query(text=text, prompt=data.get('prompt',''))
       return jsonify({"response": response_text}), 200
      
   except Exception as e:
       print(f"Error: {e}")  # Для отладки
       return jsonify({"error": str(e)}), 500


# Добавим корневой route для теста
@app.route('/')
def home():
   return jsonify({"message": "Flask server is running!"})


# Запускаем на всех интерфейсах
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
print ('323')