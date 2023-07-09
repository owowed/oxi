(function(n,o){typeof exports=="object"&&typeof module<"u"?o(exports):typeof define=="function"&&define.amd?define(["exports"],o):(n=typeof globalThis<"u"?globalThis:n||self,o(n.oxi={}))})(this,function(exports){var n,o,i,l;"use strict";var L=Object.defineProperty;var T=(n,o,i)=>o in n?L(n,o,{enumerable:!0,configurable:!0,writable:!0,value:i}):n[o]=i;var d=(n,o,i)=>(T(n,typeof o!="symbol"?o+"":o,i),i),M=(n,o,i)=>{if(!o.has(n))throw TypeError("Cannot "+i)};var u=(n,o,i)=>(M(n,o,"read from private field"),i?i.call(n):o.get(n)),x=(n,o,i)=>{if(o.has(n))throw TypeError("Cannot add the same private member more than once");o instanceof WeakSet?o.add(n):o.set(n,i)},p=(n,o,i,l)=>(M(n,o,"write to private field"),l?l.call(n,i):o.set(n,i),i);const HTMLEntityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};function escapeHTML(t){return t.replace(/[&<>"'`=\/]/g,r=>HTMLEntityMap[r])}function html(t,...r){const e=[];for(let s=0;s<t.length;s++)e.push(t[s]),r[s]&&e.push(escapeHTML(String(r[s])));return fromHTML(e.join(""))}function fromHTML(t){const r=document.createElement("div");return r.innerHTML=t,setTimeout(()=>r.remove()),r.children[0]}function escapeRegExp(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function formatString(t,r,{subst:e={format:"${{ | }}",var:"|"}}={}){const s=e.format.split(e.var).map(escapeRegExp).join(String.raw`([$\w\d-_.: ]+)`);return t.replace(new RegExp(s,"g"),(a,c)=>{var h;return(h=r[c])==null?void 0:h.toString()})}class WorkerUnreponsiveError extends Error{constructor(e){super("worker is unresponsive");d(this,"name",this.constructor.name);d(this,"worker");this.worker=e}}class WorkerScriptError extends Error{constructor(e,s){super(`script error caused by worker (${s.name})`);d(this,"name",this.constructor.name);d(this,"worker");this.worker=e,this.cause=s}}class WorkerDeadState extends Error{constructor(e,s){super(`worker is in dead state (${s})`);d(this,"name",this.constructor.name);d(this,"worker");this.worker=e}}class JobNotFound extends Error{constructor(e,s){super("job not found in worker");d(this,"name",this.constructor.name);d(this,"worker");d(this,"job");this.worker=e,this.job=s}}class JobDoneEvent extends Event{constructor({job:e,result:s},a){super("job-done",a);d(this,"job");d(this,"result");this.job=e,this.result=s}}function workerLoop(){let state="idling";function executeParentCode(data){state="working";const callback=eval(`(${data.functionCode})`),args=data.args;try{const t=callback(...args);self.postMessage({type:"execution_result",success:!0,returnValue:t})}catch(t){self.postMessage({type:"execution_result",success:!1,error:t})}state="idling"}async function executeParentCodeAsync(data){state="working";const callback=eval(`(${data.functionCode})`),args=data.args;callback(...args).then(t=>{self.postMessage({type:"execution_result",success:!0,returnValue:t}),state="idling"}).catch(t=>{self.postMessage({type:"execution_result",success:!1,error:t}),state="idling"})}self.addEventListener("message",t=>{const r=t.data;switch(r.type){case"status":self.postMessage({type:"status",status:state});break;case"resume":state="idling";break}if(state!="suspended")switch(r.type){case"execute":executeParentCode(r);break;case"execute_async":r.shouldAwait?executeParentCodeAsync(r):executeParentCode(r);break;case"suspend":state="suspended";break;case"shutdown":state="shutdown",self.postMessage({type:"status",status:"shutdown"}),self.close();break}})}const f=class extends EventTarget{constructor({url:e}={}){super();x(this,n,[]);x(this,o,null);x(this,i,void 0);x(this,l,"idling");p(this,i,new Worker(e??f.scriptUrl)),this.work()}static createJob(e,s){return{callback:e,args:s??[]}}get worker(){return u(this,i)}set worker(e){this.reinit(e)}get state(){return u(this,l)}work(){if(u(this,l)=="idling"&&u(this,n).length>0){p(this,l,"working");const e=p(this,o,u(this,n).pop());this.execute(e).then(s=>{p(this,l,"idling"),p(this,o,null);const a=new JobDoneEvent({job:e,result:s});this.dispatchEvent(a),this.work()})}}clearQueue(){u(this,n).length=0}reinit(e){e??(e=new Worker(f.scriptUrl)),this.terminate(),p(this,l,"idling"),p(this,i,e),this.work()}terminate(){u(this,i).terminate()}async restart(e){e??(e=new Worker(f.scriptUrl)),await this.shutdown(),p(this,l,"idling"),p(this,i,e),this.work()}async shutdown(){return u(this,i).postMessage({type:"shutdown"}),this.awaitMessage({type:"status",test:e=>e.status=="shutdown"}).then(e=>(p(this,l,"shutdown"),e))}async suspend(){u(this,i).postMessage({type:"suspend"}),p(this,l,"suspended")}async resume(){u(this,i).postMessage({type:"resume"}),p(this,l,"idling"),this.work()}async execute(e){const s={type:"execute",functionCode:e.callback.toString(),args:e.args};u(this,i).postMessage(s);const a=await this.awaitMessage({type:"execution_result"});if(a.success)return a.returnValue;throw new WorkerScriptError(this,a.error)}async run(e,s){const a=this.queue(e,s);return this.awaitJobDone(a)}queue(e,s){if(!(u(this,l)=="idling"||u(this,l)=="working"))throw new WorkerDeadState(this,u(this,l));let a;return typeof e=="function"?a=f.createJob(e,s):a=e,u(this,n).push(a),this.work(),a}remove(e){const s=u(this,n).indexOf(e);return s==-1?!1:(u(this,n).splice(s,1),!0)}awaitMessage({type:e,test:s,timeout:a=5e4}={}){return new Promise(c=>{let h;u(this,i).addEventListener("message",m=>{const w=m.data;e&&w.type!=e||s&&!s(w)||(h&&clearTimeout(h),c(w))}),typeof a=="number"&&(h=setTimeout(()=>{throw new WorkerUnreponsiveError(this)},a))})}awaitJobDone(e){if(!u(this,n).includes(e)&&u(this,o)!=e)throw new JobNotFound(this,e);return new Promise(s=>{this.addEventListener("job-done",a=>{const c=a;c.job==e&&s(c.result)})})}};let WorkerJQ=f;n=new WeakMap,o=new WeakMap,i=new WeakMap,l=new WeakMap,d(WorkerJQ,"scriptUrl",`data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`);function observeMutation({target:t,abortSignal:r,once:e,...s},a){const c=new MutationObserver(h=>{e&&c.disconnect(),a({records:h,observer:c})});return c.observe(t,s),r==null||r.addEventListener("abort",()=>{c.disconnect()}),c}function observeMutationOnce(t,r){return observeMutation({once:!0,...t},r)}function observeMutationAsync({target:t,abortSignal:r,...e},s){return new Promise(a=>{const c=new MutationObserver(h=>{c.disconnect(),a({records:h,observer:c})});c.observe(t,e),r==null||r.addEventListener("abort",()=>{c.disconnect()})})}const makeMutationObserver=observeMutation;class WaitForElementTimeoutError extends Error{constructor(e){super(`wait for element timeout for ${e}ms`);d(this,"name",this.constructor.name)}}class WaitForElementMaxTriesError extends Error{constructor(e){super(`wait for element out of tries (max tries: ${e})`);d(this,"name",this.constructor.name)}}class WaitForElementMissingOptionError extends Error{constructor(){super(...arguments);d(this,"name",this.constructor.name)}}async function awaitDomContentLoaded(){return new Promise(t=>{if(document.readyState!="loading")return t();document.addEventListener("DOMContentLoaded",()=>t())})}function isNotEmpty(t){return t instanceof NodeList?!0:t!=null}async function executeQuery(t){var k;let r;const e=t.parent??document.body,s=t.querySelector??((g,E)=>g.querySelector(E)),a=t.maxTries??1/0,c=t.timeout??1e4;if((t.ensureDomContentLoaded??!0)&&await awaitDomContentLoaded(),"id"in t)r=`#${t.id}`;else if("selector"in t)r=t.selector;else throw new WaitForElementMissingOptionError('missing options "id" or "selector"');let m=s(e,r);if(isNotEmpty(m))return m;let w=0;const y=new AbortController,v=y.signal;return(k=t.abortSignal)==null||k.addEventListener("abort",()=>y.abort()),new Promise((g,E)=>{const b=observeMutation({target:e,abortSignal:v,childList:!0,subtree:!0,...t.observerOptions},()=>{m=s(e,r),isNotEmpty(m)?(g(m),b.disconnect()):w>a&&(b.disconnect(),E(new WaitForElementMaxTriesError(a))),w++});c!=!1&&c!=1/0&&setTimeout(()=>{b.disconnect(),E(new WaitForElementTimeoutError(c))},c)})}function waitForElement(t,r,e){let s;return r instanceof Node&&"children"in r?s={selector:t,parent:r,...e}:s={selector:t,...r},executeQuery({selector:t,...s})}function waitForElementAll(t,r){return executeQuery({selector:t,...r}).then(e=>Array.from(e))}function waitForElementParent(t,r,e){return executeQuery({selector:r,parent:t,...e})}function waitForElementId(t,r){return executeQuery({id:t,...r})}function waitForElementInf(t,r){return executeQuery({selector:t,timeout:1/0,...r})}exports.HTMLEntityMap=HTMLEntityMap,exports.JobDoneEvent=JobDoneEvent,exports.JobNotFound=JobNotFound,exports.WorkerDeadState=WorkerDeadState,exports.WorkerJQ=WorkerJQ,exports.WorkerScriptError=WorkerScriptError,exports.WorkerUnreponsiveError=WorkerUnreponsiveError,exports.awaitDomContentLoaded=awaitDomContentLoaded,exports.escapeHTML=escapeHTML,exports.escapeRegExp=escapeRegExp,exports.executeQuery=executeQuery,exports.formatString=formatString,exports.fromHTML=fromHTML,exports.html=html,exports.makeMutationObserver=makeMutationObserver,exports.observeMutation=observeMutation,exports.observeMutationAsync=observeMutationAsync,exports.observeMutationOnce=observeMutationOnce,exports.waitForElement=waitForElement,exports.waitForElementAll=waitForElementAll,exports.waitForElementId=waitForElementId,exports.waitForElementInf=waitForElementInf,exports.waitForElementParent=waitForElementParent,Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=oxi.umd.js.map
