(()=>{"use strict";var e={332:(e,t,s)=>{const a=new(s(447).ZP)("data");a.version(1).stores({main:"name, fullname, version, target"}),self.onmessage=async e=>{const t=e.data;try{const e=await fetch(t.target);if(!e.ok)throw e.statusText;{const t=await e.json(),s=Object.keys(t),n=await a.main.bulkGet(Object.keys(t));for(let e=0;e<s.length;++e){const r=s[e],o=t[r];void 0===n[e]||n[e].version<o.version?fetch(o.target).then((e=>{if(e.ok)return e.json();throw e.statusText})).then((e=>{a.main.put({name:r,...o,content:e}).catch((e=>self.postMessage({status:!1,error:e.inner,fail_message:"Failed to save ".concat(o.fullname,".")}))),self.postMessage({status:!0,name:r,content:e,update:!0})})).catch((e=>self.postMessage({status:!1,error:e,fail_message:"Failed to fetch ".concat(o.fullname,". Some functionalities may stop working.")}))):self.postMessage({status:!0,name:r,content:n[e].content})}}}catch(s){self.postMessage({status:!1,error:s,fail_message:"Failed to connect to the data source. Offline data saved will be used."});try{a.main.each((e=>self.postMessage({status:!0,name:e.name,content:e.content})))}catch(s){self.postMessage({status:!1,error:s,fail_message:"Failed to fetch offline data."})}}}}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var r=t[a]={exports:{}};return e[a](r,r.exports,s),r.exports}s.m=e,s.x=()=>{var e=s.O(void 0,[674],(()=>s(332)));return e=s.O(e)},(()=>{var e=[];s.O=(t,a,n,r)=>{if(!a){var o=1/0;for(f=0;f<e.length;f++){a=e[f][0],n=e[f][1],r=e[f][2];for(var i=!0,c=0;c<a.length;c++)(!1&r||o>=r)&&Object.keys(s.O).every((e=>s.O[e](a[c])))?a.splice(c--,1):(i=!1,r<o&&(o=r));if(i){e.splice(f--,1);var l=n();void 0!==l&&(t=l)}}return t}r=r||0;for(var f=e.length;f>0&&e[f-1][2]>r;f--)e[f]=e[f-1];e[f]=[a,n,r]}})(),s.d=(e,t)=>{for(var a in t)s.o(t,a)&&!s.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},s.f={},s.e=e=>Promise.all(Object.keys(s.f).reduce(((t,a)=>(s.f[a](e,t),t)),[])),s.u=e=>"static/js/"+e+".66fe454d.chunk.js",s.miniCssF=e=>{},s.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),s.p="/credit-planner/",(()=>{var e={332:1};s.f.i=(t,a)=>{e[t]||importScripts(s.p+s.u(t))};var t=self.webpackChunkcredit_planner=self.webpackChunkcredit_planner||[],a=t.push.bind(t);t.push=t=>{var n=t[0],r=t[1],o=t[2];for(var i in r)s.o(r,i)&&(s.m[i]=r[i]);for(o&&o(s);n.length;)e[n.pop()]=1;a(t)}})(),(()=>{var e=s.x;s.x=()=>s.e(674).then(e)})();s.x()})();
//# sourceMappingURL=332.e2a8a89e.chunk.js.map