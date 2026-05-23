from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

from app.constants import PART_IDS


def _empty_beat() -> dict[str, Any]:
    return {
        "subdivision": 4,
        "steps": {p: [0, 0, 0, 0] for p in PART_IDS},
    }


def _empty_measure() -> list[dict[str, Any]]:
    return [_empty_beat() for _ in range(4)]


def _valid_payload(**overrides: Any) -> dict[str, Any]:
    payload = {"title": "Test", "bpm": 120, "measures": [_empty_measure()]}
    payload.update(overrides)
    return payload


def test_create_and_get(client: TestClient) -> None:
    response = client.post("/scores", json=_valid_payload(title="Hello"))
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Hello"
    assert body["bpm"] == 120
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body

    get_response = client.get(f"/scores/{body['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == body["id"]


def test_list_orders_by_updated_at_desc(client: TestClient) -> None:
    first = client.post("/scores", json=_valid_payload(title="A")).json()
    second = client.post("/scores", json=_valid_payload(title="B")).json()

    response = client.get("/scores")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert items[0]["id"] == second["id"]
    assert items[1]["id"] == first["id"]


def test_update_replaces_all_fields(client: TestClient) -> None:
    created = client.post("/scores", json=_valid_payload(title="Old", bpm=100)).json()
    response = client.put(
        f"/scores/{created['id']}",
        json=_valid_payload(title="New", bpm=140),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["title"] == "New"
    assert body["bpm"] == 140


def test_delete_then_404(client: TestClient) -> None:
    created = client.post("/scores", json=_valid_payload()).json()
    response = client.delete(f"/scores/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/scores/{created['id']}").status_code == 404


def test_get_nonexistent_returns_404(client: TestClient) -> None:
    assert client.get("/scores/does-not-exist").status_code == 404


def test_invalid_bpm_returns_422(client: TestClient) -> None:
    assert client.post("/scores", json=_valid_payload(bpm=0)).status_code == 422
    assert client.post("/scores", json=_valid_payload(bpm=500)).status_code == 422


def test_invalid_measures_count_returns_422(client: TestClient) -> None:
    response = client.post(
        "/scores", json=_valid_payload(measures=[[_empty_beat()] * 3])
    )
    assert response.status_code == 422


def test_invalid_steps_keys_returns_422(client: TestClient) -> None:
    bad_beat = {"subdivision": 4, "steps": {"BD": [0, 0, 0, 0]}}
    bad_measure = [bad_beat for _ in range(4)]
    response = client.post("/scores", json=_valid_payload(measures=[bad_measure]))
    assert response.status_code == 422
