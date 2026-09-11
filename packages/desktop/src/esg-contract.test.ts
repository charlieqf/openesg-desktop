import { describe, expect, test } from "bun:test"
import { contextIdentity, contextPrompt, parseESGContext } from "./esg-contract"

const context = {
  kind: "openesg.context", version: 1, requestId: "request-1",
  href: "oc://esg/08-writing-workbench.html#project=PRJ-DEMO-001&object=UNIT-1",
  title: "虚构要点", pack: { demonstration: true, project_id: "PRJ-DEMO-001", selected_object_ids: ["UNIT-1"] },
}

describe("ESG context boundary", () => {
  test("accepts bounded fictional context and preserves return location", () => {
    const data = parseESGContext(context)
    expect(data).toEqual(context)
    expect(contextPrompt(data!)).toContain(context.href)
    expect(contextPrompt(data!)).toContain("不要修改文件")
  })
  test("rejects commands, remote links, oversized data and non-demo payloads", () => {
    expect(parseESGContext({ ...context, kind: "execute" })).toBeUndefined()
    expect(parseESGContext({ ...context, href: "https://example.com" })).toBeUndefined()
    expect(parseESGContext({ ...context, href: "oc://esg/../main/index.html" })).toBeUndefined()
    expect(parseESGContext({ ...context, pack: { ...context.pack, demonstration: false } })).toBeUndefined()
    expect(parseESGContext({ ...context, pack: { ...context.pack, body: "x".repeat(100_001) } })).toBeUndefined()
    expect(parseESGContext(null)).toBeUndefined()
    expect(parseESGContext({ ...context, projectName: 123 })).toBeUndefined()
    expect(parseESGContext({ ...context, projectName: "x".repeat(201) })).toBeUndefined()
  })
  test("resolves the business name by ID, not by snapshot ordering or the old bridge title", () => {
    const data = parseESGContext({ ...context, title: "ENV-001", projectName: "远澜国际控股", pack: { ...context.pack, selected_object_ids: ["ENV-001"], selection_type: "unit", reporting_period: "2025", input_snapshot: { selected: [{ id: "GOV-001", title: "董事会监督" }, { id: "ENV-001", title: "温室气体排放与计算口径", body: "虚构正文" }] } } })!
    expect(contextIdentity(data)).toEqual({ title: "温室气体排放与计算口径", kind: "撰写要点", ids: "ENV-001", report: "远澜国际控股 · 2025 年 ESG 报告" })
    const before = JSON.stringify(data.pack)
    const prompt = contextPrompt(data)
    expect(prompt).toStartWith("当前讨论：温室气体排放与计算口径（撰写要点）")
    expect(prompt).toContain("对象编号：ENV-001")
    expect(prompt).toContain("选中对象不代表要求撰写或修改")
    expect(prompt).toContain("点击时的虚构资料快照")
    expect(prompt).toContain(JSON.stringify(data.pack, null, 2))
    expect(JSON.stringify(data.pack)).toBe(before)
  })
  test("preserves old payloads and tolerates missing or malformed display metadata", () => {
    expect(contextIdentity(parseESGContext(context)!)).toEqual({ title: "虚构要点", kind: "业务对象", ids: "UNIT-1", report: "PRJ-DEMO-001" })
    const data = parseESGContext({ ...context, pack: { ...context.pack, input_snapshot: { selected: [null, [], "invalid", { id: "UNIT-1", title: 12 }] } } })!
    expect(contextIdentity(data).title).toBe("虚构要点")
  })
  test("supports file names and multiple selected objects without guessing their identity", () => {
    const data = parseESGContext({ ...context, pack: { ...context.pack, selection_type: "file", selected_object_ids: ["FILE-1", "FILE-2"], input_snapshot: { selected: [{ id: "FILE-1", name: "环境绩效.xlsx" }, { id: "FILE-2", filename: "口径说明.pdf" }] } } })!
    expect(contextIdentity(data).title).toBe("环境绩效.xlsx / 口径说明.pdf")
    expect(contextIdentity(data).kind).toBe("收资文件")
  })
})
