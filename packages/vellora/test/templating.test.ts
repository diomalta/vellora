import { describe, expect, test } from "vitest";
import { VelloraTemplateError, renderTemplate } from "../src/index";

describe("variable interpolation", () => {
  test("replaces a simple variable", () => {
    expect(renderTemplate("<p>{{ name }}</p>", { name: "Ada" })).toBe("<p>Ada</p>");
  });

  test("resolves a dotted path", () => {
    expect(
      renderTemplate("{{ customer.address.city }}", {
        customer: { address: { city: "Recife" } },
      }),
    ).toBe("Recife");
  });

  test("HTML-escapes interpolated values by default", () => {
    expect(renderTemplate("{{ note }}", { note: "<b>x</b> & y" })).toBe(
      "&lt;b&gt;x&lt;/b&gt; &amp; y",
    );
  });

  test("escapes quotes too", () => {
    expect(renderTemplate("{{ v }}", { v: `"a"'b'` })).toBe("&quot;a&quot;&#39;b&#39;");
  });

  test("a missing path resolves to empty without throwing", () => {
    expect(renderTemplate("<p>{{ missing }}</p>", {})).toBe("<p></p>");
    expect(renderTemplate("<p>{{ a.b.c }}</p>", { a: {} })).toBe("<p></p>");
  });

  test("coerces non-string values to their string form before escaping", () => {
    expect(renderTemplate("{{ n }}", { n: 3 })).toBe("3");
    expect(renderTemplate("{{ b }}", { b: true })).toBe("true");
  });
});

describe("loop blocks", () => {
  test("iterates array items", () => {
    expect(
      renderTemplate("{% for it in items %}<li>{{ it.name }}</li>{% endfor %}", {
        items: [{ name: "A" }, { name: "B" }],
      }),
    ).toBe("<li>A</li><li>B</li>");
  });

  test("an empty collection renders nothing without error", () => {
    expect(
      renderTemplate("{% for it in items %}<li>{{ it }}</li>{% endfor %}", { items: [] }),
    ).toBe("");
  });

  test("a missing collection renders nothing without error", () => {
    expect(renderTemplate("{% for it in items %}x{% endfor %}", {})).toBe("");
  });

  test("nested loops render inner body once per cell of each row in order", () => {
    const tpl =
      "{% for row in rows %}{% for cell in row.cells %}[{{ cell }}]{% endfor %}{% endfor %}";
    expect(
      renderTemplate(tpl, {
        rows: [{ cells: ["a", "b"] }, { cells: ["c"] }],
      }),
    ).toBe("[a][b][c]");
  });

  test("an unclosed loop rejects with a located VelloraTemplateError", () => {
    expect(() => renderTemplate("{% for it in items %}<li>{{ it }}</li>", { items: [] })).toThrow(
      VelloraTemplateError,
    );
    try {
      renderTemplate("{% for it in items %}<li>{{ it }}</li>", { items: [] });
    } catch (e) {
      expect(e).toBeInstanceOf(VelloraTemplateError);
      expect((e as VelloraTemplateError).message).toMatch(/for/i);
      expect((e as VelloraTemplateError).line).toBe(1);
    }
  });
});

describe("conditional blocks", () => {
  test("renders the body when the condition is truthy", () => {
    expect(renderTemplate("{% if paid %}OK{% endif %}", { paid: true })).toBe("OK");
  });

  test("renders the else branch when the condition is falsy", () => {
    expect(renderTemplate("{% if paid %}OK{% else %}DUE{% endif %}", { paid: false })).toBe("DUE");
  });

  test("renders nothing when falsy and there is no else", () => {
    expect(renderTemplate("{% if paid %}OK{% endif %}", { paid: false })).toBe("");
  });

  test("supports equality against a literal", () => {
    expect(renderTemplate(`{% if status == "paid" %}✓{% endif %}`, { status: "paid" })).toBe("✓");
    expect(renderTemplate(`{% if status == "paid" %}✓{% endif %}`, { status: "open" })).toBe("");
  });

  test("supports inequality and negation", () => {
    expect(renderTemplate(`{% if status != "paid" %}due{% endif %}`, { status: "open" })).toBe(
      "due",
    );
    expect(renderTemplate("{% if not overdue %}fine{% endif %}", { overdue: false })).toBe("fine");
    expect(renderTemplate("{% if not overdue %}fine{% endif %}", { overdue: true })).toBe("");
  });

  test("an empty array is falsy in a condition", () => {
    expect(renderTemplate("{% if items %}has{% else %}none{% endif %}", { items: [] })).toBe(
      "none",
    );
    expect(renderTemplate("{% if items %}has{% else %}none{% endif %}", { items: [1] })).toBe(
      "has",
    );
  });

  test("an unclosed conditional rejects with a located VelloraTemplateError", () => {
    expect(() => renderTemplate("{% if paid %}OK", { paid: true })).toThrow(VelloraTemplateError);
    try {
      renderTemplate("{% if paid %}OK", { paid: true });
    } catch (e) {
      expect((e as VelloraTemplateError).message).toMatch(/if/i);
    }
  });
});

