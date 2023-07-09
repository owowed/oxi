var L = Object.defineProperty;
var F = (t, r, e) => r in t ? L(t, r, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[r] = e;
var a = (t, r, e) => (F(t, typeof r != "symbol" ? r + "" : r, e), e), x = (t, r, e) => {
  if (!r.has(t))
    throw TypeError("Cannot " + e);
};
var i = (t, r, e) => (x(t, r, "read from private field"), e ? e.call(t) : r.get(t)), E = (t, r, e) => {
  if (r.has(t))
    throw TypeError("Cannot add the same private member more than once");
  r instanceof WeakSet ? r.add(t) : r.set(t, e);
}, u = (t, r, e, s) => (x(t, r, "write to private field"), s ? s.call(t, e) : r.set(t, e), e);
const HTMLEntityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
function escapeHTML(t) {
  return t.replace(/[&<>"'`=\/]/g, (r) => HTMLEntityMap[r]);
}
function html(t, ...r) {
  const e = [];
  for (let s = 0; s < t.length; s++)
    e.push(t[s]), r[s] && e.push(escapeHTML(String(r[s])));
  return fromHTML(e.join(""));
}
function fromHTML(t) {
  const r = document.createElement("div");
  return r.innerHTML = t, setTimeout(() => r.remove()), r.children[0];
}
function escapeRegExp(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function formatString(t, r, { subst: e = { format: "${{ | }}", var: "|" } } = {}) {
  const s = e.format.split(e.var).map(escapeRegExp).join(String.raw`([$\w\d-_.: ]+)`);
  return t.replace(new RegExp(s, "g"), (n, o) => {
    var l;
    return (l = r[o]) == null ? void 0 : l.toString();
  });
}
class WorkerUnreponsiveError extends Error {
  constructor(e) {
    super("worker is unresponsive");
    a(this, "name", this.constructor.name);
    a(this, "worker");
    this.worker = e;
  }
}
class WorkerScriptError extends Error {
  constructor(e, s) {
    super(`script error caused by worker (${s.name})`);
    a(this, "name", this.constructor.name);
    a(this, "worker");
    this.worker = e, this.cause = s;
  }
}
class WorkerDeadState extends Error {
  constructor(e, s) {
    super(`worker is in dead state (${s})`);
    a(this, "name", this.constructor.name);
    a(this, "worker");
    this.worker = e;
  }
}
class JobNotFound extends Error {
  constructor(e, s) {
    super("job not found in worker");
    a(this, "name", this.constructor.name);
    a(this, "worker");
    a(this, "job");
    this.worker = e, this.job = s;
  }
}
class JobFinishedEvent extends Event {
  constructor({ job: e, result: s }, n) {
    super("job-finished", n);
    a(this, "job");
    a(this, "result");
    this.job = e, this.result = s;
  }
}
class JobErrorEvent extends Event {
  constructor({ job: e, error: s }, n) {
    super("job-error", n);
    a(this, "job");
    a(this, "error");
    this.job = e, this.error = s;
  }
}
function workerLoop() {
  let state = "idling";
  function executeParentCode(data) {
    state = "working";
    const callback = eval(`(${data.functionCode})`), args = data.args;
    try {
      const t = callback(...args);
      self.postMessage({
        type: "execution_result",
        success: !0,
        returnValue: t
      });
    } catch (t) {
      self.postMessage({
        type: "execution_result",
        success: !1,
        error: t
      });
    }
    state = "idling";
  }
  async function executeParentCodeAsync(data) {
    state = "working";
    const callback = eval(`(${data.functionCode})`), args = data.args;
    callback(...args).then((t) => {
      self.postMessage({
        type: "execution_result",
        success: !0,
        returnValue: t
      }), state = "idling";
    }).catch((t) => {
      self.postMessage({
        type: "execution_result",
        success: !1,
        error: t
      }), state = "idling";
    });
  }
  self.addEventListener("message", (t) => {
    const r = t.data;
    switch (r.type) {
      case "status":
        self.postMessage({
          type: "status",
          status: state
        });
        break;
      case "resume":
        state = "idling";
        break;
    }
    if (state != "suspended")
      switch (r.type) {
        case "execute":
          executeParentCode(r);
          break;
        case "execute_async":
          r.shouldAwait ? executeParentCodeAsync(r) : executeParentCode(r);
          break;
        case "suspend":
          state = "suspended";
          break;
        case "shutdown":
          state = "shutdown", self.postMessage({
            type: "status",
            status: "shutdown"
          }), self.close();
          break;
      }
  });
}
var w, f, d, c;
const p = class extends EventTarget {
  constructor({ url: e } = {}) {
    super();
    E(this, w, []);
    E(this, f, null);
    E(this, d, void 0);
    E(this, c, "idling");
    a(this, "awaitJobDone", this.awaitJob);
    u(this, d, new Worker(e ?? p.scriptUrl)), this.work();
  }
  static createJob(e, s) {
    return {
      callback: e,
      args: s ?? []
    };
  }
  get worker() {
    return i(this, d);
  }
  set worker(e) {
    this.reinit(e);
  }
  get state() {
    return i(this, c);
  }
  work() {
    if (i(this, c) == "idling" && i(this, w).length > 0) {
      u(this, c, "working");
      const e = u(this, f, i(this, w).pop());
      this.execute(e).then((s) => {
        u(this, c, "idling"), u(this, f, null);
        const n = new JobFinishedEvent({ job: e, result: s });
        this.dispatchEvent(n), this.work();
      }).catch((s) => {
        const n = s;
        console.error(n), u(this, c, "idling"), u(this, f, null);
        const o = new JobErrorEvent({ job: e, error: n.cause });
        this.dispatchEvent(o), this.work();
      });
    }
  }
  clearQueue() {
    i(this, w).length = 0;
  }
  reinit(e) {
    e ?? (e = new Worker(p.scriptUrl)), this.terminate(), u(this, c, "idling"), u(this, d, e), this.work();
  }
  terminate() {
    i(this, d).terminate(), u(this, c, "terminated");
  }
  async restart(e) {
    e ?? (e = new Worker(p.scriptUrl)), await this.shutdown(), u(this, c, "idling"), u(this, d, e), this.work();
  }
  async shutdown() {
    return i(this, d).postMessage({
      type: "shutdown"
    }), this.awaitMessage({ type: "status", test: (e) => e.status == "shutdown" }).then((e) => (u(this, c, "shutdown"), e));
  }
  async suspend() {
    i(this, d).postMessage({
      type: "suspend"
    }), u(this, c, "suspended");
  }
  async resume() {
    i(this, d).postMessage({
      type: "resume"
    }), u(this, c, "idling"), this.work();
  }
  async execute(e) {
    const s = {
      type: "execute",
      functionCode: e.callback.toString(),
      args: e.args
    };
    i(this, d).postMessage(s);
    const n = await this.awaitMessage({ type: "execution_result" });
    if (n.success)
      return n.returnValue;
    throw new WorkerScriptError(this, n.error);
  }
  async run(e, s) {
    const n = this.queue(e, s);
    return this.awaitJob(n);
  }
  queue(e, s) {
    if (!(i(this, c) == "idling" || i(this, c) == "working"))
      throw new WorkerDeadState(this, i(this, c));
    let n;
    return typeof e == "function" ? n = p.createJob(e, s) : n = e, i(this, w).push(n), this.work(), n;
  }
  remove(e) {
    const s = i(this, w).indexOf(e);
    return s == -1 ? !1 : (i(this, w).splice(s, 1), !0);
  }
  awaitMessage({ type: e, test: s, timeout: n = 5e4 } = {}) {
    return new Promise((o) => {
      let l;
      i(this, d).addEventListener("message", (m) => {
        const h = m.data;
        e && h.type != e || s && !s(h) || (l && clearTimeout(l), o(h));
      }), typeof n == "number" && (l = setTimeout(() => {
        throw new WorkerUnreponsiveError(this);
      }, n));
    });
  }
  awaitJob(e) {
    if (!i(this, w).includes(e) && i(this, f) != e)
      throw new JobNotFound(this, e);
    return new Promise((s, n) => {
      const o = (m) => {
        const h = m;
        h.job == e && (s(h.result), this.removeEventListener("job-finished", o));
      }, l = (m) => {
        const h = m;
        h.job == e && (n(h.error), this.removeEventListener("job-error", o));
      };
      this.addEventListener("job-finished", o), this.addEventListener("job-error", l);
    });
  }
};
let WorkerJQ = p;
w = new WeakMap(), f = new WeakMap(), d = new WeakMap(), c = new WeakMap(), a(WorkerJQ, "scriptUrl", `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);
function observeMutation({ target: t, abortSignal: r, once: e, ...s }, n) {
  const o = new MutationObserver((l) => {
    e && o.disconnect(), n({ records: l, observer: o });
  });
  return o.observe(t, s), r == null || r.addEventListener("abort", () => {
    o.disconnect();
  }), o;
}
function observeMutationOnce(t, r) {
  return observeMutation({ once: !0, ...t }, r);
}
function observeMutationAsync({ target: t, abortSignal: r, ...e }, s) {
  return new Promise((n) => {
    const o = new MutationObserver((l) => {
      o.disconnect(), n({ records: l, observer: o });
    });
    o.observe(t, e), r == null || r.addEventListener("abort", () => {
      o.disconnect();
    });
  });
}
const makeMutationObserver = observeMutation;
class WaitForElementTimeoutError extends Error {
  constructor(e) {
    super(`wait for element timeout for ${e}ms`);
    a(this, "name", this.constructor.name);
  }
}
class WaitForElementMaxTriesError extends Error {
  constructor(e) {
    super(`wait for element out of tries (max tries: ${e})`);
    a(this, "name", this.constructor.name);
  }
}
class WaitForElementMissingOptionError extends Error {
  constructor() {
    super(...arguments);
    a(this, "name", this.constructor.name);
  }
}
async function awaitDomContentLoaded() {
  return new Promise((t) => {
    if (document.readyState != "loading")
      return t();
    document.addEventListener("DOMContentLoaded", () => t());
  });
}
function isNotEmpty(t) {
  return t instanceof NodeList && t.length > 0 ? !0 : t != null;
}
async function executeQuery(t) {
  var y;
  let r;
  const e = t.parent ?? document.body, s = t.querySelector ?? ((g, b) => g.querySelector(b)), n = t.maxTries ?? 1 / 0, o = t.timeout ?? 1e4;
  if ((t.ensureDomContentLoaded ?? !0) && await awaitDomContentLoaded(), "id" in t)
    r = `#${t.id}`;
  else if ("selector" in t)
    r = t.selector;
  else
    throw new WaitForElementMissingOptionError('missing options "id" or "selector"');
  let m = s(e, r);
  if (isNotEmpty(m))
    return m;
  let h = 0;
  const v = new AbortController(), M = v.signal;
  return (y = t.abortSignal) == null || y.addEventListener("abort", () => v.abort()), new Promise((g, b) => {
    const k = observeMutation({ target: e, abortSignal: M, childList: !0, subtree: !0, ...t.observerOptions }, () => {
      m = s(e, r), isNotEmpty(m) ? (g(m), k.disconnect()) : h > n && (k.disconnect(), b(new WaitForElementMaxTriesError(n))), h++;
    });
    o != !1 && o != 1 / 0 && setTimeout(() => {
      k.disconnect(), b(new WaitForElementTimeoutError(o));
    }, o);
  });
}
function waitForElement(t, r, e) {
  let s;
  return r instanceof Node && "children" in r ? s = {
    selector: t,
    parent: r,
    ...e
  } : s = {
    selector: t,
    ...r
  }, executeQuery({ selector: t, ...s });
}
function waitForElementAll(t, r) {
  return executeQuery({ selector: t, ...r }).then((e) => Array.from(e));
}
function waitForElementParent(t, r, e) {
  return executeQuery({ selector: r, parent: t, ...e });
}
function waitForElementId(t, r) {
  return executeQuery({ id: t, ...r });
}
function waitForElementInf(t, r) {
  return executeQuery({ selector: t, timeout: 1 / 0, ...r });
}
export {
  HTMLEntityMap,
  JobErrorEvent,
  JobFinishedEvent,
  JobNotFound,
  WorkerDeadState,
  WorkerJQ,
  WorkerScriptError,
  WorkerUnreponsiveError,
  awaitDomContentLoaded,
  escapeHTML,
  escapeRegExp,
  executeQuery,
  formatString,
  fromHTML,
  html,
  makeMutationObserver,
  observeMutation,
  observeMutationAsync,
  observeMutationOnce,
  waitForElement,
  waitForElementAll,
  waitForElementId,
  waitForElementInf,
  waitForElementParent
};
//# sourceMappingURL=oxi.es.js.map
