(function(n,o){typeof exports=="object"&&typeof module<"u"?o(exports):typeof define=="function"&&define.amd?define(["exports"],o):(n=typeof globalThis<"u"?globalThis:n||self,o(n.oxi={}))})(this,function(exports){var n,o,a,l;"use strict";var L=Object.defineProperty;var F=(n,o,a)=>o in n?L(n,o,{enumerable:!0,configurable:!0,writable:!0,value:a}):n[o]=a;var d=(n,o,a)=>(F(n,typeof o!="symbol"?o+"":o,a),a),y=(n,o,a)=>{if(!o.has(n))throw TypeError("Cannot "+a)};var u=(n,o,a)=>(y(n,o,"read from private field"),a?a.call(n):o.get(n)),E=(n,o,a)=>{if(o.has(n))throw TypeError("Cannot add the same private member more than once");o instanceof WeakSet?o.add(n):o.set(n,a)},h=(n,o,a,l)=>(y(n,o,"write to private field"),l?l.call(n,a):o.set(n,a),a);const HTMLEntityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHTML(t){return t.replace(/[&<>"'`=\/]/g,r=>HTMLEntityMap[r])}function html(t,...r){const e=[];for(let s=0;s<t.length;s++)e.push(t[s]),r[s]&&e.push(escapeHTML(String(r[s])));return fromHTML(e.join(""))}function fromHTML(t){const r=document.createElement("div");return r.innerHTML=t,setTimeout(()=>r.remove()),r.children[0]}function escapeRegExp(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function formatString(t,r,{subst:e={format:"${{ | }}",var:"|"}}={}){const s=e.format.split(e.var).map(escapeRegExp).join(String.raw`([$\w\d-_.: ]+)`);return t.replace(new RegExp(s,"g"),(i,c)=>{var p;return(p=r[c])==null?void 0:p.toString()})}class WorkerUnreponsiveError extends Error{constructor(e){super("worker is unresponsive");d(this,"name",this.constructor.name);d(this,"worker");this.worker=e}}class WorkerScriptError extends Error{constructor(e,s){super(`script error caused by worker (${s.name})`);d(this,"name",this.constructor.name);d(this,"worker");this.worker=e,this.cause=s}}class WorkerDeadState extends Error{constructor(e,s){super(`worker is in dead state (${s})`);d(this,"name",this.constructor.name);d(this,"worker");this.worker=e}}class JobNotFound extends Error{constructor(e,s){super("job not found in worker");d(this,"name",this.constructor.name);d(this,"worker");d(this,"job");this.worker=e,this.job=s}}class JobFinishedEvent extends Event{constructor({job:e,result:s},i){super("job-finished",i);d(this,"job");d(this,"result");this.job=e,this.result=s}}class JobErrorEvent extends Event{constructor({job:e,error:s},i){super("job-error",i);d(this,"job");d(this,"error");this.job=e,this.error=s}}function workerLoop(){let state="idling";function executeParentCode(data){state="working";const callback=eval(`(${data.functionCode})`),args=data.args;try{const t=callback(...args);self.postMessage({type:"execution_result",success:!0,returnValue:t})}catch(t){self.postMessage({type:"execution_result",success:!1,error:t})}state="idling"}async function executeParentCodeAsync(data){state="working";const callback=eval(`(${data.functionCode})`),args=data.args;callback(...args).then(t=>{self.postMessage({type:"execution_result",success:!0,returnValue:t}),state="idling"}).catch(t=>{self.postMessage({type:"execution_result",success:!1,error:t}),state="idling"})}self.addEventListener("message",t=>{const r=t.data;switch(r.type){case"status":self.postMessage({type:"status",status:state});break;case"resume":state="idling";break}if(state!="suspended")switch(r.type){case"execute":executeParentCode(r);break;case"execute_async":r.shouldAwait?executeParentCodeAsync(r):executeParentCode(r);break;case"suspend":state="suspended";break;case"shutdown":state="shutdown",self.postMessage({type:"status",status:"shutdown"}),self.close();break}})}const w=class extends EventTarget{constructor({url:e}={}){super();E(this,n,[]);E(this,o,null);E(this,a,void 0);E(this,l,"idling");d(this,"awaitJobDone",this.awaitJob);h(this,a,new Worker(e??w.scriptUrl)),this.work()}static createJob(e,s){return{callback:e,args:s??[]}}get worker(){return u(this,a)}set worker(e){this.reinit(e)}get state(){return u(this,l)}work(){if(u(this,l)=="idling"&&u(this,n).length>0){h(this,l,"working");const e=h(this,o,u(this,n).pop());this.execute(e).then(s=>{h(this,l,"idling"),h(this,o,null);const i=new JobFinishedEvent({job:e,result:s});this.dispatchEvent(i),this.work()}).catch(s=>{const i=s;console.error(i),h(this,l,"idling"),h(this,o,null);const c=new JobErrorEvent({job:e,error:i.cause});this.dispatchEvent(c),this.work()})}}clearQueue(){u(this,n).length=0}reinit(e){e??(e=new Worker(w.scriptUrl)),this.terminate(),h(this,l,"idling"),h(this,a,e),this.work()}terminate(){u(this,a).terminate(),h(this,l,"terminated")}async restart(e){e??(e=new Worker(w.scriptUrl)),await this.shutdown(),h(this,l,"idling"),h(this,a,e),this.work()}async shutdown(){return u(this,a).postMessage({type:"shutdown"}),this.awaitMessage({type:"status",test:e=>e.status=="shutdown"}).then(e=>(h(this,l,"shutdown"),e))}async suspend(){u(this,a).postMessage({type:"suspend"}),h(this,l,"suspended")}async resume(){u(this,a).postMessage({type:"resume"}),h(this,l,"idling"),this.work()}async execute(e){const s={type:"execute",functionCode:e.callback.toString(),args:e.args};u(this,a).postMessage(s);const i=await this.awaitMessage({type:"execution_result"});if(i.success)return i.returnValue;throw new WorkerScriptError(this,i.error)}async run(e,s){const i=this.queue(e,s);return this.awaitJob(i)}queue(e,s){if(!(u(this,l)=="idling"||u(this,l)=="working"))throw new WorkerDeadState(this,u(this,l));let i;return typeof e=="function"?i=w.createJob(e,s):i=e,u(this,n).push(i),this.work(),i}remove(e){const s=u(this,n).indexOf(e);return s==-1?!1:(u(this,n).splice(s,1),!0)}awaitMessage({type:e,test:s,timeout:i=5e4}={}){return new Promise(c=>{let p;u(this,a).addEventListener("message",f=>{const m=f.data;e&&m.type!=e||s&&!s(m)||(p&&clearTimeout(p),c(m))}),typeof i=="number"&&(p=setTimeout(()=>{throw new WorkerUnreponsiveError(this)},i))})}awaitJob(e){if(!u(this,n).includes(e)&&u(this,o)!=e)throw new JobNotFound(this,e);return new Promise((s,i)=>{const c=f=>{const m=f;m.job==e&&(s(m.result),this.removeEventListener("job-finished",c))},p=f=>{const m=f;m.job==e&&(i(m.error),this.removeEventListener("job-error",c))};this.addEventListener("job-finished",c),this.addEventListener("job-error",p)})}};let WorkerJQ=w;n=new WeakMap,o=new WeakMap,a=new WeakMap,l=new WeakMap,d(WorkerJQ,"scriptUrl",`data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);function observeMutation({target:t,abortSignal:r,once:e,...s},i){const c=new MutationObserver(p=>{e&&c.disconnect(),i({records:p,observer:c})});return c.observe(t,s),r==null||r.addEventListener("abort",()=>{c.disconnect()}),c}function observeMutationOnce(t,r){return observeMutation({once:!0,...t},r)}function observeMutationAsync({target:t,abortSignal:r,...e},s){return new Promise(i=>{const c=new MutationObserver(p=>{c.disconnect(),i({records:p,observer:c})});c.observe(t,e),r==null||r.addEventListener("abort",()=>{c.disconnect()})})}const makeMutationObserver=observeMutation;class WaitForElementTimeoutError extends Error{constructor(e){super(`wait for element timeout for ${e}ms`);d(this,"name",this.constructor.name)}}class WaitForElementMaxTriesError extends Error{constructor(e){super(`wait for element out of tries (max tries: ${e})`);d(this,"name",this.constructor.name)}}class WaitForElementMissingOptionError extends Error{constructor(){super(...arguments);d(this,"name",this.constructor.name)}}async function awaitDomContentLoaded(){return new Promise(t=>{if(document.readyState!="loading")return t();document.addEventListener("DOMContentLoaded",()=>t())})}function isNotEmpty(t){return t instanceof NodeList&&t.length>0?!0:t!=null}async function executeQuery(t){var v;let r;const e=t.parent??document.body,s=t.querySelector??((b,x)=>b.querySelector(x)),i=t.maxTries??1/0,c=t.timeout??1e4;if((t.ensureDomContentLoaded??!0)&&await awaitDomContentLoaded(),"id"in t)r=`#${t.id}`;else if("selector"in t)r=t.selector;else throw new WaitForElementMissingOptionError('missing options "id" or "selector"');let f=s(e,r);if(isNotEmpty(f))return f;let m=0;const k=new AbortController,M=k.signal;return(v=t.abortSignal)==null||v.addEventListener("abort",()=>k.abort()),new Promise((b,x)=>{const g=observeMutation({target:e,abortSignal:M,childList:!0,subtree:!0,...t.observerOptions},()=>{f=s(e,r),isNotEmpty(f)?(b(f),g.disconnect()):m>i&&(g.disconnect(),x(new WaitForElementMaxTriesError(i))),m++});c!=!1&&c!=1/0&&setTimeout(()=>{g.disconnect(),x(new WaitForElementTimeoutError(c))},c)})}function waitForElement(t,r,e){let s;return r instanceof Node&&"children"in r?s={selector:t,parent:r,...e}:s={selector:t,...r},executeQuery({selector:t,...s})}function waitForElementAll(t,r){return executeQuery({selector:t,...r}).then(e=>Array.from(e))}function waitForElementParent(t,r,e){return executeQuery({selector:r,parent:t,...e})}function waitForElementId(t,r){return executeQuery({id:t,...r})}function waitForElementInf(t,r){return executeQuery({selector:t,timeout:1/0,...r})}exports.HTMLEntityMap=HTMLEntityMap,exports.JobErrorEvent=JobErrorEvent,exports.JobFinishedEvent=JobFinishedEvent,exports.JobNotFound=JobNotFound,exports.WorkerDeadState=WorkerDeadState,exports.WorkerJQ=WorkerJQ,exports.WorkerScriptError=WorkerScriptError,exports.WorkerUnreponsiveError=WorkerUnreponsiveError,exports.awaitDomContentLoaded=awaitDomContentLoaded,exports.escapeHTML=escapeHTML,exports.escapeRegExp=escapeRegExp,exports.executeQuery=executeQuery,exports.formatString=formatString,exports.fromHTML=fromHTML,exports.html=html,exports.makeMutationObserver=makeMutationObserver,exports.observeMutation=observeMutation,exports.observeMutationAsync=observeMutationAsync,exports.observeMutationOnce=observeMutationOnce,exports.waitForElement=waitForElement,exports.waitForElementAll=waitForElementAll,exports.waitForElementId=waitForElementId,exports.waitForElementInf=waitForElementInf,exports.waitForElementParent=waitForElementParent,Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=oxi.umd.js.map
