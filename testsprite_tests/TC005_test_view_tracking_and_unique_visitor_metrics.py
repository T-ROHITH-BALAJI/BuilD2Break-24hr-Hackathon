import requests
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_view_tracking_and_unique_visitor_metrics():
    headers = {
        "Content-Type": "application/json"
    }

    # Helper function to track a view for given entity and id
    def track_view(entity, entity_id, viewer_id=None, session_id=None):
        payload = {
            "entity": entity,
            "id": entity_id
        }
        if viewer_id:
            payload["viewerId"] = viewer_id
        if session_id:
            payload["sessionId"] = session_id
        return requests.post(f"{BASE_URL}/api/views/track", json=payload, headers=headers, timeout=TIMEOUT)

    # Helper function to get unique view count for an entity
    def get_view_count(entity, entity_id):
        return requests.get(f"{BASE_URL}/api/views/{entity}/{entity_id}", headers=headers, timeout=TIMEOUT)

    # Step 1: Create test profile and job entities to simulate views (simulate entities)
    # Since no explicit API for creating profiles/jobs is described, 
    # we will simulate with dummy ids.
    test_profile_id = "test-profile-12345"
    test_job_id = "test-job-54321"

    # Define viewer and session IDs to simulate unique viewers
    viewer_ids = ["viewer1", "viewer2", "viewer3"]
    session_ids = ["session1", "session2", "session3"]

    # Step 2: Track unique views on profile and job by different viewers/sessions
    responses = []
    for v_id, s_id in zip(viewer_ids, session_ids):
        resp_profile = track_view("profile", test_profile_id, viewer_id=v_id, session_id=s_id)
        resp_job = track_view("job", test_job_id, viewer_id=v_id, session_id=s_id)
        responses.extend([resp_profile, resp_job])

    # Check all track view responses are 200
    for resp in responses:
        assert resp.status_code == 200, f"Expected 200 OK tracking view, got {resp.status_code}"

    # Step 3: Attempt to spam views by sending multiple views from same viewer/session quickly
    spam_responses = []
    for _ in range(5):
        resp_spam_profile = track_view("profile", test_profile_id, viewer_id="viewer1", session_id="session1")
        resp_spam_job = track_view("job", test_job_id, viewer_id="viewer1", session_id="session1")
        spam_responses.extend([resp_spam_profile, resp_spam_job])
        time.sleep(0.1)  # short sleep between requests

    # Step 4: Retrieve unique view counts for profile and job
    view_count_profile_resp = get_view_count("profile", test_profile_id)
    view_count_job_resp = get_view_count("job", test_job_id)

    assert view_count_profile_resp.status_code == 200, f"Failed to get view count for profile: {view_count_profile_resp.status_code}"
    assert view_count_job_resp.status_code == 200, f"Failed to get view count for job: {view_count_job_resp.status_code}"

    profile_count_data = view_count_profile_resp.json()
    job_count_data = view_count_job_resp.json()

    # The counts should match number of unique viewers (3) if rate limiting prevents counting repeated views
    # Assuming response JSON has {"uniqueViews": int} or similar - validate existence and type
    assert isinstance(profile_count_data, dict), "Profile count response JSON is not a dict"
    assert isinstance(job_count_data, dict), "Job count response JSON is not a dict"

    assert "uniqueViews" in profile_count_data, "Profile count response missing 'uniqueViews'"
    assert "uniqueViews" in job_count_data, "Job count response missing 'uniqueViews'"

    profile_unique_views = profile_count_data["uniqueViews"]
    job_unique_views = job_count_data["uniqueViews"]

    assert profile_unique_views == len(viewer_ids), f"Profile unique views expected {len(viewer_ids)}, got {profile_unique_views}"
    assert job_unique_views == len(viewer_ids), f"Job unique views expected {len(viewer_ids)}, got {job_unique_views}"

    # Step 5: Verify that spamming did not increase the count
    # Track count again, expect same counts
    repeated_profile_count_resp = get_view_count("profile", test_profile_id)
    repeated_job_count_resp = get_view_count("job", test_job_id)
    repeated_profile_count = repeated_profile_count_resp.json().get("uniqueViews")
    repeated_job_count = repeated_job_count_resp.json().get("uniqueViews")

    assert repeated_profile_count == profile_unique_views, "Spam views increased profile unique views unexpectedly"
    assert repeated_job_count == job_unique_views, "Spam views increased job unique views unexpectedly"

test_view_tracking_and_unique_visitor_metrics()
