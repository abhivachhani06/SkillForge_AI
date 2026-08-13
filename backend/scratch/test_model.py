import os
import sys
from huggingface_hub import InferenceClient

# Add system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def test_model(model_name):
    print(f"Testing model: {model_name}...")
    client = InferenceClient(model=model_name, token=settings.HUGGINGFACE_API_KEY, timeout=30.0)
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": "Return a JSON object with a single key 'status' set to 'success'. No markdown, no conversational text."}],
            max_tokens=100,
            temperature=0.1
        )
        print(f"Success! Response: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"Failed: {e}")
        return False

if __name__ == "__main__":
    models_to_try = [
        "Qwen/Qwen2.5-Coder-7B-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "mistralai/Mistral-7B-Instruct-v0.3",
        "HuggingFaceH4/zephyr-7b-beta"
    ]
    for model in models_to_try:
        if test_model(model):
            print(f"=== Found working model: {model} ===")
            break
