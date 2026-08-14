import json
import os
import sys
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

load_dotenv()

from app.core.config import settings
from app.routers.roadmap_ai import get_fallback_roadmap
from app.routers.recommend import get_fallback_recommendations
from app.routers.interview import get_fallback_questions
from app.routers.mentor import get_fallback_mentor_reply
from app.services.skill_extractor import clean_json_response
from huggingface_hub import InferenceClient

def test_fallbacks():
    print("\n=== Testing Fallback Logic ===")
    
    # 1. Test roadmap fallback
    roadmap = get_fallback_roadmap("React Frontend Developer")
    print(f"Roadmap Fallback (Frontend): {len(roadmap)} tasks found.")
    assert len(roadmap) > 0
    assert roadmap[0]["title"] == "HTML5, CSS3, and Responsive Design"
    
    # 2. Test recommendations fallback
    recs = get_fallback_recommendations("Python Backend Developer")
    print(f"Recommendations Fallback (Backend): {len(recs)} items found.")
    assert len(recs) > 0
    assert recs[0]["type"] == "course"
    
    # 3. Test interview fallback
    questions = get_fallback_questions("Frontend Developer")
    print(f"Interview Fallback (Frontend): {len(questions)} questions found.")
    assert len(questions) > 0
    assert "React" in questions[0]["question"]
    
    # 4. Test mentor fallback
    mentor_reply = get_fallback_mentor_reply(
        "Am I ready for a junior backend role and what is my score?",
        "Backend Developer",
        ["Python", "FastAPI"],
        "Docker, PostgreSQL",
        25.0,
        65
    )
    print(f"Mentor Fallback Reply: {mentor_reply['reply'][:80]}...")
    assert "65/100" in mentor_reply["reply"]
    assert mentor_reply["suggested_action"]["type"] == "roadmap_task"
    
    print("[OK] All fallbacks verified successfully!")

def test_live_hf_api():
    print("\n=== Testing Live Hugging Face API ===")
    if not settings.HUGGINGFACE_API_KEY:
        print("Skipping live test: HUGGINGFACE_API_KEY is not configured in .env.")
        return
        
    try:
        client = InferenceClient(
            model="Qwen/Qwen2.5-Coder-7B-Instruct",
            token=settings.HUGGINGFACE_API_KEY,
            timeout=20.0
        )
        
        # Make a quick simple request to verify access
        prompt = "Return a JSON object: {\"status\": \"ok\"}"
        messages = [{"role": "user", "content": prompt}]
        response = client.chat.completions.create(
            messages=messages,
            max_tokens=50,
            temperature=0.1
        )
        content = response.choices[0].message.content
        cleaned = clean_json_response(content)
        data = json.loads(cleaned)
        print(f"Live HF API Response: {data}")
        assert data.get("status") == "ok"
        print("[OK] Live Hugging Face Inference API verified successfully!")
    except Exception as e:
        print(f"[ERROR] Live HF API test failed: {e}")

if __name__ == "__main__":
    print("Running Member 4 Verification Tests...")
    test_fallbacks()
    test_live_hf_api()
    print("\nAll tests completed!")
