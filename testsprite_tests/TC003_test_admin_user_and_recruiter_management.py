import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Admin credentials - assumed for test, replace with valid test admin credentials or environment variables
ADMIN_LOGIN_PAYLOAD = {
    "username": "admin_test_user",
    "password": "admin_test_password"
}

def test_admin_user_and_recruiter_management():
    session = requests.Session()
    try:
        # 1. Admin login to get JWT token and (if needed) 2FA
        admin_auth_url = f"{BASE_URL}/api/admin/auth/login"
        resp = session.post(admin_auth_url, json=ADMIN_LOGIN_PAYLOAD, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Admin login failed with status {resp.status_code}"
        auth_data = resp.json()
        token = auth_data.get("token")
        assert token and isinstance(token, str), "No JWT token received on admin login"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # 2. Retrieve paginated list of users
        users_url = f"{BASE_URL}/api/admin/users"
        params = {"page": 1, "limit": 10}
        resp = session.get(users_url, headers=headers, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get users list, status {resp.status_code}"
        users_data = resp.json()
        assert isinstance(users_data, dict), "Users list response should be a dict"
        assert "users" in users_data and isinstance(users_data["users"], list), "Users list missing or invalid"
        assert "total" in users_data and isinstance(users_data["total"], int), "Total count missing or invalid"
        assert len(users_data["users"]) <= params["limit"]

        # If no users, create one for tests (assuming admin can create users)
        user_id = None
        if users_data["users"]:
            user_id = users_data["users"][0].get("id")
        else:
            create_user_payload = {
                "username": "tempuser_test",
                "email": "tempuser_test@example.com",
                "role": "jobseeker",
                "password": "TempPass123!"
            }
            resp = session.post(f"{BASE_URL}/api/admin/users", json=create_user_payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Failed to create user for testing, status {resp.status_code}"
            user_id = resp.json().get("id")
            assert user_id, "No ID returned after user creation"

        # 3. Retrieve paginated list of recruiters
        recruiters_url = f"{BASE_URL}/api/admin/recruiters"
        params = {"page": 1, "limit": 10}
        resp = session.get(recruiters_url, headers=headers, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get recruiters list, status {resp.status_code}"
        recruiters_data = resp.json()
        assert isinstance(recruiters_data, dict), "Recruiters list response should be a dict"
        assert "recruiters" in recruiters_data and isinstance(recruiters_data["recruiters"], list), "Recruiters list missing or invalid"
        assert "total" in recruiters_data and isinstance(recruiters_data["total"], int), "Total count missing or invalid"
        assert len(recruiters_data["recruiters"]) <= params["limit"]

        # If no recruiters, create one for tests (assuming admin can create recruiters)
        recruiter_id = None
        if recruiters_data["recruiters"]:
            recruiter_id = recruiters_data["recruiters"][0].get("id")
        else:
            create_recruiter_payload = {
                "username": "temprecruiter_test",
                "email": "temprecruiter_test@example.com",
                "role": "recruiter",
                "password": "TempPass123!"
            }
            resp = session.post(f"{BASE_URL}/api/admin/recruiters", json=create_recruiter_payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 201, f"Failed to create recruiter for testing, status {resp.status_code}"
            recruiter_id = resp.json().get("id")
            assert recruiter_id, "No ID returned after recruiter creation"

        # 4. Perform suspension on user
        suspend_user_url = f"{BASE_URL}/api/admin/users/{user_id}/suspend"
        suspend_payload = {"suspend": True}
        resp = session.put(suspend_user_url, json=suspend_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to suspend user, status {resp.status_code}"
        suspend_resp = resp.json()
        assert suspend_resp.get("suspended") is True

        # Unsuspend user to cleanup
        suspend_payload = {"suspend": False}
        resp = session.put(suspend_user_url, json=suspend_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to unsuspend user, status {resp.status_code}"
        suspend_resp = resp.json()
        assert suspend_resp.get("suspended") is False

        # 5. Perform verification on recruiter
        verify_recruiter_url = f"{BASE_URL}/api/admin/recruiters/{recruiter_id}/verify"
        verify_payload = {"verified": True}
        resp = session.put(verify_recruiter_url, json=verify_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to verify recruiter, status {resp.status_code}"
        verify_resp = resp.json()
        assert verify_resp.get("verified") is True

        # Unverify recruiter to cleanup
        verify_payload = {"verified": False}
        resp = session.put(verify_recruiter_url, json=verify_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to unverify recruiter, status {resp.status_code}"
        verify_resp = resp.json()
        assert verify_resp.get("verified") is False

        # 6. Manage duplicates - get list and try to merge or resolve
        duplicates_url = f"{BASE_URL}/api/admin/duplicates"
        resp = session.get(duplicates_url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get duplicates list, status {resp.status_code}"
        duplicates_data = resp.json()
        assert isinstance(duplicates_data, dict)
        duplicates_list = duplicates_data.get("duplicates", [])
        assert isinstance(duplicates_list, list)

        # If duplicates exist, attempt to resolve a duplicate (assuming API endpoint)
        if duplicates_list:
            duplicate = duplicates_list[0]
            duplicate_id = duplicate.get("id")
            resolve_url = f"{BASE_URL}/api/admin/duplicates/{duplicate_id}/resolve"
            resolve_payload = {"action": "merge"}
            resp = session.post(resolve_url, json=resolve_payload, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Failed to resolve duplicate, status {resp.status_code}"
            resolve_resp = resp.json()
            assert resolve_resp.get("resolved") is True

    except RequestException as e:
        assert False, f"Request failed: {str(e)}"
    finally:
        # Cleanup created user and recruiter if created during test
        if 'user_id' in locals() and user_id:
            try:
                del_resp = session.delete(f"{BASE_URL}/api/admin/users/{user_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), "Failed to delete test user in cleanup"
            except Exception:
                pass
        if 'recruiter_id' in locals() and recruiter_id:
            try:
                del_resp = session.delete(f"{BASE_URL}/api/admin/recruiters/{recruiter_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), "Failed to delete test recruiter in cleanup"
            except Exception:
                pass

test_admin_user_and_recruiter_management()