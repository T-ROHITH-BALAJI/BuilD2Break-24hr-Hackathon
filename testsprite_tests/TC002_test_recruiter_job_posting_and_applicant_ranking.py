import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# These credentials should be valid recruiter credentials in the system for testing
RECRUITER_CREDENTIALS = {
    "email": "testrecruiter@example.com",
    "password": "TestPassword123!"
}

def test_recruiter_job_posting_and_applicant_ranking():
    headers = {"Content-Type": "application/json"}
    session = requests.Session()
    try:
        # Step 1: Login as recruiter and get JWT token
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json=RECRUITER_CREDENTIALS,
            timeout=TIMEOUT,
            headers=headers
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "token" in login_data, "No token found in login response"
        token = login_data["token"]
        auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Step 2: Post a new job
        new_job_payload = {
            "title": "Test Automation Engineer",
            "description": "Responsible for creating automated tests.",
            "location": "Remote",
            "employment_type": "Full-time",
            "salary_range": {"min": 70000, "max": 90000},
            "requirements": ["Python", "Selenium", "API testing"],
            "benefits": ["Health insurance", "401k matching"]
        }
        post_job_resp = session.post(
            f"{BASE_URL}/api/recruiter/jobs",
            json=new_job_payload,
            timeout=TIMEOUT,
            headers=auth_headers
        )
        assert post_job_resp.status_code == 201, f"Job posting failed with status {post_job_resp.status_code}"
        job_data = post_job_resp.json()
        assert "id" in job_data, "Job ID not returned after creation"
        job_id = job_data["id"]

        # Step 3: Update the existing job listing
        update_job_payload = {
            "title": "Senior Test Automation Engineer",
            "description": "Lead and develop automated test frameworks.",
            "location": "Remote",
            "employment_type": "Full-time",
            "salary_range": {"min": 85000, "max": 110000},
            "requirements": ["Python", "Selenium", "API testing", "Leadership"],
            "benefits": ["Health insurance", "401k matching", "Remote work stipend"]
        }
        update_resp = session.put(
            f"{BASE_URL}/api/recruiter/jobs/{job_id}",
            json=update_job_payload,
            timeout=TIMEOUT,
            headers=auth_headers
        )
        assert update_resp.status_code == 200, f"Job update failed with status {update_resp.status_code}"
        updated_job = update_resp.json()
        assert updated_job.get("title") == update_job_payload["title"], "Job title not updated correctly"
        assert updated_job.get("salary_range") == update_job_payload["salary_range"], "Salary range not updated"

        # Step 4: Retrieve applicant list for the job
        applicants_resp = session.get(
            f"{BASE_URL}/api/recruiter/jobs/{job_id}/applicants",
            timeout=TIMEOUT,
            headers=auth_headers
        )
        assert applicants_resp.status_code == 200, f"Failed to get applicants list, status {applicants_resp.status_code}"
        applicants_data = applicants_resp.json()
        assert isinstance(applicants_data, list), "Applicants list response is not a list"

        # Validate ATS-based auto-ranking is present and correctly formatted for each applicant if any applicants exist
        for applicant in applicants_data:
            assert "ats_score" in applicant, "ATS score missing for applicant"
            assert isinstance(applicant["ats_score"], (int, float)), "ATS score is not numeric"
            assert "candidate_id" in applicant, "Candidate ID missing in applicant data"
            # Additional optional UI reflected checks can be included if UI data provided via API

    finally:
        # Cleanup: Delete the created job listing if job_id exists
        try:
            if 'job_id' in locals():
                delete_resp = session.delete(
                    f"{BASE_URL}/api/recruiter/jobs/{job_id}",
                    timeout=TIMEOUT,
                    headers=auth_headers
                )
                assert delete_resp.status_code in (200, 204), f"Failed to delete job with status {delete_resp.status_code}"
        except Exception:
            pass

test_recruiter_job_posting_and_applicant_ranking()