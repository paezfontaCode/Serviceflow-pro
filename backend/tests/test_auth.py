import pytest
from app.core.security import get_password_hash
from app.models.user import User

def test_login_success(client, db):
    # Create test user
    hashed_password = get_password_hash("testpass")
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hashed_password,
        is_active=True
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client, db):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wronguser", "password": "wrongpass"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["message"] == "Incorrect username or password"

def test_get_me(client, db):
    # Create and login user
    hashed_password = get_password_hash("testpass")
    user = User(
        username="testuser_me",
        email="test_me@example.com",
        hashed_password=hashed_password,
        is_active=True
    )
    db.add(user)
    db.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser_me", "password": "testpass"}
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser_me"
    assert response.json()["email"] == "test_me@example.com"
