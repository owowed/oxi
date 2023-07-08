var M = Object.defineProperty;
var T = (t, r, e) => r in t ? M(t, r, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[r] = e;
var c = (t, r, e) => (T(t, typeof r != "symbol" ? r + "" : r, e), e), x = (t, r, e) => {
  if (!r.has(t))
    throw TypeError("Cannot " + e);
};
var i = (t, r, e) => (x(t, r, "read from private field"), e ? e.call(t) : r.get(t)), p = (t, r, e) => {
  if (r.has(t))
    throw TypeError("Cannot add the same private member more than once");
  r instanceof WeakSet ? r.add(t) : r.set(t, e);
}, l = (t, r, e, s) => (x(t, r, "write to private field"), s ? s.call(t, e) : r.set(t, e), e);
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
    var a;
    return (a = r[o]) == null ? void 0 : a.toString();
  });
}
class WorkerUnreponsiveError extends Error {
  constructor(e) {
    super("worker is unresponsive");
    c(this, "name", this.constructor.name);
    c(this, "worker");
    this.worker = e;
  }
}
class WorkerScriptError extends Error {
  constructor(e, s) {
    super(`script error caused by worker (${s.name})`);
    c(this, "name", this.constructor.name);
    c(this, "worker");
    this.worker = e, this.cause = s;
  }
}
class WorkerDeadState extends Error {
  constructor(e, s) {
    super(`worker is in dead state (${s})`);
    c(this, "name", this.constructor.name);
    c(this, "worker");
    this.worker = e;
  }
}
class JobNotFound extends Error {
  constructor(e, s) {
    super("job not found in worker");
    c(this, "name", this.constructor.name);
    c(this, "worker");
    c(this, "job");
    this.worker = e, this.job = s;
  }
}
class JobDoneEvent extends Event {
  constructor({ job: e, result: s }, n) {
    super("job-done", n);
    c(this, "job");
    c(this, "result");
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
var h, f, d, u;
const w = class extends EventTarget {
  constructor({ url: e } = {}) {
    super();
    p(this, h, []);
    p(this, f, null);
    p(this, d, void 0);
    p(this, u, "idling");
    l(this, d, new Worker(e ?? w.scriptUrl)), this.work();
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
    return i(this, u);
  }
  work() {
    if (i(this, u) == "idling" && i(this, h).length > 0) {
      l(this, u, "working");
      const e = l(this, f, i(this, h).pop());
      this.execute(e).then((s) => {
        l(this, u, "idling"), l(this, f, null);
        const n = new JobDoneEvent({ job: e, result: s });
        this.dispatchEvent(n), this.work();
      });
    }
  }
  clearQueue() {
    i(this, h).length = 0;
  }
  reinit(e) {
    e ?? (e = new Worker(w.scriptUrl)), this.terminate(), l(this, u, "idling"), l(this, d, e), this.work();
  }
  terminate() {
    i(this, d).terminate();
  }
  async restart(e) {
    e ?? (e = new Worker(w.scriptUrl)), await this.shutdown(), l(this, u, "idling"), l(this, d, e), this.work();
  }
  async shutdown() {
    return i(this, d).postMessage({
      type: "shutdown"
    }), this.awaitMessage({ type: "status", test: (e) => e.status == "shutdown" }).then((e) => (l(this, u, "shutdown"), e));
  }
  async suspend() {
    i(this, d).postMessage({
      type: "suspend"
    }), l(this, u, "suspended");
  }
  async resume() {
    i(this, d).postMessage({
      type: "resume"
    }), l(this, u, "idling"), this.work();
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
    return this.awaitJobDone(n);
  }
  queue(e, s) {
    if (!(i(this, u) == "idling" || i(this, u) == "working"))
      throw new WorkerDeadState(this, i(this, u));
    let n;
    return typeof e == "function" ? n = w.createJob(e, s) : n = e, i(this, h).push(n), this.work(), n;
  }
  remove(e) {
    const s = i(this, h).indexOf(e);
    return s == -1 ? !1 : (i(this, h).splice(s, 1), !0);
  }
  awaitMessage({ type: e, test: s, timeout: n = 5e4 } = {}) {
    return new Promise((o) => {
      let a;
      i(this, d).addEventListener("message", (g) => {
        const m = g.data;
        e && m.type != e || s && !s(m) || (a && clearTimeout(a), o(m));
      }), typeof n == "number" && (a = setTimeout(() => {
        throw new WorkerUnreponsiveError(this);
      }, n));
    });
  }
  awaitJobDone(e) {
    if (!i(this, h).includes(e) && i(this, f) != e)
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
h = new WeakMap(), f = new WeakMap(), d = new WeakMap(), u = new WeakMap(), c(WorkerJQ, "scriptUrl", `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);
function observeMutation({ target: t, abortSignal: r, once: e, ...s }, n) {
  const o = new MutationObserver((a) => {
    e && o.disconnect(), n({ records: a, observer: o });
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
    const o = new MutationObserver((a) => {
      o.disconnect(), n({ records: a, observer: o });
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
    c(this, "name", this.constructor.name);
  }
}
class WaitForElementMaxTriesError extends Error {
  constructor(e) {
    super(`wait for element out of tries (max tries: ${e})`);
    c(this, "name", this.constructor.name);
  }
}
class WaitForElementMissingOptionError extends Error {
  constructor() {
    super(...arguments);
    c(this, "name", this.constructor.name);
  }
}
async function executeQuery(t) {
  var k;
  let r;
  const e = t.parent ?? document.body, s = t.querySelector ?? document.querySelector, n = t.maxTries ?? 1 / 0, o = t.timeout ?? 1e4;
  if ("id" in t)
    r = `#${t.id}`;
  else if ("selector" in t)
    r = t.selector;
  else
    throw new WaitForElementMissingOptionError('missing options "id" or "selector"');
  let a = s(r);
  if (a)
    return a;
  let g = 0;
  const m = new AbortController(), y = m.signal;
  return (k = t.abortSignal) == null || k.addEventListener("abort", () => m.abort()), new Promise((v, b) => {
    const E = observeMutation({ target: e, abortSignal: y, childList: !0, subtree: !0, ...t.observerOptions }, () => {
      a = s(r), a != null ? (v(a), E.disconnect()) : g > n && (E.disconnect(), b(new WaitForElementMaxTriesError(n))), g++;
    });
    o != !1 && o != 1 / 0 && setTimeout(() => {
      E.disconnect(), b(new WaitForElementTimeoutError(o));
    }, o);
  });
}
function waitForElement(t, r) {
  return executeQuery({ selector: t, ...r });
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
