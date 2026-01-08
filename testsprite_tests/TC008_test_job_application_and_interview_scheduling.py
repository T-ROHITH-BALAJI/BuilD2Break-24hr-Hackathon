import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_job_application_and_interview_scheduling():
    # Authenticate as a job seeker to get a JWT token
    login_url = f"{BASE_URL}/api/auth/login"
    jobseeker_credentials = {
        "email": "testjobseeker@example.com",
        "password": "TestPassword123!"
    }
    try:
        login_resp = requests.post(login_url, json=jobseeker_credentials, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json().get("token")
        assert token, "No token received on login"
    except Exception as e:
        raise AssertionError(f"Authentication step failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    job_id = None
    application_id = None
    interview_id = None

    try:
        # Step 1: Retrieve list of jobs to apply for
        jobs_resp = requests.get(f"{BASE_URL}/api/jobseeker/jobs", headers=headers, timeout=TIMEOUT)
        assert jobs_resp.status_code == 200, f"Failed to get jobs: {jobs_resp.text}"
        jobs = jobs_resp.json()
        assert isinstance(jobs, list) and len(jobs) > 0, "Jobs list is empty"

        # Pick the first job to apply
        job_id = jobs[0].get("id")
        assert job_id, "Job id missing in jobs list"

        # Step 2: Apply for the selected job
        apply_payload = {
            "jobId": job_id,
            "coverLetter": "I am excited to apply for this position and bring my skills to your company."
        }
        apply_resp = requests.post(f"{BASE_URL}/api/jobseeker/applications", headers=headers, json=apply_payload, timeout=TIMEOUT)
        assert apply_resp.status_code == 201, f"Application creation failed: {apply_resp.text}"
        application = apply_resp.json()
        application_id = application.get("id")
        assert application_id, "Application ID not returned"

        # Step 3: Retrieve the application and verify status and data
        get_app_resp = requests.get(f"{BASE_URL}/api/jobseeker/applications/{application_id}", headers=headers, timeout=TIMEOUT)
        assert get_app_resp.status_code == 200, f"Failed to retrieve application: {get_app_resp.text}"
        application_data = get_app_resp.json()
        assert application_data.get("jobId") == job_id, "Application jobId mismatch"
        assert application_data.get("status") in ["submitted", "under_review"], "Unexpected application status"

        # Step 4: Schedule an interview for the application
        interview_payload = {
            "applicationId": application_id,
            "scheduledTime": "2030-12-01T15:00:00Z",
            "location": "Zoom Meeting",
            "notes": "Initial technical interview"
        }
        schedule_resp = requests.post(f"{BASE_URL}/api/jobseeker/interviews", headers=headers, json=interview_payload, timeout=TIMEOUT)
        assert schedule_resp.status_code == 201, f"Interview scheduling failed: {schedule_resp.text}"
        interview = schedule_resp.json()
        interview_id = interview.get("id")
        assert interview_id, "Interview ID not returned"

        # Step 5: Retrieve the scheduled interview and verify details
        get_interview_resp = requests.get(f"{BASE_URL}/api/jobseeker/interviews/{interview_id}", headers=headers, timeout=TIMEOUT)
        assert get_interview_resp.status_code == 200, f"Failed to retrieve interview: {get_interview_resp.text}"
        interview_data = get_interview_resp.json()
        assert interview_data.get("applicationId") == application_id, "Interview applicationId mismatch"
        assert interview_data.get("scheduledTime") == "2030-12-01T15:00:00Z", "Interview scheduledTime mismatch"
        assert interview_data.get("location") == "Zoom Meeting", "Interview location mismatch"
        assert interview_data.get("notes") == "Initial technical interview", "Interview notes mismatch"

        # Step 6: List all applications to check newly created application is listed
        list_apps_resp = requests.get(f"{BASE_URL}/api/jobseeker/applications", headers=headers, timeout=TIMEOUT)
        assert list_apps_resp.status_code == 200, f"Failed to list applications: {list_apps_resp.text}"
        applications = list_apps_resp.json()
        assert any(app.get("id") == application_id for app in applications), "New application not found in applications list"

        # Step 7: List all interviews to check newly created interview is listed
        list_interviews_resp = requests.get(f"{BASE_URL}/api/jobseeker/interviews", headers=headers, timeout=TIMEOUT)
        assert list_interviews_resp.status_code == 200, f"Failed to list interviews: {list_interviews_resp.text}"
        interviews = list_interviews_resp.json()
        assert any(itv.get("id") == interview_id for itv in interviews), "New interview not found in interviews list"

    finally:
        # Cleanup: Delete the created interview, application if exists
        if interview_id:
            try:
                del_itv_resp = requests.delete(f"{BASE_URL}/api/jobseeker/interviews/{interview_id}", headers=headers, timeout=TIMEOUT)
                assert del_itv_resp.status_code in [200,204], f"Failed to delete interview: {del_itv_resp.text}"
            except Exception:
                pass
        if application_id:
            try:
                del_app_resp = requests.delete(f"{BASE_URL}/api/jobseeker/applications/{application_id}", headers=headers, timeout=TIMEOUT)
                assert del_app_resp.status_code in [200,204], f"Failed to delete application: {del_app_resp.text}"
            except Exception:
                pass


test_job_application_and_interview_scheduling()