import requests
import copy

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Assumed authentication: For test purposes, a job seeker user token is required.
# Since no auth endpoint details nor token are provided, replace this with a valid JWT token string.
JOBSEEKER_AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.jobseeker_token_placeholder"


def test_jobseeker_resume_management():
    headers = {
        "Authorization": JOBSEEKER_AUTH_TOKEN,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    created_resume_ids = []

    try:
        # Create two resumes
        resume_data_1 = {
            "title": "Software Engineer Resume",
            "summary": "Detail-oriented software engineer with 5 years of experience.",
            "skills": ["Python", "Django", "REST API", "SQL"],
            "experiences": [
                {
                    "company": "Tech Corp",
                    "role": "Backend Developer",
                    "start_date": "2020-01-01",
                    "end_date": "2023-01-01",
                    "description": "Developed APIs and backend services."
                }
            ],
            "education": [
                {
                    "institution": "State University",
                    "degree": "BSc Computer Science",
                    "start_date": "2015-09-01",
                    "end_date": "2019-06-01"
                }
            ]
        }
        resp_create_1 = requests.post(
            f"{BASE_URL}/api/jobseeker/resumes",
            json=resume_data_1,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert resp_create_1.status_code == 201
        resume_1 = resp_create_1.json()
        assert "id" in resume_1
        created_resume_ids.append(resume_1["id"])

        resume_data_2 = {
            "title": "Data Scientist Resume",
            "summary": "Experienced data scientist with a focus on machine learning.",
            "skills": ["Python", "Pandas", "scikit-learn", "Data Visualization"],
            "experiences": [
                {
                    "company": "Data Insights",
                    "role": "Data Scientist",
                    "start_date": "2019-07-01",
                    "end_date": "2022-12-01",
                    "description": "Created predictive models and data visualizations."
                }
            ],
            "education": [
                {
                    "institution": "Tech Institute",
                    "degree": "MSc Data Science",
                    "start_date": "2017-09-01",
                    "end_date": "2019-06-01"
                }
            ]
        }
        resp_create_2 = requests.post(
            f"{BASE_URL}/api/jobseeker/resumes",
            json=resume_data_2,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert resp_create_2.status_code == 201
        resume_2 = resp_create_2.json()
        assert "id" in resume_2
        created_resume_ids.append(resume_2["id"])

        # Update the first resume - add a new skill and update summary
        updated_resume_1 = copy.deepcopy(resume_data_1)
        updated_resume_1["summary"] = "Senior software engineer with 6 years of experience."
        updated_resume_1["skills"].append("Docker")

        resp_update_1 = requests.put(
            f"{BASE_URL}/api/jobseeker/resumes/{resume_1['id']}",
            json=updated_resume_1,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert resp_update_1.status_code == 200
        updated_resume_resp = resp_update_1.json()
        assert updated_resume_resp.get("summary") == updated_resume_1["summary"]
        assert "Docker" in updated_resume_resp.get("skills", [])

        # Retrieve and verify both resumes
        for resume_id, original_data in zip(created_resume_ids, [updated_resume_1, resume_data_2]):
            resp_get = requests.get(
                f"{BASE_URL}/api/jobseeker/resumes/{resume_id}",
                headers=headers,
                timeout=TIMEOUT,
            )
            assert resp_get.status_code == 200
            resume = resp_get.json()
            # Basic verification of keys and content
            assert resume["id"] == resume_id
            assert resume["title"] == original_data["title"]
            ats_scan_val = resume.get("ats_scan")
            assert isinstance(ats_scan_val, (str, dict)) or ats_scan_val is None
            # Confirm skills contain listed skills
            for skill in original_data["skills"]:
                assert skill in resume.get("skills", [])

        # Run ATS scan on the second resume and verify response
        resp_ats_scan = requests.post(
            f"{BASE_URL}/api/jobseeker/resumes/{resume_2['id']}/ats-scan",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert resp_ats_scan.status_code == 200
        ats_scan_result = resp_ats_scan.json()
        assert "score" in ats_scan_result and isinstance(ats_scan_result["score"], (int, float))
        assert "feedback" in ats_scan_result

    finally:
        # Clean up: delete created resumes
        for resume_id in created_resume_ids:
            try:
                resp_delete = requests.delete(
                    f"{BASE_URL}/api/jobseeker/resumes/{resume_id}",
                    headers=headers,
                    timeout=TIMEOUT,
                )
                # Accept 200 or 204 or 404 (if already deleted)
                assert resp_delete.status_code in (200, 204, 404)
            except Exception:
                pass


test_jobseeker_resume_management()
