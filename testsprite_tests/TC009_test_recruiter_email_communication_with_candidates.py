import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_recruiter_email_communication_with_candidates():
    # Assumptions:
    # - There is an authentication endpoint at /api/auth/login for recruiters
    # - Recruiters send emails via POST /api/recruiter/email with payload containing candidate email and message
    # - To test sending email, a candidate user needs to exist or be created
    # - The API requires Authorization header with Bearer token for authenticated recruiter calls
    # - There is an endpoint to create a candidate (job seeker) at /api/jobseeker/register
    # - There is an endpoint to delete the candidate at /api/jobseeker/{id} (assuming DELETE)
    # - No direct schema details for candidate creation or email sending, so using reasonable fields
    # - Email sending endpoint: POST /api/recruiter/email (as logical guess)
    # - Validate that the response status is success and response body contains confirmation/log info

    recruiter_credentials = {
        "email": "recruiter@example.com",
        "password": "RecruiterPass123"
    }

    candidate_data = {
        "email": f"candidate_{uuid.uuid4().hex[:8]}@example.com",
        "password": "CandidatePass123",
        "role": "jobseeker",
        "firstName": "Test",
        "lastName": "Candidate"
    }

    email_payload = {
        "to": None,  # to be set with candidate email
        "subject": "Job Opportunity",
        "body": "Dear candidate, we are interested in your profile. Please respond."
    }

    try:
        # 1. Login recruiter to obtain JWT token
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=recruiter_credentials,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Recruiter login failed: {login_resp.text}"
        recruiter_token = login_resp.json().get("token")
        assert recruiter_token, "No token returned on recruiter login"

        headers = {
            "Authorization": f"Bearer {recruiter_token}",
            "Content-Type": "application/json"
        }

        # 2. Create a candidate (job seeker) to send email to
        create_candidate_resp = requests.post(
            f"{BASE_URL}/api/jobseeker/register",
            json=candidate_data,
            timeout=TIMEOUT
        )
        assert create_candidate_resp.status_code == 201, f"Candidate creation failed: {create_candidate_resp.text}"
        created_candidate = create_candidate_resp.json()
        candidate_id = created_candidate.get("id") or created_candidate.get("userId")
        candidate_email = created_candidate.get("email") or candidate_data["email"]
        assert candidate_id is not None, "Candidate ID missing in creation response"
        assert candidate_email is not None, "Candidate email missing in creation response"

        # 3. Send email from recruiter to candidate
        email_payload["to"] = candidate_email

        send_email_resp = requests.post(
            f"{BASE_URL}/api/recruiter/email",
            headers=headers,
            json=email_payload,
            timeout=TIMEOUT
        )

        # Validate 200 or 202 acceptance for email send
        assert send_email_resp.status_code in (200, 202), f"Email send failed: {send_email_resp.text}"

        email_response_data = send_email_resp.json()
        # Validate presence of any confirmation/log keys
        assert "message" in email_response_data or "status" in email_response_data, "No confirmation/log in email response"

    finally:
        # Cleanup: delete created candidate if exists and token is available
        try:
            if 'candidate_id' in locals():
                # Assume recruiter token can't delete candidate; try unauth or no auth for user delete
                # Best effort delete - might require admin token or candidate login in real scenario
                requests.delete(
                    f"{BASE_URL}/api/jobseeker/{candidate_id}",
                    timeout=TIMEOUT
                )
        except Exception:
            pass

test_recruiter_email_communication_with_candidates()