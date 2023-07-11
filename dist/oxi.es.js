var I = Object.defineProperty;
var $ = (r, e, t) => e in r ? I(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var l = (r, e, t) => ($(r, typeof e != "symbol" ? e + "" : e, t), t), A = (r, e, t) => {
  if (!e.has(r))
    throw TypeError("Cannot " + t);
};
var i = (r, e, t) => (A(r, e, "read from private field"), t ? t.call(r) : e.get(r)), p = (r, e, t) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, t);
}, h = (r, e, t, n) => (A(r, e, "write to private field"), n ? n.call(r, t) : e.set(r, t), t);
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
function escapeHTML(r) {
  return r.replace(/[&<>"'`=\/]/g, (e) => HTMLEntityMap[e]);
}
function html(r, ...e) {
  const t = [];
  for (let n = 0; n < r.length; n++)
    t.push(r[n]), e[n] && t.push(escapeHTML(String(e[n])));
  return fromHTML(t.join(""));
}
function fromHTML(r) {
  const e = document.createElement("div");
  return e.innerHTML = r, setTimeout(() => e.remove()), e.children[0];
}
function escapeRegExp(r) {
  return r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function formatString(r, e, { subst: t = { format: "${{ | }}", var: "|" } } = {}) {
  const n = t.format.split(t.var).map(escapeRegExp).join(String.raw`([$\w\d-_.: ]+)`);
  return r.replace(new RegExp(n, "g"), (s, a) => {
    var o;
    return (o = e[a]) == null ? void 0 : o.toString();
  });
}
class TaskerUnreponsiveError extends Error {
  constructor(t) {
    super("worker is unresponsive");
    l(this, "name", this.constructor.name);
    l(this, "tasker");
    this.tasker = t;
  }
}
class TaskerScriptError extends Error {
  constructor(t, n) {
    super(`script error caused by worker (${n.name})`);
    l(this, "name", this.constructor.name);
    l(this, "tasker");
    this.tasker = t, this.cause = n;
  }
}
class TaskerDeadState extends Error {
  constructor(t, n) {
    super(`worker is in dead state (${n})`);
    l(this, "name", this.constructor.name);
    l(this, "tasker");
    this.tasker = t;
  }
}
class TaskNotFound extends Error {
  constructor(t, n) {
    super("job not found in worker");
    l(this, "name", this.constructor.name);
    l(this, "tasker");
    l(this, "task");
    this.tasker = t, this.task = n;
  }
}
class TaskFulfilledEvent extends Event {
  constructor({ task: t, result: n }, s) {
    super("task_fulfilled", s);
    l(this, "task");
    l(this, "result");
    this.task = t, this.result = n;
  }
}
class TaskErrorEvent extends Event {
  constructor({ task: t, error: n }, s) {
    super("task_error", s);
    l(this, "task");
    l(this, "error");
    this.task = t, this.error = n;
  }
}
function workerLoop() {
  let state = "idling";
  function runTask(data) {
    state = "working";
    const callback = eval(`(${data.callbackCode})`), args = data.args;
    try {
      const r = callback(...args);
      r instanceof Promise ? r.then((e) => {
        self.postMessage({
          type: "task_fulfilled",
          returnValue: e
        });
      }).catch((e) => {
        self.postMessage({
          type: "task_error",
          error: e
        });
      }) : self.postMessage({
        type: "task_fulfilled",
        returnValue: r
      });
    } catch (r) {
      self.postMessage({
        type: "task_error",
        error: r
      });
    }
    state = "idling";
  }
  self.addEventListener("message", (r) => {
    const e = r.data;
    switch (e.type) {
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
      switch (e.type) {
        case "task_execute":
          runTask(e);
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
var w, b, d, f;
const M = class extends EventTarget {
  constructor({ url: t } = {}) {
    super();
    p(this, w, []);
    p(this, b, null);
    p(this, d, void 0);
    p(this, f, "idling");
    h(this, d, new Worker(t ?? M.scriptUrl)), this.work();
  }
  static createTask(t, n) {
    return {
      callback: t,
      args: n ?? []
    };
  }
  get worker() {
    return i(this, d);
  }
  set worker(t) {
    this.reinit(t);
  }
  /**
   * Returns Tasker status.
   * 
   * There are 6 Tasker status available:
   * - `idling` - Tasker is doing nothing.
   * - `working` - Tasker is executing remaining task in the queue.
   * - `suspended` - Tasker is executing a task once in the queue, and then no longer accept new task. Tasks that are not executed still remain in the queue.
   * - `shutdown` - Tasker is executing a task once in the queue, and then the `Worker` is closed. It will not execute remaining task in the queue. Same as "suspended", the tasks in the queue still remain.
   * - `terminated` - Tasker is immediately terminated, abandoning the task its executing. It will not execute remaining task in the queue. Same as "suspended", the tasks in the queue still remain.
   * - `error` - The last task Tasker executed throws an error, but still continuing remaining tasks.
   */
  get status() {
    return i(this, f);
  }
  work() {
    if (i(this, f) == "idling" && i(this, w).length > 0) {
      h(this, f, "working");
      const t = h(this, b, i(this, w).pop()), n = () => {
        h(this, f, "idling"), h(this, b, null), this.work();
      };
      this.execute(t).then(n).catch(n);
    }
  }
  terminate() {
    i(this, d).terminate(), h(this, f, "terminated");
  }
  reinit(t) {
    t ?? (t = new Worker(M.scriptUrl)), this.terminate(), h(this, f, "idling"), h(this, d, t), this.work();
  }
  async shutdown() {
    return i(this, d).postMessage({
      type: "shutdown"
    }), this.awaitMessage({ type: "status", test: (t) => t.status == "shutdown" }).then((t) => (h(this, f, "shutdown"), t));
  }
  async restart(t) {
    t ?? (t = new Worker(M.scriptUrl)), await this.shutdown(), h(this, f, "idling"), h(this, d, t), this.work();
  }
  async suspend() {
    return i(this, d).postMessage({
      type: "suspend"
    }), h(this, f, "suspended"), this.awaitMessage({ type: "status", test: (t) => t.status == "suspended" });
  }
  async resume() {
    return i(this, d).postMessage({
      type: "resume"
    }), this.awaitMessage({ type: "status", test: (t) => t.status == "idling" }).then((t) => (h(this, f, "idling"), this.work(), t));
  }
  async execute(t) {
    const n = {
      type: "task_execute",
      callbackCode: t.callback.toString(),
      args: t.args
    };
    i(this, d).postMessage(n);
    const s = await this.awaitMessage({
      test: (a) => a.type == "task_fulfilled" || a.type == "task_error"
    });
    if (s.type == "task_fulfilled") {
      const a = new TaskFulfilledEvent({ task: t, result: s.returnValue });
      return this.dispatchEvent(a), s.returnValue;
    } else {
      const a = new TaskerScriptError(this, s.error), o = new TaskErrorEvent({ task: t, error: a });
      throw this.dispatchEvent(o), a;
    }
  }
  async run(t, n) {
    const s = this.queue(t, n);
    return this.awaitTask(s);
  }
  queue(t, n) {
    if (!(i(this, f) == "idling" || i(this, f) == "working"))
      throw new TaskerDeadState(this, i(this, f));
    let s;
    return typeof t == "function" ? s = M.createTask(t, n) : s = t, i(this, w).push(s), this.work(), s;
  }
  remove(t) {
    const n = i(this, w).indexOf(t);
    if (n == -1)
      throw new TaskNotFound(this, t);
    return i(this, w).splice(n, 1), !0;
  }
  clearQueue() {
    i(this, w).length = 0;
  }
  awaitMessage({ type: t, test: n, timeout: s = 5e4 } = {}) {
    return new Promise((a) => {
      let o;
      i(this, d).addEventListener("message", (c) => {
        const u = c.data;
        t && (Array.isArray(t) && !t.includes(u.type) || u.type != t) || n && !n(u) || (o && clearTimeout(o), a(u));
      }, { once: !0 }), typeof s == "number" && (o = setTimeout(() => {
        throw new TaskerUnreponsiveError(this);
      }, s));
    });
  }
  awaitTask(t) {
    if (!i(this, w).includes(t) && i(this, b) != t)
      throw new TaskNotFound(this, t);
    return new Promise((n, s) => {
      this.addEventListener("task_fulfilled", (a) => {
        const o = a;
        o.task == t && n(o.result);
      }, { once: !0 }), this.addEventListener("task_error", (a) => {
        const o = a;
        o.task == t && s(o.error);
      }, { once: !0 });
    });
  }
};
let Tasker = M;
w = new WeakMap(), b = new WeakMap(), d = new WeakMap(), f = new WeakMap(), l(Tasker, "scriptUrl", `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);
function observeMutation({ target: r, abortSignal: e, once: t, ...n }, s) {
  const a = new MutationObserver((o) => {
    t && a.disconnect(), s({ records: o, observer: a });
  });
  return a.observe(r, n), e == null || e.addEventListener("abort", () => {
    a.disconnect();
  }), a;
}
function observeMutationOnce(r, e) {
  return observeMutation({ once: !0, ...r }, e);
}
function observeMutationAsync({ target: r, abortSignal: e, ...t }, n) {
  return new Promise((s) => {
    const a = new MutationObserver((o) => {
      a.disconnect(), s({ records: o, observer: a });
    });
    a.observe(r, t), e == null || e.addEventListener("abort", () => {
      a.disconnect();
    });
  });
}
const makeMutationObserver = observeMutation;
class WaitForElementTimeoutError extends Error {
  constructor(t) {
    super(`wait for element timeout for ${t}ms`);
    l(this, "name", this.constructor.name);
  }
}
class WaitForElementMaxTriesError extends Error {
  constructor(t) {
    super(`wait for element out of tries (max tries: ${t})`);
    l(this, "name", this.constructor.name);
  }
}
class WaitForElementMissingOptionError extends Error {
  constructor() {
    super(...arguments);
    l(this, "name", this.constructor.name);
  }
}
async function awaitDomContentLoaded() {
  return new Promise((r) => {
    if (document.readyState != "loading")
      return r();
    document.addEventListener("DOMContentLoaded", () => r());
  });
}
function isNotEmpty(r) {
  return r instanceof NodeList && r.length > 0 ? !0 : r != null;
}
async function executeQuery(r) {
  var E;
  let e;
  const t = r.parent ?? document.body, n = r.querySelector ?? ((v, k) => v.querySelector(k)), s = r.maxTries ?? 1 / 0, a = r.timeout ?? 1e4;
  if ((r.ensureDomContentLoaded ?? !0) && await awaitDomContentLoaded(), "id" in r)
    e = `#${r.id}`;
  else if ("selector" in r)
    e = r.selector;
  else
    throw new WaitForElementMissingOptionError('missing options "id" or "selector"');
  let c = n(t, e);
  if (isNotEmpty(c))
    return c;
  let u = 0;
  const L = new AbortController(), m = L.signal;
  return (E = r.abortSignal) == null || E.addEventListener("abort", () => L.abort()), new Promise((v, k) => {
    const y = observeMutation({ target: t, abortSignal: m, childList: !0, subtree: !0, ...r.observerOptions }, () => {
      c = n(t, e), isNotEmpty(c) ? (y.disconnect(), v(c)) : u > s && (y.disconnect(), k(new WaitForElementMaxTriesError(s))), u++;
    });
    a != !1 && a != 1 / 0 && setTimeout(() => {
      y.disconnect(), k(new WaitForElementTimeoutError(a));
    }, a);
  });
}
function waitForElement(r, e, t) {
  let n;
  return e instanceof Node && "children" in e ? n = {
    selector: r,
    parent: e,
    ...t
  } : n = {
    selector: r,
    ...e
  }, executeQuery({ selector: r, ...n });
}
function waitForElementAll(r, e) {
  return executeQuery({ selector: r, ...e }).then((t) => Array.from(t));
}
function waitForElementParent(r, e, t) {
  return executeQuery({ selector: e, parent: r, ...t });
}
function waitForElementId(r, e) {
  return executeQuery({ id: r, ...e });
}
function waitForElementInf(r, e) {
  return executeQuery({ selector: r, timeout: 1 / 0, ...e });
}
const DATA_URL_DEFAULT_MIME_TYPE = "text/plain", DATA_URL_DEFAULT_CHARSET = "us-ascii", testParameter = (r, e) => e.some((t) => t instanceof RegExp ? t.test(r) : t === r), supportedProtocols = /* @__PURE__ */ new Set([
  "https:",
  "http:",
  "file:"
]), hasCustomProtocol = (r) => {
  try {
    const { protocol: e } = new URL(r);
    return e.endsWith(":") && !supportedProtocols.has(e);
  } catch {
    return !1;
  }
}, normalizeDataURL = (r, { stripHash: e }) => {
  var E;
  const t = /^data:(?<type>[^,]*?),(?<data>[^#]*?)(?:#(?<hash>.*))?$/.exec(r);
  if (!t)
    throw new Error(`Invalid URL: ${r}`);
  let { type: n, data: s, hash: a } = t.groups;
  const o = n.split(";");
  a = e ? "" : a;
  let c = !1;
  o[o.length - 1] === "base64" && (o.pop(), c = !0);
  const u = ((E = o.shift()) == null ? void 0 : E.toLowerCase()) ?? "", m = [
    ...o.map((v) => {
      let [k, y = ""] = v.split("=").map((U) => U.trim());
      return k === "charset" && (y = y.toLowerCase(), y === DATA_URL_DEFAULT_CHARSET) ? "" : `${k}${y ? `=${y}` : ""}`;
    }).filter(Boolean)
  ];
  return c && m.push("base64"), (m.length > 0 || u && u !== DATA_URL_DEFAULT_MIME_TYPE) && m.unshift(u), `data:${m.join(";")},${c ? s.trim() : s}${a ? `#${a}` : ""}`;
};
function normalizeUrl(r, e) {
  if (e = {
    defaultProtocol: "http",
    normalizeProtocol: !0,
    forceHttp: !1,
    forceHttps: !1,
    stripAuthentication: !0,
    stripHash: !1,
    stripTextFragment: !0,
    stripWWW: !0,
    removeQueryParameters: [/^utm_\w+/i],
    removeTrailingSlash: !0,
    removeSingleSlash: !0,
    removeDirectoryIndex: !1,
    removeExplicitPort: !1,
    sortQueryParameters: !0,
    ...e
  }, typeof e.defaultProtocol == "string" && !e.defaultProtocol.endsWith(":") && (e.defaultProtocol = `${e.defaultProtocol}:`), r = r.trim(), /^data:/i.test(r))
    return normalizeDataURL(r, e);
  if (hasCustomProtocol(r))
    return r;
  const t = r.startsWith("//");
  !t && /^\.*\//.test(r) || (r = r.replace(/^(?!(?:\w+:)?\/\/)|^\/\//, e.defaultProtocol));
  const s = new URL(r);
  if (e.forceHttp && e.forceHttps)
    throw new Error("The `forceHttp` and `forceHttps` options cannot be used together");
  if (e.forceHttp && s.protocol === "https:" && (s.protocol = "http:"), e.forceHttps && s.protocol === "http:" && (s.protocol = "https:"), e.stripAuthentication && (s.username = "", s.password = ""), e.stripHash ? s.hash = "" : e.stripTextFragment && (s.hash = s.hash.replace(/#?:~:text.*?$/i, "")), s.pathname) {
    const o = /\b[a-z][a-z\d+\-.]{1,50}:\/\//g;
    let c = 0, u = "";
    for (; ; ) {
      const m = o.exec(s.pathname);
      if (!m)
        break;
      const E = m[0], v = m.index, k = s.pathname.slice(c, v);
      u += k.replace(/\/{2,}/g, "/"), u += E, c = v + E.length;
    }
    const L = s.pathname.slice(c, s.pathname.length);
    u += L.replace(/\/{2,}/g, "/"), s.pathname = u;
  }
  if (s.pathname)
    try {
      s.pathname = decodeURI(s.pathname);
    } catch {
    }
  if (e.removeDirectoryIndex === !0 && (e.removeDirectoryIndex = [/^index\.[a-z]+$/]), Array.isArray(e.removeDirectoryIndex) && e.removeDirectoryIndex.length > 0) {
    let o = s.pathname.split("/");
    const c = o[o.length - 1];
    testParameter(c, e.removeDirectoryIndex) && (o = o.slice(0, -1), s.pathname = o.slice(1).join("/") + "/");
  }
  if (s.hostname && (s.hostname = s.hostname.replace(/\.$/, ""), e.stripWWW && /^www\.(?!www\.)[a-z\-\d]{1,63}\.[a-z.\-\d]{2,63}$/.test(s.hostname) && (s.hostname = s.hostname.replace(/^www\./, ""))), Array.isArray(e.removeQueryParameters))
    for (const o of [...s.searchParams.keys()])
      testParameter(o, e.removeQueryParameters) && s.searchParams.delete(o);
  if (!Array.isArray(e.keepQueryParameters) && e.removeQueryParameters === !0 && (s.search = ""), Array.isArray(e.keepQueryParameters) && e.keepQueryParameters.length > 0)
    for (const o of [...s.searchParams.keys()])
      testParameter(o, e.keepQueryParameters) || s.searchParams.delete(o);
  if (e.sortQueryParameters) {
    s.searchParams.sort();
    try {
      s.search = decodeURIComponent(s.search);
    } catch {
    }
  }
  e.removeTrailingSlash && (s.pathname = s.pathname.replace(/\/$/, "")), e.removeExplicitPort && s.port && (s.port = "");
  const a = r;
  return r = s.toString(), !e.removeSingleSlash && s.pathname === "/" && !a.endsWith("/") && s.hash === "" && (r = r.replace(/\/$/, "")), (e.removeTrailingSlash || s.pathname === "/") && s.hash === "" && e.removeSingleSlash && (r = r.replace(/\/$/, "")), t && !e.normalizeProtocol && (r = r.replace(/^http:\/\//, "//")), e.stripProtocol && (r = r.replace(/^(?:https?:)?\/\//, "")), r;
}
function urlMatches(r, e) {
  let t = !1;
  return e == null ? !1 : r === !0 ? !0 : (e = normalizeUrl(e), r instanceof URL && (t = normalizeUrl(r.href) == e), typeof r == "string" && (t = normalizeUrl(r) == e), r instanceof RegExp && (t = r.test(e)), t);
}
function headersMatches(r, e) {
  let t = !1;
  if (Object.keys(r).length == 0)
    return !0;
  for (const s of Object.keys(r)) {
    const a = r[s], o = e.get(s);
    if (o == null)
      return !1;
    if (a === !0)
      return !0;
    if (a instanceof URL ? t = normalizeUrl(a.href) == normalizeUrl(o) : a instanceof RegExp ? t = a.test(o) : t = String(a) == o, !t)
      return !1;
  }
  return t;
}
function fetchInterceptorFactory(r, e) {
  return async function(n, s) {
    const a = new Request(n, s), o = r.interceptRequest(a);
    return o.blocked ? Response.error() : e(o).then((c) => r.interceptResponse(c));
  };
}
var T, g, x, P, R, F;
class NetworkInterceptor {
  constructor({ global: e = globalThis, fetchKey: t = "fetch", xmlHttpRequestKey: n = "XMLHttpRequest" } = {}) {
    p(this, T, []);
    p(this, g, []);
    p(this, x, void 0);
    p(this, P, void 0);
    p(this, R, void 0);
    p(this, F, void 0);
    h(this, x, e[t]), h(this, P, e[t] = fetchInterceptorFactory(this, i(this, x))), h(this, R, e[n]), h(this, F, e[n]);
  }
  get windowFetch() {
    return i(this, x);
  }
  get patchedFetch() {
    return i(this, P);
  }
  interceptRequest(e) {
    let t = e;
    t.blocked = !1;
    for (const n of i(this, T))
      if (urlMatches(n.url, t.url) && headersMatches(n.headers, t.headers)) {
        if (n.block) {
          t.blocked = !0;
          break;
        }
        if (n.redirect && (t = new Request(n.redirect, t), t.blocked = !1), n.callback(t), t.blocked)
          break;
      }
    return t;
  }
  interceptResponse(e) {
    const t = e;
    for (const n of i(this, g))
      urlMatches(n.url, t.url) && headersMatches(n.headers, t.headers) && n.callback(t);
    return t;
  }
  addRule(e, t, n, s) {
    let a;
    if (e.constructor == Object) {
      if (a = e, !a.type)
        throw new TypeError("missing type option");
      if (!a.callback)
        throw new TypeError("missing callback option");
    } else
      a = {
        type: e,
        url: t,
        callback: n,
        ...s
      };
    return a.headers ?? (a.headers = {}), a.type == "request" ? i(this, T).push(a) : a.type == "response" && i(this, g).push(a), a;
  }
  removeRule(e) {
    if (e.type == "request") {
      const t = i(this, T).findIndex((n) => n == e);
      i(this, T).splice(t, 1);
    } else {
      const t = i(this, g).findIndex((n) => n == e);
      i(this, g).splice(t, 1);
    }
  }
  clearRules() {
    i(this, T).length = 0, i(this, g).length = 0;
  }
  patchFetch() {
    window.fetch = i(this, P);
  }
  restoreFetch() {
    window.fetch = i(this, x);
  }
}
T = new WeakMap(), g = new WeakMap(), x = new WeakMap(), P = new WeakMap(), R = new WeakMap(), F = new WeakMap();
export {
  HTMLEntityMap,
  NetworkInterceptor,
  TaskErrorEvent,
  TaskFulfilledEvent,
  TaskNotFound,
  Tasker,
  TaskerDeadState,
  TaskerScriptError,
  TaskerUnreponsiveError,
  awaitDomContentLoaded,
  escapeHTML,
  escapeRegExp,
  executeQuery,
  formatString,
  fromHTML,
  headersMatches,
  html,
  makeMutationObserver,
  observeMutation,
  observeMutationAsync,
  observeMutationOnce,
  urlMatches,
  waitForElement,
  waitForElementAll,
  waitForElementId,
  waitForElementInf,
  waitForElementParent
};
//# sourceMappingURL=oxi.es.js.map
