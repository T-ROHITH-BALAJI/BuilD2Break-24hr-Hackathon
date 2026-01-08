import requests

BASE_URL = "http://localhost:5000"
ADMIN_LOGIN_ENDPOINT = f"{BASE_URL}/api/admin/auth/login"
SYSTEM_LOGS_ENDPOINT = f"{BASE_URL}/api/admin/logs"
ANALYTICS_DASHBOARD_ENDPOINT = f"{BASE_URL}/api/admin/analytics"

# Admin credentials for testing (should be replaced with valid test credentials or from secure config)
ADMIN_CREDENTIALS = {
    "email": "admin_test",
    "password": "admin_test_password",
    # Assuming 2FA is optional and not required here. If required, include "twoFactorCode": "123456"
}

def test_admin_system_logs_and_analytics_access():
    # Login as admin to get JWT token
    try:
        login_resp = requests.post(
            ADMIN_LOGIN_ENDPOINT,
            json=ADMIN_CREDENTIALS,
            timeout=30
        )
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "No token received on admin login"

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Access system logs with filtering and pagination parameters for example
        params_logs = {
            "page": 1,
            "limit": 20,
            "filter": "error",  # example filter to get only error logs
            "sort": "timestamp_desc"
        }
        logs_resp = requests.get(
            SYSTEM_LOGS_ENDPOINT,
            headers=headers,
            params=params_logs,
            timeout=30
        )
        assert logs_resp.status_code == 200, f"Failed to access system logs: {logs_resp.text}"
        logs_data = logs_resp.json()
        assert "logs" in logs_data and isinstance(logs_data["logs"], list), "Logs data missing or not a list"
        # Verify some expected keys in a log entry
        if logs_data["logs"]:
            log_entry = logs_data["logs"][0]
            for key in ["timestamp", "level", "message"]:
                assert key in log_entry, f"Log entry missing key: {key}"

        # Access analytics dashboard with aggregation and filters
        params_analytics = {
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
            "aggregation": "monthly",
            "metrics": "userActivity,pageViews",
            "filter": "activeUsers>100"
        }
        analytics_resp = requests.get(
            ANALYTICS_DASHBOARD_ENDPOINT,
            headers=headers,
            params=params_analytics,
            timeout=30
        )
        assert analytics_resp.status_code == 200, f"Failed to access analytics dashboard: {analytics_resp.text}"
        analytics_data = analytics_resp.json()
        # Validate expected structure of analytics data (this may vary, checking for keys)
        assert "aggregatedData" in analytics_data, "Analytics dashboard missing 'aggregatedData'"
        assert isinstance(analytics_data["aggregatedData"], list), "'aggregatedData' should be a list"

        if analytics_data["aggregatedData"]:
            agg_entry = analytics_data["aggregatedData"][0]
            # Check for typical keys: date, metrics dictionary
            assert "date" in agg_entry, "Aggregated data entry missing 'date'"
            assert "metrics" in agg_entry and isinstance(agg_entry["metrics"], dict), "Aggregated data entry missing 'metrics' dict"

    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed: {e}")

test_admin_system_logs_and_analytics_access()
