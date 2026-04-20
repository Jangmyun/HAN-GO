import { http, HttpResponse } from "msw"

export const handlers = [
  http.get("/health", () => HttpResponse.json({ status: "ok" })),

  http.get("/stores", () =>
    HttpResponse.json([
      { id: "1", name: "테스트부스", slug: "test-booth", status: "active" },
    ])
  ),

  http.post("/orders", () =>
    HttpResponse.json({ order_code: "HG-TEST", status: "pending" }, { status: 201 })
  ),
]
