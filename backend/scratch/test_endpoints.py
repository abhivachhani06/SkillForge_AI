import os
import sys
import uuid
from fastapi.testclient import TestClient

# Add project root to path so we can import app modules
project_root = r"c:\Users\sbbha\OneDrive\Desktop\SKILL_FRONTEND\SkillForge_AI\backend"
sys.path.insert(0, project_root)

from app.main import app
from app.core.auth import get_current_user, CurrentUser
from app.core.db import SessionLocal, Student, CareerProfile, SkillGap, RoadmapTask, ReadinessScore

# Define test user ID (valid UUID)
TEST_USER_ID = uuid.UUID("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d")
TEST_USER_EMAIL = "test.verification.user@example.com"
TEST_USER_NAME = "Test Verification User"

# Mock current user dependency
def mock_get_current_user():
    return CurrentUser(
        id=TEST_USER_ID,
        email=TEST_USER_EMAIL,
        full_name=TEST_USER_NAME
    )

# Apply dependency override
app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def cleanup_db(db):
    print("Cleaning up database test records...")
    # Delete test scores
    db.query(ReadinessScore).filter(ReadinessScore.student_id == TEST_USER_ID).delete()
    # Delete test roadmap tasks
    db.query(RoadmapTask).filter(RoadmapTask.student_id == TEST_USER_ID).delete()
    # Delete test skill gaps
    db.query(SkillGap).filter(SkillGap.student_id == TEST_USER_ID).delete()
    # Delete test career profiles
    db.query(CareerProfile).filter(CareerProfile.student_id == TEST_USER_ID).delete()
    # Delete test student profile
    db.query(Student).filter(Student.id == TEST_USER_ID).delete()
    db.commit()

def run_tests():
    db = SessionLocal()
    try:
        # Pre-test cleanup
        cleanup_db(db)

        print("\n--- TEST 1: POST /api/students/onboarding ---")
        onboarding_payload = {
            "education": "B.Tech in Computer Science",
            "experience_level": "intermediate",
            "target_role": "Full-Stack Software Engineer",
            "interests": ["Web Development", "Machine Learning"],
            "preferred_learning_hours_per_week": 15,
            "current_skills": ["Python", "JavaScript", "HTML"]
        }
        
        headers = {"Authorization": "Bearer dummy_token"}
        response = client.post("/api/students/onboarding", json=onboarding_payload, headers=headers)
        
        assert response.status_code == 200, f"Onboarding failed: {response.text}"
        data = response.json()
        print("Onboarding Response:", data)
        assert data["name"] == TEST_USER_NAME
        assert data["onboarding_complete"] is True
        assert data["student"]["target_role"] == "Full-Stack Software Engineer"
        print("Test 1 Passed!")

        print("\n--- TEST 2: GET /api/students/me ---")
        response = client.get("/api/students/me", headers=headers)
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        print("Me Response:", data)
        assert data["name"] == TEST_USER_NAME
        assert data["onboarding_complete"] is True
        assert "readiness_score" in data
        assert data["readiness_score"] == 100.0  # No gaps and 0 tasks means 100 base score
        print("Test 2 Passed!")

        print("\n--- Setup Gaps and Tasks for calculations ---")
        # Add a skill gap
        gap1 = SkillGap(
            student_id=TEST_USER_ID,
            skill="System Design",
            severity="high",
            why_it_matters="Important for scaling",
            readiness_component_score=20.0
        )
        db.add(gap1)
        
        # Add roadmap tasks
        task1 = RoadmapTask(
            student_id=TEST_USER_ID,
            title="Study CAP Theorem",
            description="Understand tradeoffs",
            priority="high",
            estimated_hours=5.0,
            prerequisites=[],
            status="pending",
            week_number=1
        )
        task2 = RoadmapTask(
            student_id=TEST_USER_ID,
            title="Study Load Balancers",
            description="Learn Nginx & HAProxy",
            priority="medium",
            estimated_hours=4.0,
            prerequisites=[],
            status="pending",
            week_number=1
        )
        db.add(task1)
        db.add(task2)
        db.commit()
        
        db.refresh(task1)
        db.refresh(task2)
        print("Skill gaps and tasks seeded successfully.")

        print("\n--- TEST 3: GET /api/roadmap ---")
        response = client.get("/api/roadmap", headers=headers)
        assert response.status_code == 200, f"Get roadmap failed: {response.text}"
        data = response.json()
        print("Roadmap Response Length:", len(data))
        assert len(data) == 2
        # Verify ordering: week_number, then priority (high before medium)
        assert data[0]["title"] == "Study CAP Theorem"
        assert data[1]["title"] == "Study Load Balancers"
        print("Test 3 Passed!")

        print("\n--- TEST 4: PATCH /api/roadmap/{task_id} ---")
        # Mark task1 as done
        task_id = str(task1.id)
        response = client.patch(f"/api/roadmap/{task_id}", json={"status": "done"}, headers=headers)
        assert response.status_code == 200, f"Patch task failed: {response.text}"
        data = response.json()
        print("Patch Response:", data)
        assert data["status"] == "done"
        # Progress: 1 out of 2 tasks done = 50%
        assert data["updated_progress"] == 50.0
        
        # Verify readiness score update in db
        db_score = db.query(ReadinessScore).filter(ReadinessScore.student_id == TEST_USER_ID).first()
        print("Readiness score in DB:", db_score.score, db_score.breakdown)
        # avg_gap_score = 20.0
        # roadmap_progress_pct = 50.0
        # Formula: score = round(100 - avg_gap_score * 0.6 + progress_pct * 0.4)
        # score = round(100 - 20 * 0.6 + 50 * 0.4) = round(100 - 12 + 20) = 108 -> clamped to 100
        assert db_score.score == 100.0
        print("Test 4 Passed!")

        print("\n--- TEST 5: GET /api/progress/summary ---")
        response = client.get("/api/progress/summary", headers=headers)
        assert response.status_code == 200, f"Get progress summary failed: {response.text}"
        data = response.json()
        print("Progress Summary Response:", data)
        assert data["readiness_score"] == 100.0
        assert data["roadmap_progress_pct"] == 50.0
        assert "System Design" in data["breakdown"]
        assert data["breakdown"]["System Design"] == 20
        print("Test 5 Passed!")

        print("\n--- TEST 6: Cross-user access check ---")
        # Simulate user B attempting to modify user A's task
        # We override auth dependency to a different user
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id=uuid.UUID("b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"),
            email="intruder@example.com",
            full_name="Intruder"
        )
        
        response = client.patch(f"/api/roadmap/{task_id}", json={"status": "done"}, headers=headers)
        # Should return 404
        assert response.status_code == 404, f"Intruder was allowed: {response.text}"
        print("Cross-user access blocked successfully (Test 6 Passed!)")
        
    finally:
        # Restore override
        app.dependency_overrides[get_current_user] = mock_get_current_user
        # Final cleanup
        cleanup_db(db)
        db.close()

if __name__ == "__main__":
    print("Running backend integration tests...")
    try:
        run_tests()
        print("\nALL TESTS PASSED SUCCESSFULLY!")
    except AssertionError as e:
        print(f"\nTEST ASSERTION FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUNEXPECTED EXCEPTION DURING TESTS: {e}")
        sys.exit(1)
