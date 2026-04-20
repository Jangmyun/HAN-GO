/**
 * 스모크 테스트 — Vitest + React Testing Library 설정 검증
 */
import { render, screen } from "@testing-library/react"

function Hello({ name }: { name: string }) {
  return <h1>안녕하세요, {name}!</h1>
}

describe("Vitest + RTL 설정", () => {
  it("컴포넌트를 렌더링하고 텍스트를 찾는다", () => {
    render(<Hello name="HAN:GO" />)
    expect(screen.getByRole("heading", { name: /HAN:GO/i })).toBeInTheDocument()
  })
})
