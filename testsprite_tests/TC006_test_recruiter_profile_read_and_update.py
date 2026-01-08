import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Placeholder credentials for recruiter login (should be replaced with valid ones)
RECRUITER_LOGIN_URL = f"{BASE_URL}/api/auth/login"
RECRUITER_PROFILE_URL = f"{BASE_URL}/api/recruiter/profile"

# Sample recruiter credentials - MUST be valid in the test environment
RECRUITER_CREDENTIALS = {
    "email": "testrecruiter@example.com",
    "password": "TestPassword123!"
}

# Sample data to create a new recruiter profile if needed
NEW_RECRUITER_PROFILE = {
    "company_name": "Test Company Inc",
    "contact_name": "Test Recruiter",
    "phone": "+1234567890",
    "website": "https://testcompany.example.com",
    "bio": "Recruiter for testing purposes"
}

# Sample updates for recruiter profile
UPDATED_PROFILE_DATA = {
    "company_name": "Updated Company LLC",
    "contact_name": "Updated Recruiter",
    "phone": "+0987654321",
    "website": "https://updatedcompany.example.com",
    "bio": "Updated recruiter profile for testing update endpoint"
}


def test_recruiter_profile_read_and_update():
    # First, log in to get an authentication token
    try:
        login_resp = requests.post(
            RECRUITER_LOGIN_URL,
            json=RECRUITER_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status_code {login_resp.status_code}"
        token = login_resp.json().get("token")
        assert token, "No token returned in login response"
    except Exception as e:
        raise AssertionError(f"Recruiter login failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Attempt to GET current recruiter profile
    try:
        profile_resp = requests.get(RECRUITER_PROFILE_URL, headers=headers, timeout=TIMEOUT)
    except Exception as e:
        raise AssertionError(f"GET recruiter profile request failed: {e}")

    if profile_resp.status_code == 404:
        # Profile not found - create a new profile using PUT as per endpoint (assuming PUT creates if not exists)
        try:
            create_resp = requests.put(RECRUITER_PROFILE_URL, headers=headers, json=NEW_RECRUITER_PROFILE, timeout=TIMEOUT)
            assert create_resp.status_code == 200, f"Profile creation failed with status code {create_resp.status_code}"
        except Exception as e:
            raise AssertionError(f"Profile creation failed: {e}")

        # Retry getting the profile after creation
        try:
            profile_resp = requests.get(RECRUITER_PROFILE_URL, headers=headers, timeout=TIMEOUT)
            assert profile_resp.status_code == 200, "Profile should exist after creation but GET failed"
            profile_data = profile_resp.json()
            # Basic assertions on profile content type (dict)
            assert isinstance(profile_data, dict), "Profile data is not a dictionary after creation"
        except Exception as e:
            raise AssertionError(f"GET recruiter profile after creation failed: {e}")

    elif profile_resp.status_code == 200:
        # Profile found, parse data
        profile_data = profile_resp.json()
        assert isinstance(profile_data, dict), "Returned profile data is not a dictionary"
    else:
        raise AssertionError(f"Unexpected status code for GET recruiter profile: {profile_resp.status_code}")

    # Try updating the recruiter profile with new data
    try:
        update_resp = requests.put(RECRUITER_PROFILE_URL, headers=headers, json=UPDATED_PROFILE_DATA, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Profile update failed with status code {update_resp.status_code}"
        updated_data = update_resp.json()
        # Validate updated fields returned match input where applicable
        for key, value in UPDATED_PROFILE_DATA.items():
            assert updated_data.get(key) == value, f"Updated profile field '{key}' does not match update data"
    except Exception as e:
        raise AssertionError(f"Updating recruiter profile failed: {e}")

    # Test error handling by simulating a GET to a wrong/non-existent recruiter's profile endpoint
    # Since the endpoint is fixed, simulate by removing token or using corrupted token to get 404 or 401
    try:
        # Without auth headers: expecting 404 or 401 unauthorized
        error_resp = requests.get(RECRUITER_PROFILE_URL, timeout=TIMEOUT)
        assert error_resp.status_code in (401, 404), f"Expected 401 or 404 without auth, got {error_resp.status_code}"
    except Exception as e:
        raise AssertionError(f"Error case (unauthenticated GET) failed: {e}")

    # Test error handling on update with invalid data (e.g. empty JSON)
    try:
        invalid_update_resp = requests.put(RECRUITER_PROFILE_URL, headers=headers, json={}, timeout=TIMEOUT)
        # Expecting 400 or 404 if empty body not allowed or profile not found
        assert invalid_update_resp.status_code in (400, 404), "Expected 400 or 404 for invalid update data"
    except Exception as e:
        raise AssertionError(f"Invalid update data handling failed: {e}")


test_recruiter_profile_read_and_update()