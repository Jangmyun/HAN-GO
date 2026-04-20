"""헬스체크 엔드포인트 스모크 테스트"""


async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
