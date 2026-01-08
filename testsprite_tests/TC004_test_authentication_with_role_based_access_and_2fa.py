import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_authentication_with_role_based_access_and_2fa():
    """
    Test the authentication endpoints for job seekers, recruiters, and admins,
    including JWT token issuance, role-based access control enforcement,
    and optional two-factor authentication for admins.
    """
    # Sample users credentials (assuming these users exist or the system supports these test accounts)
    jobseeker_credentials = {
        "email": "jobseeker@example.com",
        "password": "JobSeekerPass123!"
    }
    recruiter_credentials = {
        "email": "recruiter@example.com",
        "password": "RecruiterPass123!"
    }
    admin_credentials = {
        "email": "admin@example.com",
        "password": "AdminPass123!",
        "twoFactorCode": "123456"  # Optional 2FA code for admin; can be empty or omitted to test no-2fa
    }

    headers = {"Content-Type": "application/json"}

    # 1. Jobseeker login
    response_js = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": jobseeker_credentials["email"],
            "password": jobseeker_credentials["password"]
        },
        headers=headers,
        timeout=TIMEOUT
    )
    assert response_js.status_code == 200, "Jobseeker login failed"
    js_data = response_js.json()
    assert "token" in js_data and js_data["token"], "Jobseeker JWT token missing"
    # Extract token for role-based access test
    js_token = js_data["token"]

    # 2. Recruiter login
    response_rc = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": recruiter_credentials["email"],
            "password": recruiter_credentials["password"]
        },
        headers=headers,
        timeout=TIMEOUT
    )
    assert response_rc.status_code == 200, "Recruiter login failed"
    rc_data = response_rc.json()
    assert "token" in rc_data and rc_data["token"], "Recruiter JWT token missing"
    rc_token = rc_data["token"]

    # 3. Admin login with 2FA
    response_ad = requests.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={
            "email": admin_credentials["email"],
            "password": admin_credentials["password"],
            "twoFactorCode": admin_credentials["twoFactorCode"]
        },
        headers=headers,
        timeout=TIMEOUT
    )
    # Admin login may support 2FA optionally:
    # Accept 200 for success, 401 for invalid 2FA or credentials
    # We test a valid 2FA scenario here, so expect 200
    assert response_ad.status_code == 200, f"Admin login with 2FA failed: {response_ad.text}"
    ad_data = response_ad.json()
    assert "token" in ad_data and ad_data["token"], "Admin JWT token missing"
    ad_token = ad_data["token"]

    # 4. Verify role-based access control enforcement
    # Test Jobseeker access to recruiter-only endpoint:
    # Assuming recruiter profile GET requires recruiter role
    headers_js_auth = {"Authorization": f"Bearer {js_token}"}
    recruiter_profile_response = requests.get(
        f"{BASE_URL}/api/recruiter/profile",
        headers=headers_js_auth,
        timeout=TIMEOUT
    )
    # Expect 403 Forbidden or 401 Unauthorized, since jobseeker should not access recruiter route
    assert recruiter_profile_response.status_code in {401, 403}, (
        "Jobseeker should not access recruiter-only endpoint"
    )

    # Test Recruiter access to admin endpoint - we do not have explicit admin endpoints from PRD,
    # but let's assume /api/admin/dashboard or any protected path is admin-only.
    # Since no explicit admin API endpoints given for test, we test admin/auth/login only.
    # We skip unauthorized check for recruiter to admin endpoint as not specified.

    # 5. Test admin 2FA enforcement - invalid 2FA code causes login failure
    invalid_2fa_response = requests.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={
            "email": admin_credentials["email"],
            "password": admin_credentials["password"],
            "twoFactorCode": "000000"  # Invalid 2FA
        },
        headers=headers,
        timeout=TIMEOUT
    )
    assert invalid_2fa_response.status_code == 401, "Admin login should fail with invalid 2FA"

    # 6. Test admin login without 2FA (optional)
    # Try login with no twoFactorCode field to verify optional 2FA
    no_2fa_response = requests.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={
            "email": admin_credentials["email"],
            "password": admin_credentials["password"]
        },
        headers=headers,
        timeout=TIMEOUT
    )
    # May pass or fail depending on 2FA configuration; accept either 200 or 401
    assert no_2fa_response.status_code in {200, 401}, (
        "Admin login without 2FA should respond with 200 or 401"
    )
    if no_2fa_response.status_code == 200:
        no_2fa_data = no_2fa_response.json()
        assert "token" in no_2fa_data and no_2fa_data["token"], "Token missing on admin login without 2FA"

    # 7. Test login failure for wrong credentials for jobseeker
    login_fail_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": jobseeker_credentials["email"],
            "password": "WrongPassword!"
        },
        headers=headers,
        timeout=TIMEOUT
    )
    assert login_fail_response.status_code == 401, "Login should fail with wrong credentials"

    # 8. Test login failure for wrong credentials for admin
    login_fail_admin_response = requests.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={
            "email": admin_credentials["email"],
            "password": "WrongAdminPass!",
            "twoFactorCode": admin_credentials["twoFactorCode"]
        },
        headers=headers,
        timeout=TIMEOUT
    )
    assert login_fail_admin_response.status_code == 401, "Admin login should fail with wrong credentials"

test_authentication_with_role_based_access_and_2fa()
