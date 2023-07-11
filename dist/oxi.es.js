var I = Object.defineProperty;
var W = (r, e, t) => e in r ? I(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var h = (r, e, t) => (W(r, typeof e != "symbol" ? e + "" : e, t), t), A = (r, e, t) => {
  if (!e.has(r))
    throw TypeError("Cannot " + t);
};
var i = (r, e, t) => (A(r, e, "read from private field"), t ? t.call(r) : e.get(r)), p = (r, e, t) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, t);
}, l = (r, e, t, n) => (A(r, e, "write to private field"), n ? n.call(r, t) : e.set(r, t), t);
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
  return r.replace(new RegExp(n, "g"), (s, o) => {
    var a;
    return (a = e[o]) == null ? void 0 : a.toString();
  });
}
class WorkerUnreponsiveError extends Error {
  constructor(t) {
    super("worker is unresponsive");
    h(this, "name", this.constructor.name);
    h(this, "worker");
    this.worker = t;
  }
}
class WorkerScriptError extends Error {
  constructor(t, n) {
    super(`script error caused by worker (${n.name})`);
    h(this, "name", this.constructor.name);
    h(this, "worker");
    this.worker = t, this.cause = n;
  }
}
class WorkerDeadState extends Error {
  constructor(t, n) {
    super(`worker is in dead state (${n})`);
    h(this, "name", this.constructor.name);
    h(this, "worker");
    this.worker = t;
  }
}
class JobNotFound extends Error {
  constructor(t, n) {
    super("job not found in worker");
    h(this, "name", this.constructor.name);
    h(this, "worker");
    h(this, "job");
    this.worker = t, this.job = n;
  }
}
class JobFinishedEvent extends Event {
  constructor({ job: t, result: n }, s) {
    super("job-finished", s);
    h(this, "job");
    h(this, "result");
    this.job = t, this.result = n;
  }
}
class JobErrorEvent extends Event {
  constructor({ job: t, error: n }, s) {
    super("job-error", s);
    h(this, "job");
    h(this, "error");
    this.job = t, this.error = n;
  }
}
function workerLoop() {
  let state = "idling";
  function executeParentCode(data) {
    state = "working";
    const callback = eval(`(${data.functionCode})`), args = data.args;
    try {
      const r = callback(...args);
      self.postMessage({
        type: "execution_result",
        success: !0,
        returnValue: r
      });
    } catch (r) {
      self.postMessage({
        type: "execution_result",
        success: !1,
        error: r
      });
    }
    state = "idling";
  }
  async function executeParentCodeAsync(data) {
    state = "working";
    const callback = eval(`(${data.functionCode})`), args = data.args;
    callback(...args).then((r) => {
      self.postMessage({
        type: "execution_result",
        success: !0,
        returnValue: r
      }), state = "idling";
    }).catch((r) => {
      self.postMessage({
        type: "execution_result",
        success: !1,
        error: r
      }), state = "idling";
    });
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
        case "execute":
          executeParentCode(e);
          break;
        case "execute_async":
          e.shouldAwait ? executeParentCodeAsync(e) : executeParentCode(e);
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
var w, x, f, d;
const P = class extends EventTarget {
  constructor({ url: t } = {}) {
    super();
    p(this, w, []);
    p(this, x, null);
    p(this, f, void 0);
    p(this, d, "idling");
    h(this, "awaitJobDone", this.awaitJob);
    l(this, f, new Worker(t ?? P.scriptUrl)), this.work();
  }
  static createJob(t, n) {
    return {
      callback: t,
      args: n ?? []
    };
  }
  get worker() {
    return i(this, f);
  }
  set worker(t) {
    this.reinit(t);
  }
  get state() {
    return i(this, d);
  }
  work() {
    if (i(this, d) == "idling" && i(this, w).length > 0) {
      l(this, d, "working");
      const t = l(this, x, i(this, w).pop());
      this.execute(t).then((n) => {
        l(this, d, "idling"), l(this, x, null);
        const s = new JobFinishedEvent({ job: t, result: n });
        this.dispatchEvent(s), this.work();
      }).catch((n) => {
        const s = n;
        console.error(s), l(this, d, "idling"), l(this, x, null);
        const o = new JobErrorEvent({ job: t, error: s.cause });
        this.dispatchEvent(o), this.work();
      });
    }
  }
  clearQueue() {
    i(this, w).length = 0;
  }
  reinit(t) {
    t ?? (t = new Worker(P.scriptUrl)), this.terminate(), l(this, d, "idling"), l(this, f, t), this.work();
  }
  terminate() {
    i(this, f).terminate(), l(this, d, "terminated");
  }
  async restart(t) {
    t ?? (t = new Worker(P.scriptUrl)), await this.shutdown(), l(this, d, "idling"), l(this, f, t), this.work();
  }
  async shutdown() {
    return i(this, f).postMessage({
      type: "shutdown"
    }), this.awaitMessage({ type: "status", test: (t) => t.status == "shutdown" }).then((t) => (l(this, d, "shutdown"), t));
  }
  async suspend() {
    return i(this, f).postMessage({
      type: "suspend"
    }), l(this, d, "suspended"), this.awaitMessage({ type: "status", test: (t) => t.status == "suspended" });
  }
  async resume() {
    return i(this, f).postMessage({
      type: "resume"
    }), this.awaitMessage({ type: "status", test: (t) => t.status == "idling" }).then((t) => (l(this, d, "idling"), this.work(), t));
  }
  async execute(t) {
    const n = {
      type: "execute",
      functionCode: t.callback.toString(),
      args: t.args
    };
    i(this, f).postMessage(n);
    const s = await this.awaitMessage({ type: "execution_result" });
    if (s.success)
      return s.returnValue;
    throw new WorkerScriptError(this, s.error);
  }
  async run(t, n) {
    const s = this.queue(t, n);
    return this.awaitJob(s);
  }
  queue(t, n) {
    if (!(i(this, d) == "idling" || i(this, d) == "working"))
      throw new WorkerDeadState(this, i(this, d));
    let s;
    return typeof t == "function" ? s = P.createJob(t, n) : s = t, i(this, w).push(s), this.work(), s;
  }
  remove(t) {
    const n = i(this, w).indexOf(t);
    return n == -1 ? !1 : (i(this, w).splice(n, 1), !0);
  }
  awaitMessage({ type: t, test: n, timeout: s = 5e4 } = {}) {
    return new Promise((o) => {
      let a;
      i(this, f).addEventListener("message", (c) => {
        const u = c.data;
        t && u.type != t || n && !n(u) || (a && clearTimeout(a), o(u));
      }), typeof s == "number" && (a = setTimeout(() => {
        throw new WorkerUnreponsiveError(this);
      }, s));
    });
  }
  awaitJob(t) {
    if (!i(this, w).includes(t) && i(this, x) != t)
      throw new JobNotFound(this, t);
    return new Promise((n, s) => {
      const o = (c) => {
        const u = c;
        u.job == t && (n(u.result), this.removeEventListener("job-finished", o));
      }, a = (c) => {
        const u = c;
        u.job == t && (s(u.error), this.removeEventListener("job-error", o));
      };
      this.addEventListener("job-finished", o), this.addEventListener("job-error", a);
    });
  }
};
let WorkerJQ = P;
w = new WeakMap(), x = new WeakMap(), f = new WeakMap(), d = new WeakMap(), h(WorkerJQ, "scriptUrl", `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);
function observeMutation({ target: r, abortSignal: e, once: t, ...n }, s) {
  const o = new MutationObserver((a) => {
    t && o.disconnect(), s({ records: a, observer: o });
  });
  return o.observe(r, n), e == null || e.addEventListener("abort", () => {
    o.disconnect();
  }), o;
}
function observeMutationOnce(r, e) {
  return observeMutation({ once: !0, ...r }, e);
}
function observeMutationAsync({ target: r, abortSignal: e, ...t }, n) {
  return new Promise((s) => {
    const o = new MutationObserver((a) => {
      o.disconnect(), s({ records: a, observer: o });
    });
    o.observe(r, t), e == null || e.addEventListener("abort", () => {
      o.disconnect();
    });
  });
}
const makeMutationObserver = observeMutation;
class WaitForElementTimeoutError extends Error {
  constructor(t) {
    super(`wait for element timeout for ${t}ms`);
    h(this, "name", this.constructor.name);
  }
}
class WaitForElementMaxTriesError extends Error {
  constructor(t) {
    super(`wait for element out of tries (max tries: ${t})`);
    h(this, "name", this.constructor.name);
  }
}
class WaitForElementMissingOptionError extends Error {
  constructor() {
    super(...arguments);
    h(this, "name", this.constructor.name);
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
  var b;
  let e;
  const t = r.parent ?? document.body, n = r.querySelector ?? ((k, y) => k.querySelector(y)), s = r.maxTries ?? 1 / 0, o = r.timeout ?? 1e4;
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
  const R = new AbortController(), m = R.signal;
  return (b = r.abortSignal) == null || b.addEventListener("abort", () => R.abort()), new Promise((k, y) => {
    const E = observeMutation({ target: t, abortSignal: m, childList: !0, subtree: !0, ...r.observerOptions }, () => {
      c = n(t, e), isNotEmpty(c) ? (E.disconnect(), k(c)) : u > s && (E.disconnect(), y(new WaitForElementMaxTriesError(s))), u++;
    });
    o != !1 && o != 1 / 0 && setTimeout(() => {
      E.disconnect(), y(new WaitForElementTimeoutError(o));
    }, o);
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
  var b;
  const t = /^data:(?<type>[^,]*?),(?<data>[^#]*?)(?:#(?<hash>.*))?$/.exec(r);
  if (!t)
    throw new Error(`Invalid URL: ${r}`);
  let { type: n, data: s, hash: o } = t.groups;
  const a = n.split(";");
  o = e ? "" : o;
  let c = !1;
  a[a.length - 1] === "base64" && (a.pop(), c = !0);
  const u = ((b = a.shift()) == null ? void 0 : b.toLowerCase()) ?? "", m = [
    ...a.map((k) => {
      let [y, E = ""] = k.split("=").map((U) => U.trim());
      return y === "charset" && (E = E.toLowerCase(), E === DATA_URL_DEFAULT_CHARSET) ? "" : `${y}${E ? `=${E}` : ""}`;
    }).filter(Boolean)
  ];
  return c && m.push("base64"), (m.length > 0 || u && u !== DATA_URL_DEFAULT_MIME_TYPE) && m.unshift(u), `data:${m.join(";")},${c ? s.trim() : s}${o ? `#${o}` : ""}`;
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
    const a = /\b[a-z][a-z\d+\-.]{1,50}:\/\//g;
    let c = 0, u = "";
    for (; ; ) {
      const m = a.exec(s.pathname);
      if (!m)
        break;
      const b = m[0], k = m.index, y = s.pathname.slice(c, k);
      u += y.replace(/\/{2,}/g, "/"), u += b, c = k + b.length;
    }
    const R = s.pathname.slice(c, s.pathname.length);
    u += R.replace(/\/{2,}/g, "/"), s.pathname = u;
  }
  if (s.pathname)
    try {
      s.pathname = decodeURI(s.pathname);
    } catch {
    }
  if (e.removeDirectoryIndex === !0 && (e.removeDirectoryIndex = [/^index\.[a-z]+$/]), Array.isArray(e.removeDirectoryIndex) && e.removeDirectoryIndex.length > 0) {
    let a = s.pathname.split("/");
    const c = a[a.length - 1];
    testParameter(c, e.removeDirectoryIndex) && (a = a.slice(0, -1), s.pathname = a.slice(1).join("/") + "/");
  }
  if (s.hostname && (s.hostname = s.hostname.replace(/\.$/, ""), e.stripWWW && /^www\.(?!www\.)[a-z\-\d]{1,63}\.[a-z.\-\d]{2,63}$/.test(s.hostname) && (s.hostname = s.hostname.replace(/^www\./, ""))), Array.isArray(e.removeQueryParameters))
    for (const a of [...s.searchParams.keys()])
      testParameter(a, e.removeQueryParameters) && s.searchParams.delete(a);
  if (!Array.isArray(e.keepQueryParameters) && e.removeQueryParameters === !0 && (s.search = ""), Array.isArray(e.keepQueryParameters) && e.keepQueryParameters.length > 0)
    for (const a of [...s.searchParams.keys()])
      testParameter(a, e.keepQueryParameters) || s.searchParams.delete(a);
  if (e.sortQueryParameters) {
    s.searchParams.sort();
    try {
      s.search = decodeURIComponent(s.search);
    } catch {
    }
  }
  e.removeTrailingSlash && (s.pathname = s.pathname.replace(/\/$/, "")), e.removeExplicitPort && s.port && (s.port = "");
  const o = r;
  return r = s.toString(), !e.removeSingleSlash && s.pathname === "/" && !o.endsWith("/") && s.hash === "" && (r = r.replace(/\/$/, "")), (e.removeTrailingSlash || s.pathname === "/") && s.hash === "" && e.removeSingleSlash && (r = r.replace(/\/$/, "")), t && !e.normalizeProtocol && (r = r.replace(/^http:\/\//, "//")), e.stripProtocol && (r = r.replace(/^(?:https?:)?\/\//, "")), r;
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
    const o = r[s], a = e.get(s);
    if (a == null)
      return !1;
    if (o === !0)
      return !0;
    if (o instanceof URL ? t = normalizeUrl(o.href) == normalizeUrl(a) : o instanceof RegExp ? t = o.test(a) : t = String(o) == a, !t)
      return !1;
  }
  return t;
}
function fetchInterceptorFactory(r, e) {
  return async function(n, s) {
    const o = new Request(n, s), a = r.interceptRequest(o);
    return a.blocked ? Response.error() : e(a).then((c) => r.interceptResponse(c));
  };
}
var v, g, M, L, T, F;
class NetworkInterceptor {
  constructor({ global: e = globalThis, fetchKey: t = "fetch", xmlHttpRequestKey: n = "XMLHttpRequest" } = {}) {
    p(this, v, []);
    p(this, g, []);
    p(this, M, void 0);
    p(this, L, void 0);
    p(this, T, void 0);
    p(this, F, void 0);
    l(this, M, e[t]), l(this, L, e[t] = fetchInterceptorFactory(this, i(this, M))), l(this, T, e[n]), l(this, F, e[n]);
  }
  get windowFetch() {
    return i(this, M);
  }
  get patchedFetch() {
    return i(this, L);
  }
  interceptRequest(e) {
    let t = e;
    t.blocked = !1;
    for (const n of i(this, v))
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
    let o;
    if (e.constructor == Object) {
      if (o = e, !o.type)
        throw new TypeError("missing type option");
      if (!o.callback)
        throw new TypeError("missing callback option");
    } else
      o = {
        type: e,
        url: t,
        callback: n,
        ...s
      };
    return o.headers ?? (o.headers = {}), o.type == "request" ? i(this, v).push(o) : o.type == "response" && i(this, g).push(o), o;
  }
  removeRule(e) {
    if (e.type == "request") {
      const t = i(this, v).findIndex((n) => n == e);
      i(this, v).splice(t, 1);
    } else {
      const t = i(this, g).findIndex((n) => n == e);
      i(this, g).splice(t, 1);
    }
  }
  clearRules() {
    i(this, v).length = 0, i(this, g).length = 0;
  }
  patchFetch() {
    window.fetch = i(this, L);
  }
  restoreFetch() {
    window.fetch = i(this, M);
  }
}
v = new WeakMap(), g = new WeakMap(), M = new WeakMap(), L = new WeakMap(), T = new WeakMap(), F = new WeakMap();
export {
  HTMLEntityMap,
  JobErrorEvent,
  JobFinishedEvent,
  JobNotFound,
  NetworkInterceptor,
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
