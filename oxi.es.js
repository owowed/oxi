var L = Object.defineProperty;
var T = (t, r, e) => r in t ? L(t, r, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[r] = e;
var a = (t, r, e) => (T(t, typeof r != "symbol" ? r + "" : r, e), e), M = (t, r, e) => {
  if (!r.has(t))
    throw TypeError("Cannot " + e);
};
var i = (t, r, e) => (M(t, r, "read from private field"), e ? e.call(t) : r.get(t)), g = (t, r, e) => {
  if (r.has(t))
    throw TypeError("Cannot add the same private member more than once");
  r instanceof WeakSet ? r.add(t) : r.set(t, e);
}, u = (t, r, e, s) => (M(t, r, "write to private field"), s ? s.call(t, e) : r.set(t, e), e);
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
    var d;
    return (d = r[o]) == null ? void 0 : d.toString();
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
class JobDoneEvent extends Event {
  constructor({ job: e, result: s }, n) {
    super("job-done", n);
    a(this, "job");
    a(this, "result");
    this.job = e, this.result = s;
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
var h, p, l, c;
const w = class extends EventTarget {
  constructor({ url: e } = {}) {
    super();
    g(this, h, []);
    g(this, p, null);
    g(this, l, void 0);
    g(this, c, "idling");
    u(this, l, new Worker(e ?? w.scriptUrl)), this.work();
  }
  static createJob(e, s) {
    return {
      callback: e,
      args: s ?? []
    };
  }
  get worker() {
    return i(this, l);
  }
  set worker(e) {
    this.reinit(e);
  }
  get state() {
    return i(this, c);
  }
  work() {
    if (i(this, c) == "idling" && i(this, h).length > 0) {
      u(this, c, "working");
      const e = u(this, p, i(this, h).pop());
      this.execute(e).then((s) => {
        u(this, c, "idling"), u(this, p, null);
        const n = new JobDoneEvent({ job: e, result: s });
        this.dispatchEvent(n), this.work();
      });
    }
  }
  clearQueue() {
    i(this, h).length = 0;
  }
  reinit(e) {
    e ?? (e = new Worker(w.scriptUrl)), this.terminate(), u(this, c, "idling"), u(this, l, e), this.work();
  }
  terminate() {
    i(this, l).terminate();
  }
  async restart(e) {
    e ?? (e = new Worker(w.scriptUrl)), await this.shutdown(), u(this, c, "idling"), u(this, l, e), this.work();
  }
  async shutdown() {
    return i(this, l).postMessage({
      type: "shutdown"
    }), this.awaitMessage({ type: "status", test: (e) => e.status == "shutdown" }).then((e) => (u(this, c, "shutdown"), e));
  }
  async suspend() {
    i(this, l).postMessage({
      type: "suspend"
    }), u(this, c, "suspended");
  }
  async resume() {
    i(this, l).postMessage({
      type: "resume"
    }), u(this, c, "idling"), this.work();
  }
  async execute(e) {
    const s = {
      type: "execute",
      functionCode: e.callback.toString(),
      args: e.args
    };
    i(this, l).postMessage(s);
    const n = await this.awaitMessage({ type: "execution_result" });
    if (n.success)
      return n.returnValue;
    throw new WorkerScriptError(this, n.error);
  }
  async run(e, s) {
    const n = this.queue(e, s);
    return this.awaitJobDone(n);
  }
  queue(e, s) {
    if (!(i(this, c) == "idling" || i(this, c) == "working"))
      throw new WorkerDeadState(this, i(this, c));
    let n;
    return typeof e == "function" ? n = w.createJob(e, s) : n = e, i(this, h).push(n), this.work(), n;
  }
  remove(e) {
    const s = i(this, h).indexOf(e);
    return s == -1 ? !1 : (i(this, h).splice(s, 1), !0);
  }
  awaitMessage({ type: e, test: s, timeout: n = 5e4 } = {}) {
    return new Promise((o) => {
      let d;
      i(this, l).addEventListener("message", (m) => {
        const f = m.data;
        e && f.type != e || s && !s(f) || (d && clearTimeout(d), o(f));
      }), typeof n == "number" && (d = setTimeout(() => {
        throw new WorkerUnreponsiveError(this);
      }, n));
    });
  }
  awaitJobDone(e) {
    if (!i(this, h).includes(e) && i(this, p) != e)
      throw new JobNotFound(this, e);
    return new Promise((s) => {
      this.addEventListener("job-done", (n) => {
        const o = n;
        o.job == e && s(o.result);
      });
    });
  }
};
let WorkerJQ = w;
h = new WeakMap(), p = new WeakMap(), l = new WeakMap(), c = new WeakMap(), a(WorkerJQ, "scriptUrl", `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);
function observeMutation({ target: t, abortSignal: r, once: e, ...s }, n) {
  const o = new MutationObserver((d) => {
    e && o.disconnect(), n({ records: d, observer: o });
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
    const o = new MutationObserver((d) => {
      o.disconnect(), n({ records: d, observer: o });
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
  var x;
  let r;
  const e = t.parent ?? document.body, s = t.querySelector ?? ((k, E) => k.querySelector(E)), n = t.maxTries ?? 1 / 0, o = t.timeout ?? 1e4;
  if ((t.ensureDomContentLoaded ?? !0) && await awaitDomContentLoaded(), "id" in t)
    r = `#${t.id}`;
  else if ("selector" in t)
    r = t.selector;
  else
    throw new WaitForElementMissingOptionError('missing options "id" or "selector"');
  let m = s(e, r);
  if (isNotEmpty(m))
    return m;
  let f = 0;
  const b = new AbortController(), v = b.signal;
  return (x = t.abortSignal) == null || x.addEventListener("abort", () => b.abort()), new Promise((k, E) => {
    const y = observeMutation({ target: e, abortSignal: v, childList: !0, subtree: !0, ...t.observerOptions }, () => {
      m = s(e, r), isNotEmpty(m) ? (k(m), y.disconnect()) : f > n && (y.disconnect(), E(new WaitForElementMaxTriesError(n))), f++;
    });
    o != !1 && o != 1 / 0 && setTimeout(() => {
      y.disconnect(), E(new WaitForElementTimeoutError(o));
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
  JobDoneEvent,
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