describe("format helpers", () => {
  test("currency helper emits R$ 1.234,50 with a NO-BREAK SPACE", () => {
    const out = renderTemplate(`{{ total | currency("BRL") }}`, { total: 1234.5 });
    expect(out).toBe("R$ 1.234,50");
  });

  test("number helper applies fixed fraction digits", () => {
    expect(renderTemplate("{{ qty | number(2) }}", { qty: 3 })).toBe("3.00");
    expect(renderTemplate("{{ qty | number(0) }}", { qty: 40 })).toBe("40");
  });

  test("date helper formats a fixed instant in UTC regardless of host TZ", () => {
    expect(
      renderTemplate(`{{ issuedAt | date("YYYY-MM-DD") }}`, { issuedAt: "2026-06-22T23:30:00Z" }),
    ).toBe("2026-06-22");
    expect(renderTemplate(`{{ d | date("DD/MM/YYYY") }}`, { d: "2026-06-22" })).toBe("22/06/2026");
  });

  test("date formats time fields in UTC (timezone-stable by construction)", () => {
    expect(
      renderTemplate(`{{ d | date("YYYY-MM-DD HH:mm") }}`, { d: "2026-06-22T23:30:00Z" }),
    ).toBe("2026-06-22 23:30");
    // A zoneless local datetime is pinned to UTC for determinism.
    expect(renderTemplate(`{{ d | date("HH:mm") }}`, { d: "2026-06-22T14:37:00" })).toBe("14:37");
  });

  // TQ-3: this only proves currency() returns "" for a non-numeric value (toNumber → NaN), NOT that
  // escaping runs — the empty result happens before the escape layer. Escaping of direct
  // interpolation is covered by the "HTML-escapes interpolated values by default" test above; no
  // built-in helper can emit markup (currency/number return "" on NaN; date emits only safe chars).
  test("currency() yields an empty string for a non-numeric value", () => {
    expect(renderTemplate(`{{ v | currency("BRL") }}`, { v: "<x>" })).toBe("");
  });

  test("an unknown helper rejects with a VelloraTemplateError naming it", () => {
    try {
      renderTemplate("{{ x | bogus(1) }}", { x: 1 });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(VelloraTemplateError);
      expect((e as VelloraTemplateError).message).toContain("bogus");
    }
  });
});

// Regression (TS-03 / ROB-2): a built-in helper given an out-of-range arg must reject with a located
// VelloraTemplateError, never a raw V8 RangeError that escapes the "never a bare Error" contract.
describe("helpers never leak a raw RangeError", () => {
  const cases: { template: string; data: Record<string, unknown> }[] = [
    { template: `{{ x | currency("BOGUS") }}`, data: { x: 1 } },
    { template: `{{ x | currency("ab") }}`, data: { x: 1 } },
    { template: "{{ x | number(-1) }}", data: { x: 1 } },
    { template: "{{ x | number(101) }}", data: { x: 1 } },
  ];
  for (const { template, data } of cases) {
    test(`${template} rejects with a located VelloraTemplateError, not a RangeError`, () => {
      let thrown: unknown;
      try {
        renderTemplate(template, data);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(VelloraTemplateError);
      expect(thrown).not.toBeInstanceOf(RangeError);
      const err = thrown as VelloraTemplateError;
      expect(err.code).toBe("VELLORA_TEMPLATE_ERROR");
      expect(typeof err.line).toBe("number");
      expect(typeof err.col).toBe("number");
    });
  }
});

describe("templating runs before render and never executes data", () => {
  test("returns finalized HTML with no tokens remaining", () => {
    const out = renderTemplate("<p>{{ a }}</p>{% if b %}!{% endif %}", { a: "x", b: true });
    expect(out).toBe("<p>x</p>!");
    expect(out).not.toMatch(/\{\{|\}\}|\{%|%\}/);
  });

  test("a data value that looks like a template is inert text", () => {
    expect(renderTemplate("{{ v }}", { v: "{{ 7*7 }}" })).toBe("{{ 7*7 }}");
  });

  test("a function value is never executed (treated as inert text)", () => {
    let called = false;
    const out = renderTemplate("{{ v }}", {
      v: () => {
        called = true;
        return "EXECUTED";
      },
    });
    // The function is coerced to its (escaped) string form, never invoked.
    expect(called).toBe(false);
    expect(out).not.toContain("EXECUTED()");
  });

  // Regression (SEC-4): a dotted path must not walk the JS prototype chain. Every segment is gated on
  // own-property access, so prototype/constructor reads resolve to "" instead of leaking internals.
  test("prototype-chain keys resolve to empty, never engine internals", () => {
    expect(renderTemplate("{{ x.constructor }}", { x: {} })).toBe("");
    expect(renderTemplate("{{ x.constructor.name }}", { x: {} })).toBe("");
    expect(renderTemplate("{{ x.__proto__ }}", { x: {} })).toBe("");
    expect(renderTemplate("{{ x.toString }}", { x: {} })).toBe("");
    // A legitimate own nested property still resolves.
    expect(renderTemplate("{{ x.y }}", { x: { y: "ok" } })).toBe("ok");
  });
});
