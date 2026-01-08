import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Helper function to login as a job seeker user to get JWT token
# Using placeholder credentials because the PRD requires auth but does not specify test user creation

def get_auth_token():
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": "jobseeker@example.com",
        "password": "password123"
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed with status {response.status_code}"
    data = response.json()
    assert "token" in data, "Login response missing 'token'"
    return data["token"]


def test_profile_view_tracking_and_count_retrieval():
    token = get_auth_token()

    # Setup: Create two dummy userIds for viewer and profile owner
    profile_owner_id = str(uuid.uuid4())
    viewer_id = str(uuid.uuid4())
    
    track_url = f"{BASE_URL}/api/profile/view"
    count_url = f"{BASE_URL}/api/profile/views/{profile_owner_id}"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    payload = {
        "viewerUserId": viewer_id,
        "viewedUserId": profile_owner_id
    }

    # Using try-finally in case of any future resource cleanup
    try:
        # Track the profile view of viewerUserId viewing viewedUserId
        track_response = requests.post(track_url, json=payload, headers=headers, timeout=TIMEOUT)
        assert track_response.status_code == 200, f"Expected 200 OK, got {track_response.status_code}"
        # The response could be a message or count, just verify presence and type
        assert track_response.json() is not None

        # Track the same viewer again, should not increase unique count (idempotent or ignored)
        track_response_repeat = requests.post(track_url, json=payload, headers=headers, timeout=TIMEOUT)
        assert track_response_repeat.status_code == 200

        # Another viewer views the same profile to verify count update
        another_viewer_id = str(uuid.uuid4())
        payload_another_view = {
            "viewerUserId": another_viewer_id,
            "viewedUserId": profile_owner_id
        }
        track_response_another = requests.post(track_url, json=payload_another_view, headers=headers, timeout=TIMEOUT)
        assert track_response_another.status_code == 200

        # Retrieve the unique viewer count for the profile_owner_id
        count_response = requests.get(count_url, headers=headers, timeout=TIMEOUT)
        assert count_response.status_code == 200, f"Expected 200 OK, got {count_response.status_code}"

        count_data = count_response.json()
        # The count response should include the count, assuming a JSON object with "count" key or a raw integer
        # Accept either {"count": int} or just an integer in response JSON
        if isinstance(count_data, dict):
            assert "count" in count_data, "Response JSON missing 'count' key"
            count_value = count_data["count"]
        elif isinstance(count_data, int):
            count_value = count_data
        else:
            raise AssertionError("Unexpected format for view count response")

        # The count must be at least 2 due to two unique viewers tracked above
        assert isinstance(count_value, int) and count_value >= 2, f"Expected count >= 2, got {count_value}"

    finally:
        # No specific cleanup endpoint documented for profile views; nothing to delete
        pass


test_profile_view_tracking_and_count_retrieval()