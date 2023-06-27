function M({ target: n, abortSignal: e, once: u, ...i }, s) {
  const r = new MutationObserver((A) => {
    e == null || e.throwIfAborted(), u && r.disconnect(), s({ records: A, observer: r });
  });
  return r.observe(n, i), e == null || e.addEventListener("abort", () => {
    r.disconnect();
  }), r;
}
function T(n) {
  return w({ id: n });
}
function B(n, e, u = {}) {
  return w({ selector: e, parent: n, ...u });
}
function R(n, e = {}) {
  return w({ selector: n, ...e });
}
function w({
  id: n,
  selector: e,
  parent: u = document.documentElement,
  abortSignal: i,
  multiple: s = !1,
  timeout: r = 5e3,
  enableTimeout: A = !0,
  maxTries: L = Number.MAX_SAFE_INTEGER,
  ensureDomContentLoaded: h = !0,
  observerOptions: q = {},
  filter: o,
  transform: d
} = {}) {
  return new Promise((m, O) => {
    let t, F = 0;
    h && document.readyState == "loading" ? document.addEventListener("DOMContentLoaded", () => {
      I();
    }) : I();
    function I() {
      if (E())
        return;
      let f = M(
        {
          target: u,
          childList: !0,
          subtree: !0,
          abortSignal: i,
          ...q
        },
        () => E(f)
      ), l = -1;
      A && (l = window.setTimeout(() => {
        f.disconnect(), m(null);
      }, r)), i == null || i.addEventListener("abort", () => {
        clearTimeout(l), f.disconnect(), m(null);
      }), E();
    }
    function E(c) {
      if (i == null || i.throwIfAborted(), s && e != null && n == null)
        if (Array.isArray(e)) {
          t = [];
          for (const l of e)
            t = t.concat(Array.from(u.querySelectorAll(l)));
        } else
          t = Array.from(f(u.querySelectorAll(e)));
      else if (n)
        t = document.getElementById(n);
      else if (Array.isArray(e))
        t = [], t = Array.from(f(u.querySelectorAll(e.join(", "))));
      else if (typeof e == "string") {
        if (t = u.querySelector(e), d && (t = d(t)), o != null && !o(t))
          return null;
      } else
        return null;
      function* f(l) {
        for (let y of l)
          o != null && o(y) ? (d && (y = d(y)), yield y) : o == null && d && (yield d(y));
      }
      if (s && Array.isArray(t) ? t.length > 0 : t)
        return c == null || c.disconnect(), m(t), t;
      if (F++, F >= L)
        return c == null || c.disconnect(), m(null), null;
    }
  });
}
export {
  M as makeMutationObserver,
  R as waitForElement,
  T as waitForElementById,
  B as waitForElementByParent,
  w as waitForElementOptions
};
//# sourceMappingURL=oxi.es.js.map
