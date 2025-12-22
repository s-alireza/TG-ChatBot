import urllib.request
import json
import os

# Provided Groq API Key
GROQ_API_KEY = "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"

# Models to test as requested
MODELS_TO_TEST = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-maverick-17b",
    "qwen/qwen3-32b"
]

def test_groq_model(model_id):
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    data = {
        "messages": [
            {
                "role": "user",
                "content": "Hello"
            }
        ],
        "model": model_id
    }
    
    encoded_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method='POST')
    
    print(f"Testing {model_id}...", end=" ")
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("OK")
    except urllib.error.HTTPError as e:
        print(f"FAILED ({e.code})")
        print(f"Reason: {e.reason}")
        try:
            print(e.read().decode())
        except:
            pass

def list_groq_models():
    print("\n--- Listing Available Groq Models ---")
    url = "https://api.groq.com/openai/v1/models"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    req = urllib.request.Request(url, headers=headers, method='GET')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            data = result.get('data', [])
            ids = [m['id'] for m in data]
            print(f"Found {len(ids)} models.")
            for mid in ids:
                 if 'llama' in mid or 'gemma' in mid or 'qwen' in mid:
                    print(f"- {mid}")
    except Exception as e:
        print(f"Could not list models: {e}")

if __name__ == "__main__":
    print("Checking Groq Models...")
    for model in MODELS_TO_TEST:
        test_groq_model(model)
        
    list_groq_models()
