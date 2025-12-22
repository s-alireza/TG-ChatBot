import urllib.request
import json
import os

# API Key from your project context
API_KEY = "AIzaSyDCZoC00Rx1Wb3DTjzOSNT6BHCR8anxMvg"

# List of models to test
MODELS_TO_TEST = [
    "gemini-2.5-flash",
    "gemini-3-flash",          # From image (checking if stable exists)
    "gemini-3-flash-preview",  # Currently using
    "gemini-2.5-flash-lite",   # From image
    "gemma-3-27b-it",          # Checking if Gemma is supported via API
]

def test_model(model_name):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{
            "parts": [{"text": "Hello, are you working?"}]
        }]
    }
    
    encoded_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method='POST')
    
    print(f"Testing {model_name}...", end=" ")
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            if 'candidates' in result:
                print("OK")
            else:
                print("NO CANDIDATES")
    except urllib.error.HTTPError as e:
        print(f"FAILED ({e.code})")
        print(f"Server Response: {e.read().decode()}")
    except Exception as e:
        print(f"ERROR: {e}")

def list_models():
    print("\n--- Listing Available Models (Partial) ---")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    try:
        with urllib.request.urlopen(url) as response:
            result = json.loads(response.read().decode())
            for model in result.get('models', []):
                name = model['name'].replace('models/', '')
                if 'gemini' in name:
                    print(f"- {name}")
    except Exception as e:
        print(f"Could not list models: {e}")

if __name__ == "__main__":
    print(f"Checking models functionality...")
    for model in MODELS_TO_TEST:
        test_model(model)
    
    list_models()
