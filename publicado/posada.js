var x_=Object.defineProperty;var Vt=(i,e,t)=>()=>{if(t)throw t[0];try{return i&&(e=i(i=0)),e}catch(n){throw t=[n],n}};var Tu=(i,e)=>{for(var t in e)x_(i,t,{get:e[t],enumerable:!0})};function v_(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function y_(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function ca(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function h0(){let i=ca("canvas");return i.style.display="block",i}function _o(...i){let e="THREE."+i.shift();ha?ha("log",e,...i):console.log(e,...i)}function u0(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Xe(...i){i=u0(i);let e="THREE."+i.shift();if(ha)ha("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Qe(...i){i=u0(i);let e="THREE."+i.shift();if(ha)ha("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function hr(...i){let e=i.join(" ");e in Hp||(Hp[e]=!0,Xe(...i))}function d0(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function li(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Tn[i&255]+Tn[i>>8&255]+Tn[i>>16&255]+Tn[i>>24&255]+"-"+Tn[e&255]+Tn[e>>8&255]+"-"+Tn[e>>16&15|64]+Tn[e>>24&255]+"-"+Tn[t&63|128]+Tn[t>>8&255]+"-"+Tn[t>>16&255]+Tn[t>>24&255]+Tn[n&255]+Tn[n>>8&255]+Tn[n>>16&255]+Tn[n>>24&255]).toLowerCase()}function ct(i,e,t){return Math.max(e,Math.min(t,i))}function Pd(i,e){return(i%e+e)%e}function M_(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function S_(i,e,t){return i!==e?(t-i)/(e-i):0}function fo(i,e,t){return(1-t)*i+t*e}function E_(i,e,t,n){return fo(i,e,1-Math.exp(-t*n))}function w_(i,e=1){return e-Math.abs(Pd(i,e*2)-e)}function T_(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function A_(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function R_(i,e){return i+Math.floor(Math.random()*(e-i+1))}function C_(i,e){return i+Math.random()*(e-i)}function P_(i){return i*(.5-Math.random())}function I_(i){i!==void 0&&(zp=i);let e=zp+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function D_(i){return i*uo}function L_(i){return i*fr}function N_(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function F_(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function U_(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function k_(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),f=r((n-e)/2),p=a((n-e)/2);switch(s){case"XYX":i.set(o*h,l*u,l*d,o*c);break;case"YZY":i.set(l*d,o*h,l*u,o*c);break;case"ZXZ":i.set(l*u,l*d,o*h,o*c);break;case"XZX":i.set(o*h,l*p,l*f,o*c);break;case"YXY":i.set(l*f,o*h,l*p,o*c);break;case"ZYZ":i.set(l*p,l*f,o*h,o*c);break;default:Xe("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function vi(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Dt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function O_(){let i={enabled:!0,workingColorSpace:kn,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===wt&&(s.r=us(s.r),s.g=us(s.g),s.b=us(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===wt&&(s.r=ra(s.r),s.g=ra(s.g),s.b=ra(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===si?bo:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return hr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return hr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[kn]:{primaries:e,whitePoint:n,transfer:bo,toXYZ:Vp,fromXYZ:Wp,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Tt},outputColorSpaceConfig:{drawingBufferColorSpace:Tt}},[Tt]:{primaries:e,whitePoint:n,transfer:wt,toXYZ:Vp,fromXYZ:Wp,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Tt}}}),i}function us(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ra(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}function Cu(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?xc.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Xe("Texture: Unable to serialize Texture."),{})}function Du(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}function Hu(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){rr.fromArray(i,r);let o=s.x*Math.abs(rr.x)+s.y*Math.abs(rr.y)+s.z*Math.abs(rr.z),l=e.dot(rr),c=t.dot(rr),h=n.dot(rr);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}function Gl(i,e,t,n,s,r){ea.subVectors(i,t).addScalar(.5).multiply(n),s!==void 0?(so.x=r*ea.x-s*ea.y,so.y=s*ea.x+r*ea.y):so.copy(ea),i.copy(e),i.x+=so.x,i.y+=so.y,i.applyMatrix4(m0)}function ex(i,e,t,n,s,r,a,o){let l;if(e.side===On?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Xi,o),l===null)return null;Jl.copy(o),Jl.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Jl);return c<t.near||c>t.far?null:{distance:c,point:Jl.clone(),object:i}}function Zl(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,Xl),i.getVertexPosition(l,jl),i.getVertexPosition(c,Kl);let h=ex(i,e,t,n,Xl,jl,Kl,im);if(h){let u=new w;hs.getBarycoord(im,Xl,jl,Kl,u),s&&(h.uv=hs.getInterpolatedAttribute(s,o,l,c,u,new $)),r&&(h.uv1=hs.getInterpolatedAttribute(r,o,l,c,u,new $)),a&&(h.normal=hs.getInterpolatedAttribute(a,o,l,c,u,new w),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new w,materialIndex:0};hs.getNormal(Xl,jl,Kl,d.normal),h.face=d,h.barycoord=u}return h}function nc(i,e,t,n,s,r,a){let o=i.geometry.attributes.position;if(Mc.fromBufferAttribute(o,s),Sc.fromBufferAttribute(o,r),t.distanceSqToSegment(Mc,Sc,Yu,dm)>n)return;Yu.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Yu);if(!(c<e.near||c>e.far))return{distance:c,point:dm.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}function gm(i,e,t,n,s,r,a){let o=id.distanceSqToPoint(i);if(o<t){let l=new w;id.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}function Id(){let i=0,e=0,t=0,n=0;function s(r,a,o,l){i=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,f*=h,s(a,o,d,f)},calc:function(r){let a=r*r,o=a*r;return i+e*r+t*a+n*o}}}function xm(i,e,t,n,s){let r=(n-e)*.5,a=(s-t)*.5,o=i*i,l=i*o;return(2*t-2*n+r+a)*l+(-3*t+3*n-2*r-a)*o+r*i+t}function rx(i,e){let t=1-i;return t*t*e}function ax(i,e){return 2*(1-i)*i*e}function ox(i,e){return i*i*e}function po(i,e,t,n){return rx(i,e)+ax(i,t)+ox(i,n)}function lx(i,e){let t=1-i;return t*t*t*e}function cx(i,e){let t=1-i;return 3*t*t*i*e}function hx(i,e){return 3*(1-i)*i*i*e}function ux(i,e){return i*i*i*e}function mo(i,e,t,n,s){return lx(i,e)+cx(i,t)+hx(i,n)+ux(i,s)}function dx(i,e,t=2){let n=e&&e.length,s=n?e[0]*t:i.length,r=g0(i,0,s,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(n&&(r=bx(i,e,r,t)),i.length>80*t){o=i[0],l=i[1];let h=o,u=l;for(let d=t;d<s;d+=t){let f=i[d],p=i[d+1];f<o&&(o=f),p<l&&(l=p),f>h&&(h=f),p>u&&(u=p)}c=Math.max(h-o,u-l),c=c!==0?32767/c:0}return Io(r,a,t,o,l,c,0),a}function g0(i,e,t,n,s){let r;if(s===Rx(i,e,t,n)>0)for(let a=e;a<t;a+=n)r=vm(a/n|0,i[a],i[a+1],r);else for(let a=t-n;a>=e;a-=n)r=vm(a/n|0,i[a],i[a+1],r);return r&&ba(r,r.next)&&(Lo(r),r=r.next),r}function xr(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(ba(t,t.next)||Jt(t.prev,t,t.next)===0)){if(Lo(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function Io(i,e,t,n,s,r,a){if(!i)return;!a&&r&&Mx(i,n,s,r);let o=i;for(;i.prev!==i.next;){let l=i.prev,c=i.next;if(r?px(i,n,s,r):fx(i)){e.push(l.i,i.i,c.i),Lo(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=mx(xr(i),e),Io(i,e,t,n,s,r,2)):a===2&&gx(i,e,t,n,s,r):Io(xr(i),e,t,n,s,r,1);break}}}function fx(i){let e=i.prev,t=i,n=i.next;if(Jt(e,t,n)>=0)return!1;let s=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=Math.min(s,r,a),u=Math.min(o,l,c),d=Math.max(s,r,a),f=Math.max(o,l,c),p=n.next;for(;p!==e;){if(p.x>=h&&p.x<=d&&p.y>=u&&p.y<=f&&ho(s,o,r,l,a,c,p.x,p.y)&&Jt(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function px(i,e,t,n){let s=i.prev,r=i,a=i.next;if(Jt(s,r,a)>=0)return!1;let o=s.x,l=r.x,c=a.x,h=s.y,u=r.y,d=a.y,f=Math.min(o,l,c),p=Math.min(h,u,d),_=Math.max(o,l,c),g=Math.max(h,u,d),m=sd(f,p,e,t,n),x=sd(_,g,e,t,n),M=i.prevZ,b=i.nextZ;for(;M&&M.z>=m&&b&&b.z<=x;){if(M.x>=f&&M.x<=_&&M.y>=p&&M.y<=g&&M!==s&&M!==a&&ho(o,h,l,u,c,d,M.x,M.y)&&Jt(M.prev,M,M.next)>=0||(M=M.prevZ,b.x>=f&&b.x<=_&&b.y>=p&&b.y<=g&&b!==s&&b!==a&&ho(o,h,l,u,c,d,b.x,b.y)&&Jt(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;M&&M.z>=m;){if(M.x>=f&&M.x<=_&&M.y>=p&&M.y<=g&&M!==s&&M!==a&&ho(o,h,l,u,c,d,M.x,M.y)&&Jt(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;b&&b.z<=x;){if(b.x>=f&&b.x<=_&&b.y>=p&&b.y<=g&&b!==s&&b!==a&&ho(o,h,l,u,c,d,b.x,b.y)&&Jt(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function mx(i,e){let t=i;do{let n=t.prev,s=t.next.next;!ba(n,s)&&_0(n,t,t.next,s)&&Do(n,s)&&Do(s,n)&&(e.push(n.i,t.i,s.i),Lo(t),Lo(t.next),t=i=s),t=t.next}while(t!==i);return xr(t)}function gx(i,e,t,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&wx(a,o)){let l=x0(a,o);a=xr(a,a.next),l=xr(l,l.next),Io(a,e,t,n,s,r,0),Io(l,e,t,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function bx(i,e,t,n){let s=[];for(let r=0,a=e.length;r<a;r++){let o=e[r]*n,l=r<a-1?e[r+1]*n:i.length,c=g0(i,o,l,n,!1);c===c.next&&(c.steiner=!0),s.push(Ex(c))}s.sort(_x);for(let r=0;r<s.length;r++)t=xx(s[r],t);return t}function _x(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){let n=(i.next.y-i.y)/(i.next.x-i.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=n-s}return t}function xx(i,e){let t=vx(i,e);if(!t)return e;let n=x0(t,i);return xr(n,n.next),xr(t,t.next)}function vx(i,e){let t=e,n=i.x,s=i.y,r=-1/0,a;if(ba(i,t))return t;do{if(ba(i,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let u=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=n&&u>r&&(r=u,a=t.x<t.next.x?t:t.next,u===n))return a}t=t.next}while(t!==e);if(!a)return null;let o=a,l=a.x,c=a.y,h=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&b0(s<c?n:r,s,l,c,s<c?r:n,s,t.x,t.y)){let u=Math.abs(s-t.y)/(n-t.x);Do(t,i)&&(u<h||u===h&&(t.x>a.x||t.x===a.x&&yx(a,t)))&&(a=t,h=u)}t=t.next}while(t!==o);return a}function yx(i,e){return Jt(i.prev,i,e.prev)<0&&Jt(e.next,i,i.next)<0}function Mx(i,e,t,n){let s=i;do s.z===0&&(s.z=sd(s.x,s.y,e,t,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Sx(s)}function Sx(i){let e,t=1;do{let n=i,s;i=null;let r=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(s=n,n=n.nextZ,o--):(s=a,a=a.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=a}r.nextZ=null,t*=2}while(e>1);return i}function sd(i,e,t,n,s){return i=(i-t)*s|0,e=(e-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function Ex(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function b0(i,e,t,n,s,r,a,o){return(s-a)*(e-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(s-a)*(n-o)}function ho(i,e,t,n,s,r,a,o){return!(i===a&&e===o)&&b0(i,e,t,n,s,r,a,o)}function wx(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!Tx(i,e)&&(Do(i,e)&&Do(e,i)&&Ax(i,e)&&(Jt(i.prev,i,e.prev)||Jt(i,e.prev,e))||ba(i,e)&&Jt(i.prev,i,i.next)>0&&Jt(e.prev,e,e.next)>0)}function Jt(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function ba(i,e){return i.x===e.x&&i.y===e.y}function _0(i,e,t,n){let s=ac(Jt(i,e,t)),r=ac(Jt(i,e,n)),a=ac(Jt(t,n,i)),o=ac(Jt(t,n,e));return!!(s!==r&&a!==o||s===0&&rc(i,t,e)||r===0&&rc(i,n,e)||a===0&&rc(t,i,n)||o===0&&rc(t,e,n))}function rc(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function ac(i){return i>0?1:i<0?-1:0}function Tx(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&_0(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function Do(i,e){return Jt(i.prev,i,i.next)<0?Jt(i,e,i.next)>=0&&Jt(i,i.prev,e)>=0:Jt(i,e,i.prev)<0||Jt(i,i.next,e)<0}function Ax(i,e){let t=i,n=!1,s=(i.x+e.x)/2,r=(i.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function x0(i,e){let t=rd(i.i,i.x,i.y),n=rd(e.i,e.x,e.y),s=i.next,r=e.prev;return i.next=e,e.prev=i,t.next=s,s.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function vm(i,e,t,n){let s=rd(i,e,t);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Lo(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function rd(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Rx(i,e,t,n){let s=0;for(let r=e,a=t-n;r<t;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}function ym(i){let e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function Mm(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}function Px(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){let r=i[n];t.shapes.push(r.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}function Ix(i,e){if(e.shapes=[],Array.isArray(i))for(let t=0,n=i.length;t<n;t++){let s=i[t];e.shapes.push(s.uuid)}else e.shapes.push(i.uuid);return e}function Ar(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(Sm(s))s.isRenderTargetTexture?(Xe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(Sm(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Dn(i){let e={};for(let t=0;t<i.length;t++){let n=Ar(i[t]);for(let s in n)e[s]=n[s]}return e}function Sm(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Dx(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Dd(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ht.workingColorSpace}function Fs(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function uc(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}function Fx(i){function e(s,r){return i[s]-i[r]}let t=i.length,n=new Array(t);for(let s=0;s!==t;++s)n[s]=s;return n.sort(e),n}function Em(i,e,t){let n=i.length,s=new i.constructor(n);for(let r=0,a=0;a!==n;++r){let o=t[r]*e;for(let l=0;l!==e;++l)s[a++]=i[o+l]}return s}function Ux(i,e,t,n){let s=1,r=i[0];for(;r!==void 0&&r[n]===void 0;)r=i[s++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(e.push(r.time),t.push(...a)),r=i[s++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(e.push(r.time),a.toArray(t,t.length)),r=i[s++];while(r!==void 0);else do a=r[n],a!==void 0&&(e.push(r.time),t.push(a)),r=i[s++];while(r!==void 0)}function v0(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function kx(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function Ox(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=v0(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=kx(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}function wm(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}function Bx(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return _s;case"vector":case"vector2":case"vector3":case"vector4":return ui;case"color":return ko;case"quaternion":return ni;case"bool":case"boolean":return bs;case"string":return xs}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function Hx(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=Bx(i.type);if(i.times===void 0){let n=[],s=[];Ux(i.keys,n,s,"value"),i.times=n,i.values=s}let t;return e.parse!==void 0?t=e.parse(i):t=new e(i.name,i.times,i.values,i.interpolation),uc(i.settings)&&(t.settings={inTangents:Fs(i.settings.inTangents,Float32Array),outTangents:Fs(i.settings.outTangents,Float32Array)}),t}function Tm(i){try{let e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}function zx(){this._document.hidden===!1&&this.reset()}function Dm(i,e){return i.distance-e.distance}function dd(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)dd(r[a],e,t,!0)}}function Fd(i,e,t,n){let s=Zx(n);switch(t){case wd:return i*e;case Yc:return i*e/s.components*s.byteLength;case Jc:return i*e/s.components*s.byteLength;case js:return i*e*2/s.components*s.byteLength;case Zc:return i*e*2/s.components*s.byteLength;case Td:return i*e*3/s.components*s.byteLength;case Hn:return i*e*4/s.components*s.byteLength;case $c:return i*e*4/s.components*s.byteLength;case $o:case Qo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case el:case tl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case eh:case nh:return Math.max(i,16)*Math.max(e,8)/4;case Qc:case th:return Math.max(i,8)*Math.max(e,8)/2;case ih:case sh:case ah:case oh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case rh:case nl:case lh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ch:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case hh:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case uh:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case dh:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case fh:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case ph:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case mh:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case gh:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case bh:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case _h:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case xh:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case vh:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case yh:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Mh:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Sh:case Eh:case wh:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Th:case Ah:return Math.ceil(i/4)*Math.ceil(e/4)*8;case il:case Rh:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Zx(i){switch(i){case In:case yd:return{byteLength:1,components:1};case Aa:case Md:case Qt:return{byteLength:2,components:1};case jc:case Kc:return{byteLength:2,components:4};case Ti:case Xc:case ii:return{byteLength:4,components:1};case Sd:case Ed:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}var di,Ws,Lm,pd,Nm,Sr,Fm,Ea,Xi,On,Pn,nn,wa,Bn,md,gd,Gc,fi,Um,km,Om,Bm,Er,Hm,zm,Gm,bd,_d,Vo,Vm,Wo,Wm,qm,Xm,jm,Km,Ym,dc,fc,pc,aa,mc,gc,bc,_c,xd,Jm,Zm,Ei,qo,Xo,jo,ji,Ko,Yo,Jo,td,$m,vd,qs,wr,Vc,Wc,Zo,xn,oi,oa,jt,qc,Tr,tn,Ta,wi,In,yd,Md,Aa,Xc,Ti,ii,Qt,jc,Kc,Xs,Sd,Ed,wd,Td,Hn,Ui,Ki,Yc,Jc,js,Zc,$c,$o,Qo,el,tl,Qc,eh,th,nh,ih,sh,rh,ah,oh,nl,lh,ch,hh,uh,dh,fh,ph,mh,gh,bh,_h,xh,vh,yh,Mh,Sh,Eh,wh,Th,Ah,il,Rh,Ch,Ph,Qm,ur,dr,cc,nd,lr,cr,go,Ih,e0,Ad,sl,Ra,t0,rl,n0,si,Tt,kn,bo,wt,hc,i0,s0,r0,a0,Dh,o0,l0,Lh,c0,Rd,Cd,yi,la,Hp,ha,f0,ci,Tn,zp,uo,fr,Pt,$,Ke,w,Au,Gp,it,Ru,Vp,Wp,ht,zr,xc,B_,ua,H_,Pu,hn,Lt,vc,qt,xo,yc,De,Gr,bi,z_,G_,Ps,Ll,Qn,qp,Xp,Mi,da,V_,jp,Vr,ss,Nl,Qa,W_,q_,Kp,Yp,Jp,Zp,X_,Wr,Iu,Xt,mt,j_,fa,p0,Is,Fl,ye,An,Us,_i,rs,Lu,as,qr,Xr,$p,Nu,Fu,Uu,ku,Ou,Bu,hs,yn,os,xi,Ul,jr,Kr,Yr,Ds,Ls,sr,eo,kl,Ol,rr,ln,Bl,K_,$e,vo,yo,Ye,Y_,to,zu,Rn,J_,ai,Gu,Jr,ei,no,_n,ot,pr,Fn,ks,Vu,Z_,$_,Un,Q_,Cn,mr,Zr,io,$r,Qr,ea,so,m0,Hl,ro,zl,Qp,Wu,em,pa,ls,qu,Vl,Wl,ki,$t,tm,ar,ql,nm,Xl,jl,Kl,Xu,Yl,im,Jl,at,ao,sm,rm,tx,am,$l,ju,om,Ku,ds,Os,Oi,lm,nx,fs,ps,ta,cm,Ql,hm,ix,oo,lo,Mo,or,sx,ec,ma,Bs,Mc,Sc,um,co,tc,Yu,dm,gr,fm,pm,br,So,ms,mm,id,ic,sc,Hs,_r,Bi,Hi,Ec,Eo,At,hi,Mt,Nt,wc,ti,ga,Tc,bm,_m,Ju,Zu,$u,zi,wo,Ac,To,Rc,Ao,Ro,Co,Cc,Pc,Po,Wn,ad,Ni,Si,Cx,zs,gs,Mn,No,bt,_t,_a,zn,Lx,Nx,Bt,xa,Ht,qn,Fo,Ic,Dc,Gi,Lc,Uo,Nc,Fc,Xn,bs,ko,_s,Uc,ni,xs,ui,jn,Fi,va,y0,Vi,cs,od,ya,na,kc,Wi,Gs,vs,Qu,Am,Rm,Ma,oc,lc,Li,Oo,Ns,Cm,Pm,Yt,ld,vr,cd,yr,qi,hd,vn,Bo,ys,ed,Ho,ia,sa,Oc,Bc,Mr,Hc,Ld,Gx,Nd,Vx,Wx,qx,Xx,jx,Kx,Yx,ud,kt,zc,Jx,Vs,Im,zo,Sa,fd,Go,Ud=Vt(()=>{di={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ws={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Lm=0,pd=1,Nm=2,Sr=1,Fm=2,Ea=3,Xi=0,On=1,Pn=2,nn=0,wa=1,Bn=2,md=3,gd=4,Gc=5,fi=100,Um=101,km=102,Om=103,Bm=104,Er=200,Hm=201,zm=202,Gm=203,bd=204,_d=205,Vo=206,Vm=207,Wo=208,Wm=209,qm=210,Xm=211,jm=212,Km=213,Ym=214,dc=0,fc=1,pc=2,aa=3,mc=4,gc=5,bc=6,_c=7,xd=0,Jm=1,Zm=2,Ei=0,qo=1,Xo=2,jo=3,ji=4,Ko=5,Yo=6,Jo=7,td="attached",$m="detached",vd=300,qs=301,wr=302,Vc=303,Wc=304,Zo=306,xn=1e3,oi=1001,oa=1002,jt=1003,qc=1004,Tr=1005,tn=1006,Ta=1007,wi=1008,In=1009,yd=1010,Md=1011,Aa=1012,Xc=1013,Ti=1014,ii=1015,Qt=1016,jc=1017,Kc=1018,Xs=1020,Sd=35902,Ed=35899,wd=1021,Td=1022,Hn=1023,Ui=1026,Ki=1027,Yc=1028,Jc=1029,js=1030,Zc=1031,$c=1033,$o=33776,Qo=33777,el=33778,tl=33779,Qc=35840,eh=35841,th=35842,nh=35843,ih=36196,sh=37492,rh=37496,ah=37488,oh=37489,nl=37490,lh=37491,ch=37808,hh=37809,uh=37810,dh=37811,fh=37812,ph=37813,mh=37814,gh=37815,bh=37816,_h=37817,xh=37818,vh=37819,yh=37820,Mh=37821,Sh=36492,Eh=36494,wh=36495,Th=36283,Ah=36284,il=36285,Rh=36286,Ch=2200,Ph=2201,Qm=2202,ur=2300,dr=2301,cc=2302,nd=2303,lr=2400,cr=2401,go=2402,Ih=2500,e0=2501,Ad=0,sl=1,Ra=2,t0=3200,rl=0,n0=1,si="",Tt="srgb",kn="srgb-linear",bo="linear",wt="srgb",hc=7680,i0=519,s0=512,r0=513,a0=514,Dh=515,o0=516,l0=517,Lh=518,c0=519,Rd=35044,Cd="300 es",yi=2e3,la=2001;Hp={},ha=null;f0={[dc]:fc,[pc]:bc,[mc]:_c,[aa]:gc,[fc]:dc,[bc]:pc,[_c]:mc,[gc]:aa},ci=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},Tn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],zp=1234567,uo=Math.PI/180,fr=180/Math.PI;Pt={DEG2RAD:uo,RAD2DEG:fr,generateUUID:li,clamp:ct,euclideanModulo:Pd,mapLinear:M_,inverseLerp:S_,lerp:fo,damp:E_,pingpong:w_,smoothstep:T_,smootherstep:A_,randInt:R_,randFloat:C_,randFloatSpread:P_,seededRandom:I_,degToRad:D_,radToDeg:L_,isPowerOfTwo:N_,ceilPowerOfTwo:F_,floorPowerOfTwo:U_,setQuaternionFromProperEuler:k_,normalize:Dt,denormalize:vi},$=class i{static{i.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ct(this.x,e.x,t.x),this.y=ct(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ct(this.x,e,t),this.y=ct(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ct(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ct(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ke=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],d=r[a+0],f=r[a+1],p=r[a+2],_=r[a+3];if(u!==_||l!==d||c!==f||h!==p){let g=l*d+c*f+h*p+u*_;g<0&&(d=-d,f=-f,p=-p,_=-_,g=-g);let m=1-o;if(g<.9995){let x=Math.acos(g),M=Math.sin(x);m=Math.sin(m*x)/M,o=Math.sin(o*x)/M,l=l*m+d*o,c=c*m+f*o,h=h*m+p*o,u=u*m+_*o}else{l=l*m+d*o,c=c*m+f*o,h=h*m+p*o,u=u*m+_*o;let x=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=x,c*=x,h*=x,u*=x}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[a],d=r[a+1],f=r[a+2],p=r[a+3];return e[t]=o*p+h*u+l*f-c*d,e[t+1]=l*p+h*d+c*u-o*f,e[t+2]=c*p+h*f+o*d-l*u,e[t+3]=h*p-o*u-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(r/2),d=l(n/2),f=l(s/2),p=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"YZX":this._x=d*h*u+c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u-d*f*p;break;case"XZY":this._x=d*h*u-c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u+d*f*p;break;default:Xe("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>u){let f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>u){let f=2*Math.sqrt(1+o-n-u);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ct(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},w=class i{static{i.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Gp.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Gp.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ct(this.x,e.x,t.x),this.y=ct(this.y,e.y,t.y),this.z=ct(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ct(this.x,e,t),this.y=ct(this.y,e,t),this.z=ct(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ct(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Au.copy(this).projectOnVector(e),this.sub(Au)}reflect(e){return this.sub(Au.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ct(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Au=new w,Gp=new Ke,it=class i{static{i.prototype.isMatrix3=!0}constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],p=n[8],_=s[0],g=s[3],m=s[6],x=s[1],M=s[4],b=s[7],v=s[2],S=s[5],R=s[8];return r[0]=a*_+o*x+l*v,r[3]=a*g+o*M+l*S,r[6]=a*m+o*b+l*R,r[1]=c*_+h*x+u*v,r[4]=c*g+h*M+u*S,r[7]=c*m+h*b+u*R,r[2]=d*_+f*x+p*v,r[5]=d*g+f*M+p*S,r[8]=d*m+f*b+p*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,f=c*r-a*l,p=t*u+n*d+s*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/p;return e[0]=u*_,e[1]=(s*c-h*n)*_,e[2]=(o*n-s*a)*_,e[3]=d*_,e[4]=(h*t-s*l)*_,e[5]=(s*r-o*t)*_,e[6]=f*_,e[7]=(n*l-c*t)*_,e[8]=(a*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return hr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ru.makeScale(e,t)),this}rotate(e){return hr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ru.makeRotation(-e)),this}translate(e,t){return hr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ru.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ru=new it,Vp=new it().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Wp=new it().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ht=O_();xc=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{zr===void 0&&(zr=ca("canvas")),zr.width=e.width,zr.height=e.height;let s=zr.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=zr}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ca("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=us(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(us(t[n]/255)*255):t[n]=us(t[n]);return{data:t,width:e.width,height:e.height}}else return Xe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},B_=0,ua=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:B_++}),this.uuid=li(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Cu(s[a].image)):r.push(Cu(s[a]))}else r=Cu(s);n.url=r}return t||(e.images[this.uuid]=n),n}};H_=0,Pu=new w,hn=class i extends ci{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=oi,s=oi,r=tn,a=wi,o=Hn,l=In,c=i.DEFAULT_ANISOTROPY,h=si){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:H_++}),this.uuid=li(),this.name="",this.source=new ua(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new $(0,0),this.repeat=new $(1,1),this.center=new $(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new it,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Pu).x}get height(){return this.source.getSize(Pu).y}get depth(){return this.source.getSize(Pu).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Xe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Xe(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==vd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case xn:e.x=e.x-Math.floor(e.x);break;case oi:e.x=e.x<0?0:1;break;case oa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case xn:e.y=e.y-Math.floor(e.y);break;case oi:e.y=e.y<0?0:1;break;case oa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};hn.DEFAULT_IMAGE=null;hn.DEFAULT_MAPPING=vd;hn.DEFAULT_ANISOTROPY=1;Lt=class i{static{i.prototype.isVector4=!0}constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],p=l[9],_=l[2],g=l[6],m=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(p+g)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let M=(c+1)/2,b=(f+1)/2,v=(m+1)/2,S=(h+d)/4,R=(u+_)/4,y=(p+g)/4;return M>b&&M>v?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=S/n,r=R/n):b>v?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=S/s,r=y/s):v<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(v),n=R/r,s=y/r),this.set(n,s,r,t),this}let x=Math.sqrt((g-p)*(g-p)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(x)<.001&&(x=1),this.x=(g-p)/x,this.y=(u-_)/x,this.z=(d-h)/x,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ct(this.x,e.x,t.x),this.y=ct(this.y,e.y,t.y),this.z=ct(this.z,e.z,t.z),this.w=ct(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ct(this.x,e,t),this.y=ct(this.y,e,t),this.z=ct(this.z,e,t),this.w=ct(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ct(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},vc=class extends ci{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:tn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Lt(0,0,e,t),this.scissorTest=!1,this.viewport=new Lt(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:n.depth},r=new hn(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:tn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new ua(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},qt=class extends vc{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},xo=class extends hn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=jt,this.minFilter=jt,this.wrapR=oi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},yc=class extends hn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=jt,this.minFilter=jt,this.wrapR=oi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},De=class i{static{i.prototype.isMatrix4=!0}constructor(e,t,n,s,r,a,o,l,c,h,u,d,f,p,_,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,u,d,f,p,_,g)}set(e,t,n,s,r,a,o,l,c,h,u,d,f,p,_,g){let m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=p,m[11]=_,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/Gr.setFromMatrixColumn(e,0).length(),r=1/Gr.setFromMatrixColumn(e,1).length(),a=1/Gr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,f=a*u,p=o*h,_=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+p*c,t[5]=d-_*c,t[9]=-o*l,t[2]=_-d*c,t[6]=p+f*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,f=l*u,p=c*h,_=c*u;t[0]=d+_*o,t[4]=p*o-f,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=f*o-p,t[6]=_+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,f=l*u,p=c*h,_=c*u;t[0]=d-_*o,t[4]=-a*u,t[8]=p+f*o,t[1]=f+p*o,t[5]=a*h,t[9]=_-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,f=a*u,p=o*h,_=o*u;t[0]=l*h,t[4]=p*c-f,t[8]=d*c+_,t[1]=l*u,t[5]=_*c+d,t[9]=f*c-p,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,f=a*c,p=o*l,_=o*c;t[0]=l*h,t[4]=_-d*u,t[8]=p*u+f,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=f*u+p,t[10]=d-_*u}else if(e.order==="XZY"){let d=a*l,f=a*c,p=o*l,_=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+_,t[5]=a*h,t[9]=f*u-p,t[2]=p*u-f,t[6]=o*h,t[10]=_*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(z_,e,G_)}lookAt(e,t,n){let s=this.elements;return Qn.subVectors(e,t),Qn.lengthSq()===0&&(Qn.z=1),Qn.normalize(),Ps.crossVectors(n,Qn),Ps.lengthSq()===0&&(Math.abs(n.z)===1?Qn.x+=1e-4:Qn.z+=1e-4,Qn.normalize(),Ps.crossVectors(n,Qn)),Ps.normalize(),Ll.crossVectors(Qn,Ps),s[0]=Ps.x,s[4]=Ll.x,s[8]=Qn.x,s[1]=Ps.y,s[5]=Ll.y,s[9]=Qn.y,s[2]=Ps.z,s[6]=Ll.z,s[10]=Qn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],p=n[2],_=n[6],g=n[10],m=n[14],x=n[3],M=n[7],b=n[11],v=n[15],S=s[0],R=s[4],y=s[8],A=s[12],C=s[1],D=s[5],F=s[9],O=s[13],L=s[2],k=s[6],G=s[10],V=s[14],te=s[3],N=s[7],Z=s[11],ie=s[15];return r[0]=a*S+o*C+l*L+c*te,r[4]=a*R+o*D+l*k+c*N,r[8]=a*y+o*F+l*G+c*Z,r[12]=a*A+o*O+l*V+c*ie,r[1]=h*S+u*C+d*L+f*te,r[5]=h*R+u*D+d*k+f*N,r[9]=h*y+u*F+d*G+f*Z,r[13]=h*A+u*O+d*V+f*ie,r[2]=p*S+_*C+g*L+m*te,r[6]=p*R+_*D+g*k+m*N,r[10]=p*y+_*F+g*G+m*Z,r[14]=p*A+_*O+g*V+m*ie,r[3]=x*S+M*C+b*L+v*te,r[7]=x*R+M*D+b*k+v*N,r[11]=x*y+M*F+b*G+v*Z,r[15]=x*A+M*O+b*V+v*ie,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],f=e[14],p=e[3],_=e[7],g=e[11],m=e[15],x=l*f-c*d,M=o*f-c*u,b=o*d-l*u,v=a*f-c*h,S=a*d-l*h,R=a*u-o*h;return t*(_*x-g*M+m*b)-n*(p*x-g*v+m*S)+s*(p*M-_*v+m*R)-r*(p*b-_*S+g*R)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],f=e[11],p=e[12],_=e[13],g=e[14],m=e[15],x=t*o-n*a,M=t*l-s*a,b=t*c-r*a,v=n*l-s*o,S=n*c-r*o,R=s*c-r*l,y=h*_-u*p,A=h*g-d*p,C=h*m-f*p,D=u*g-d*_,F=u*m-f*_,O=d*m-f*g,L=x*O-M*F+b*D+v*C-S*A+R*y;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let k=1/L;return e[0]=(o*O-l*F+c*D)*k,e[1]=(s*F-n*O-r*D)*k,e[2]=(_*R-g*S+m*v)*k,e[3]=(d*S-u*R-f*v)*k,e[4]=(l*C-a*O-c*A)*k,e[5]=(t*O-s*C+r*A)*k,e[6]=(g*b-p*R-m*M)*k,e[7]=(h*R-d*b+f*M)*k,e[8]=(a*F-o*C+c*y)*k,e[9]=(n*C-t*F-r*y)*k,e[10]=(p*S-_*b+m*x)*k,e[11]=(u*b-h*S-f*x)*k,e[12]=(o*A-a*D-l*y)*k,e[13]=(t*D-n*A+s*y)*k,e[14]=(_*M-p*v-g*x)*k,e[15]=(h*v-u*M+d*x)*k,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,f=r*h,p=r*u,_=a*h,g=a*u,m=o*u,x=l*c,M=l*h,b=l*u,v=n.x,S=n.y,R=n.z;return s[0]=(1-(_+m))*v,s[1]=(f+b)*v,s[2]=(p-M)*v,s[3]=0,s[4]=(f-b)*S,s[5]=(1-(d+m))*S,s[6]=(g+x)*S,s[7]=0,s[8]=(p+M)*R,s[9]=(g-x)*R,s[10]=(1-(d+_))*R,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Gr.set(s[0],s[1],s[2]).length(),o=Gr.set(s[4],s[5],s[6]).length(),l=Gr.set(s[8],s[9],s[10]).length();r<0&&(a=-a),bi.copy(this);let c=1/a,h=1/o,u=1/l;return bi.elements[0]*=c,bi.elements[1]*=c,bi.elements[2]*=c,bi.elements[4]*=h,bi.elements[5]*=h,bi.elements[6]*=h,bi.elements[8]*=u,bi.elements[9]*=u,bi.elements[10]*=u,t.setFromRotationMatrix(bi),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=yi,l=!1){let c=this.elements,h=2*r/(t-e),u=2*r/(n-s),d=(t+e)/(t-e),f=(n+s)/(n-s),p,_;if(l)p=r/(a-r),_=a*r/(a-r);else if(o===yi)p=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===la)p=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=yi,l=!1){let c=this.elements,h=2/(t-e),u=2/(n-s),d=-(t+e)/(t-e),f=-(n+s)/(n-s),p,_;if(l)p=1/(a-r),_=a/(a-r);else if(o===yi)p=-2/(a-r),_=-(a+r)/(a-r);else if(o===la)p=-1/(a-r),_=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Gr=new w,bi=new De,z_=new w(0,0,0),G_=new w(1,1,1),Ps=new w,Ll=new w,Qn=new w,qp=new De,Xp=new Ke,Mi=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(ct(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ct(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(ct(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ct(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ct(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-ct(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Xe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return qp.makeRotationFromQuaternion(e),this.setFromRotationMatrix(qp,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Xp.setFromEuler(this),this.setFromQuaternion(Xp,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Mi.DEFAULT_ORDER="XYZ";da=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},V_=0,jp=new w,Vr=new Ke,ss=new De,Nl=new w,Qa=new w,W_=new w,q_=new Ke,Kp=new w(1,0,0),Yp=new w(0,1,0),Jp=new w(0,0,1),Zp={type:"added"},X_={type:"removed"},Wr={type:"childadded",child:null},Iu={type:"childremoved",child:null},Xt=class i extends ci{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:V_++}),this.uuid=li(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new w,t=new Mi,n=new Ke,s=new w(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new De},normalMatrix:{value:new it}}),this.matrix=new De,this.matrixWorld=new De,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new da,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Vr.setFromAxisAngle(e,t),this.quaternion.multiply(Vr),this}rotateOnWorldAxis(e,t){return Vr.setFromAxisAngle(e,t),this.quaternion.premultiply(Vr),this}rotateX(e){return this.rotateOnAxis(Kp,e)}rotateY(e){return this.rotateOnAxis(Yp,e)}rotateZ(e){return this.rotateOnAxis(Jp,e)}translateOnAxis(e,t){return jp.copy(e).applyQuaternion(this.quaternion),this.position.add(jp.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Kp,e)}translateY(e){return this.translateOnAxis(Yp,e)}translateZ(e){return this.translateOnAxis(Jp,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ss.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Nl.copy(e):Nl.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Qa.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ss.lookAt(Qa,Nl,this.up):ss.lookAt(Nl,Qa,this.up),this.quaternion.setFromRotationMatrix(ss),s&&(ss.extractRotation(s.matrixWorld),Vr.setFromRotationMatrix(ss),this.quaternion.premultiply(Vr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Qe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Zp),Wr.child=e,this.dispatchEvent(Wr),Wr.child=null):Qe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(X_),Iu.child=e,this.dispatchEvent(Iu),Iu.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ss.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ss.multiply(e.parent.matrixWorld)),e.applyMatrix4(ss),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Zp),Wr.child=e,this.dispatchEvent(Wr),Wr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Qa,e,W_),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Qa,q_,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),f=a(e.animations),p=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Xt.DEFAULT_UP=new w(0,1,0);Xt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;mt=class extends Xt{constructor(){super(),this.isGroup=!0,this.type="Group"}},j_={type:"move"},fa=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new mt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new mt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new w,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new w),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new mt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new w,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new w,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let _ of e.hand.values()){let g=t.getJointPose(_,n),m=this._getHandJoint(c,_);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,p=.005;c.inputState.pinching&&d>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(j_)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new mt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},p0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Is={h:0,s:0,l:0},Fl={h:0,s:0,l:0};ye=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Tt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ht.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=ht.workingColorSpace){return this.r=e,this.g=t,this.b=n,ht.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=ht.workingColorSpace){if(e=Pd(e,1),t=ct(t,0,1),n=ct(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Du(a,r,e+1/3),this.g=Du(a,r,e),this.b=Du(a,r,e-1/3)}return ht.colorSpaceToWorking(this,s),this}setStyle(e,t=Tt){function n(r){r!==void 0&&parseFloat(r)<1&&Xe("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Xe("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Xe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Tt){let n=p0[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Xe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=us(e.r),this.g=us(e.g),this.b=us(e.b),this}copyLinearToSRGB(e){return this.r=ra(e.r),this.g=ra(e.g),this.b=ra(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Tt){return ht.workingToColorSpace(An.copy(this),e),Math.round(ct(An.r*255,0,255))*65536+Math.round(ct(An.g*255,0,255))*256+Math.round(ct(An.b*255,0,255))}getHexString(e=Tt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ht.workingColorSpace){ht.workingToColorSpace(An.copy(this),t);let n=An.r,s=An.g,r=An.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=ht.workingColorSpace){return ht.workingToColorSpace(An.copy(this),t),e.r=An.r,e.g=An.g,e.b=An.b,e}getStyle(e=Tt){ht.workingToColorSpace(An.copy(this),e);let t=An.r,n=An.g,s=An.b;return e!==Tt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Is),this.setHSL(Is.h+e,Is.s+t,Is.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Is),e.getHSL(Fl);let n=fo(Is.h,Fl.h,t),s=fo(Is.s,Fl.s,t),r=fo(Is.l,Fl.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},An=new ye;ye.NAMES=p0;Us=class extends Xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Mi,this.environmentIntensity=1,this.environmentRotation=new Mi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},_i=new w,rs=new w,Lu=new w,as=new w,qr=new w,Xr=new w,$p=new w,Nu=new w,Fu=new w,Uu=new w,ku=new Lt,Ou=new Lt,Bu=new Lt,hs=class i{constructor(e=new w,t=new w,n=new w){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),_i.subVectors(e,t),s.cross(_i);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){_i.subVectors(s,t),rs.subVectors(n,t),Lu.subVectors(e,t);let a=_i.dot(_i),o=_i.dot(rs),l=_i.dot(Lu),c=rs.dot(rs),h=rs.dot(Lu),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-o*h)*d,p=(a*h-o*l)*d;return r.set(1-f-p,p,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,as)===null?!1:as.x>=0&&as.y>=0&&as.x+as.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,as)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,as.x),l.addScaledVector(a,as.y),l.addScaledVector(o,as.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return ku.setScalar(0),Ou.setScalar(0),Bu.setScalar(0),ku.fromBufferAttribute(e,t),Ou.fromBufferAttribute(e,n),Bu.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(ku,r.x),a.addScaledVector(Ou,r.y),a.addScaledVector(Bu,r.z),a}static isFrontFacing(e,t,n,s){return _i.subVectors(n,t),rs.subVectors(e,t),_i.cross(rs).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return _i.subVectors(this.c,this.b),rs.subVectors(this.a,this.b),_i.cross(rs).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;qr.subVectors(s,n),Xr.subVectors(r,n),Nu.subVectors(e,n);let l=qr.dot(Nu),c=Xr.dot(Nu);if(l<=0&&c<=0)return t.copy(n);Fu.subVectors(e,s);let h=qr.dot(Fu),u=Xr.dot(Fu);if(h>=0&&u<=h)return t.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(qr,a);Uu.subVectors(e,r);let f=qr.dot(Uu),p=Xr.dot(Uu);if(p>=0&&f<=p)return t.copy(r);let _=f*c-l*p;if(_<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Xr,o);let g=h*p-f*u;if(g<=0&&u-h>=0&&f-p>=0)return $p.subVectors(r,s),o=(u-h)/(u-h+(f-p)),t.copy(s).addScaledVector($p,o);let m=1/(g+_+d);return a=_*m,o=d*m,t.copy(n).addScaledVector(qr,a).addScaledVector(Xr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},yn=class{constructor(e=new w(1/0,1/0,1/0),t=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(xi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(xi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=xi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,xi):xi.fromBufferAttribute(r,a),xi.applyMatrix4(e.matrixWorld),this.expandByPoint(xi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ul.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ul.copy(n.boundingBox)),Ul.applyMatrix4(e.matrixWorld),this.union(Ul)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,xi),xi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(eo),kl.subVectors(this.max,eo),jr.subVectors(e.a,eo),Kr.subVectors(e.b,eo),Yr.subVectors(e.c,eo),Ds.subVectors(Kr,jr),Ls.subVectors(Yr,Kr),sr.subVectors(jr,Yr);let t=[0,-Ds.z,Ds.y,0,-Ls.z,Ls.y,0,-sr.z,sr.y,Ds.z,0,-Ds.x,Ls.z,0,-Ls.x,sr.z,0,-sr.x,-Ds.y,Ds.x,0,-Ls.y,Ls.x,0,-sr.y,sr.x,0];return!Hu(t,jr,Kr,Yr,kl)||(t=[1,0,0,0,1,0,0,0,1],!Hu(t,jr,Kr,Yr,kl))?!1:(Ol.crossVectors(Ds,Ls),t=[Ol.x,Ol.y,Ol.z],Hu(t,jr,Kr,Yr,kl))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,xi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(xi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(os[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),os[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),os[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),os[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),os[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),os[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),os[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),os[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(os),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},os=[new w,new w,new w,new w,new w,new w,new w,new w],xi=new w,Ul=new yn,jr=new w,Kr=new w,Yr=new w,Ds=new w,Ls=new w,sr=new w,eo=new w,kl=new w,Ol=new w,rr=new w;ln=new w,Bl=new $,K_=0,$e=class extends ci{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:K_++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Rd,this.updateRanges=[],this.gpuType=ii,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Bl.fromBufferAttribute(this,t),Bl.applyMatrix3(e),this.setXY(t,Bl.x,Bl.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.applyMatrix3(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.applyMatrix4(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.applyNormalMatrix(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.transformDirection(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=vi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Dt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=vi(t,this.array)),t}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=vi(t,this.array)),t}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=vi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=vi(t,this.array)),t}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),s=Dt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),s=Dt(s,this.array),r=Dt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}},vo=class extends $e{constructor(e,t,n){super(new Uint16Array(e),t,n)}},yo=class extends $e{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Ye=class extends $e{constructor(e,t,n){super(new Float32Array(e),t,n)}},Y_=new yn,to=new w,zu=new w,Rn=class{constructor(e=new w,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Y_.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;to.subVectors(e,this.center);let t=to.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(to,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(zu.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(to.copy(e.center).add(zu)),this.expandByPoint(to.copy(e.center).sub(zu))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},J_=0,ai=new De,Gu=new Xt,Jr=new w,ei=new yn,no=new yn,_n=new w,ot=class i extends ci{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:J_++}),this.uuid=li(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(v_(e)?yo:vo)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new it().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return ai.makeRotationFromQuaternion(e),this.applyMatrix4(ai),this}rotateX(e){return ai.makeRotationX(e),this.applyMatrix4(ai),this}rotateY(e){return ai.makeRotationY(e),this.applyMatrix4(ai),this}rotateZ(e){return ai.makeRotationZ(e),this.applyMatrix4(ai),this}translate(e,t,n){return ai.makeTranslation(e,t,n),this.applyMatrix4(ai),this}scale(e,t,n){return ai.makeScale(e,t,n),this.applyMatrix4(ai),this}lookAt(e){return Gu.lookAt(e),Gu.updateMatrix(),this.applyMatrix4(Gu.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Jr).negate(),this.translate(Jr.x,Jr.y,Jr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Ye(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Xe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new yn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Qe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];ei.setFromBufferAttribute(r),this.morphTargetsRelative?(_n.addVectors(this.boundingBox.min,ei.min),this.boundingBox.expandByPoint(_n),_n.addVectors(this.boundingBox.max,ei.max),this.boundingBox.expandByPoint(_n)):(this.boundingBox.expandByPoint(ei.min),this.boundingBox.expandByPoint(ei.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Qe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Rn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Qe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new w,1/0);return}if(e){let n=this.boundingSphere.center;if(ei.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];no.setFromBufferAttribute(o),this.morphTargetsRelative?(_n.addVectors(ei.min,no.min),ei.expandByPoint(_n),_n.addVectors(ei.max,no.max),ei.expandByPoint(_n)):(ei.expandByPoint(no.min),ei.expandByPoint(no.max))}ei.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)_n.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(_n));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)_n.fromBufferAttribute(o,c),l&&(Jr.fromBufferAttribute(e,c),_n.add(Jr)),s=Math.max(s,n.distanceToSquared(_n))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Qe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Qe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new $e(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let y=0;y<n.count;y++)o[y]=new w,l[y]=new w;let c=new w,h=new w,u=new w,d=new $,f=new $,p=new $,_=new w,g=new w;function m(y,A,C){c.fromBufferAttribute(n,y),h.fromBufferAttribute(n,A),u.fromBufferAttribute(n,C),d.fromBufferAttribute(r,y),f.fromBufferAttribute(r,A),p.fromBufferAttribute(r,C),h.sub(c),u.sub(c),f.sub(d),p.sub(d);let D=1/(f.x*p.y-p.x*f.y);isFinite(D)&&(_.copy(h).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(D),g.copy(u).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(D),o[y].add(_),o[A].add(_),o[C].add(_),l[y].add(g),l[A].add(g),l[C].add(g))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let y=0,A=x.length;y<A;++y){let C=x[y],D=C.start,F=C.count;for(let O=D,L=D+F;O<L;O+=3)m(e.getX(O+0),e.getX(O+1),e.getX(O+2))}let M=new w,b=new w,v=new w,S=new w;function R(y){v.fromBufferAttribute(s,y),S.copy(v);let A=o[y];M.copy(A),M.sub(v.multiplyScalar(v.dot(A))).normalize(),b.crossVectors(S,A);let D=b.dot(l[y])<0?-1:1;a.setXYZW(y,M.x,M.y,M.z,D)}for(let y=0,A=x.length;y<A;++y){let C=x[y],D=C.start,F=C.count;for(let O=D,L=D+F;O<L;O+=3)R(e.getX(O+0)),R(e.getX(O+1)),R(e.getX(O+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new $e(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let s=new w,r=new w,a=new w,o=new w,l=new w,c=new w,h=new w,u=new w;if(e)for(let d=0,f=e.count;d<f;d+=3){let p=e.getX(d+0),_=e.getX(d+1),g=e.getX(d+2);s.fromBufferAttribute(t,p),r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,g),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,g),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)_n.fromBufferAttribute(e,t),_n.normalize(),e.setXYZ(t,_n.x,_n.y,_n.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),f=0,p=0;for(let _=0,g=l.length;_<g;_++){o.isInterleavedBufferAttribute?f=l[_]*o.data.stride+o.offset:f=l[_]*h;for(let m=0;m<h;m++)d[p++]=c[f++]}return new $e(d,h,u)}if(this.index===null)return Xe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=e(d,n);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},pr=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Rd,this.updateRanges=[],this.version=0,this.uuid=li()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=li()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=li()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},Fn=new w,ks=class i{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Fn.fromBufferAttribute(this,t),Fn.applyMatrix4(e),this.setXYZ(t,Fn.x,Fn.y,Fn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Fn.fromBufferAttribute(this,t),Fn.applyNormalMatrix(e),this.setXYZ(t,Fn.x,Fn.y,Fn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Fn.fromBufferAttribute(this,t),Fn.transformDirection(e),this.setXYZ(t,Fn.x,Fn.y,Fn.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=vi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Dt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=vi(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=vi(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=vi(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=vi(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),s=Dt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),s=Dt(s,this.array),r=Dt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){_o("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new $e(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new i(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){_o("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Vu=new w,Z_=new w,$_=new it,Un=class{constructor(e=new w(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Vu.subVectors(n,t).cross(Z_.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(Vu),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||$_.getNormalMatrix(e),s=this.coplanarPoint(Vu).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Q_=0,Cn=class extends ci{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Q_++}),this.uuid=li(),this.name="",this.type="Material",this.blending=wa,this.side=Xi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=bd,this.blendDst=_d,this.blendEquation=fi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ye(0,0,0),this.blendAlpha=0,this.depthFunc=aa,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=i0,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=hc,this.stencilZFail=hc,this.stencilZPass=hc,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Xe(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Xe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new ye().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Un().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new $().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new $().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},mr=class extends Cn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new ye(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},io=new w,$r=new w,Qr=new w,ea=new $,so=new $,m0=new De,Hl=new w,ro=new w,zl=new w,Qp=new $,Wu=new $,em=new $,pa=class extends Xt{constructor(e=new mr){if(super(),this.isSprite=!0,this.type="Sprite",Zr===void 0){Zr=new ot;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new pr(t,5);Zr.setIndex([0,1,2,0,2,3]),Zr.setAttribute("position",new ks(n,3,0,!1)),Zr.setAttribute("uv",new ks(n,2,3,!1))}this.geometry=Zr,this.material=e,this.center=new $(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&Qe('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),$r.setFromMatrixScale(this.matrixWorld),m0.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Qr.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&$r.multiplyScalar(-Qr.z);let n=this.material.rotation,s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));let a=this.center;Gl(Hl.set(-.5,-.5,0),Qr,a,$r,s,r),Gl(ro.set(.5,-.5,0),Qr,a,$r,s,r),Gl(zl.set(.5,.5,0),Qr,a,$r,s,r),Qp.set(0,0),Wu.set(1,0),em.set(1,1);let o=e.ray.intersectTriangle(Hl,ro,zl,!1,io);if(o===null&&(Gl(ro.set(-.5,.5,0),Qr,a,$r,s,r),Wu.set(0,1),o=e.ray.intersectTriangle(Hl,zl,ro,!1,io),o===null))return;let l=e.ray.origin.distanceTo(io);l<e.near||l>e.far||t.push({distance:l,point:io.clone(),uv:hs.getInterpolation(io,Hl,ro,zl,Qp,Wu,em,new $),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};ls=new w,qu=new w,Vl=new w,Wl=new w,ki=class{constructor(e=new w,t=new w(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ls)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ls.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ls.copy(this.origin).addScaledVector(this.direction,t),ls.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){qu.copy(e).add(t).multiplyScalar(.5),Vl.copy(t).sub(e).normalize(),Wl.copy(this.origin).sub(qu);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Vl),o=Wl.dot(this.direction),l=-Wl.dot(Vl),c=Wl.lengthSq(),h=Math.abs(1-a*a),u,d,f,p;if(h>0)if(u=a*l-o,d=a*o-l,p=r*h,u>=0)if(d>=-p)if(d<=p){let _=1/h;u*=_,d*=_,f=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-p?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=p?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(qu).addScaledVector(Vl,d),f}intersectSphere(e,t){if(e.radius<0)return null;ls.subVectors(e.center,this.origin);let n=ls.dot(this.direction),s=ls.dot(ls)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,s=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,s=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ls)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,_=t.y-a.y,g=t.z-a.z,m=n.x-a.x,x=n.y-a.y,M=n.z-a.z,b=Math.abs(l),v=Math.abs(c),S=Math.abs(h),R,y,A,C,D,F,O,L,k,G,V,te;if(b>=v&&b>=S?(A=l,F=u,k=p,te=m,l>=0?(R=c,y=h,C=d,D=f,O=_,L=g,G=x,V=M):(R=h,y=c,C=f,D=d,O=g,L=_,G=M,V=x)):v>=S?(A=c,F=d,k=_,te=x,c>=0?(R=h,y=l,C=f,D=u,O=g,L=p,G=M,V=m):(R=l,y=h,C=u,D=f,O=p,L=g,G=m,V=M)):(A=h,F=f,k=g,te=M,h>=0?(R=l,y=c,C=u,D=d,O=p,L=_,G=m,V=x):(R=c,y=l,C=d,D=u,O=_,L=p,G=x,V=m)),A===0)return null;let N=R/A,Z=y/A,ie=1/A,be=C-N*F,me=D-Z*F,Je=O-N*k,We=L-Z*k,we=G-N*te,q=V-Z*te,j=we*We-q*Je,Q=be*q-me*we,fe=Je*me-We*be;if(s){if(j<0||Q<0||fe<0)return null}else if((j<0||Q<0||fe<0)&&(j>0||Q>0||fe>0))return null;let ae=j+Q+fe;if(ae===0)return null;let ge=ie*(j*F+Q*k+fe*te);return(ae>0?ge<0:ge>0)?null:this.at(ge/ae,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},$t=class extends Cn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ye(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mi,this.combine=xd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},tm=new De,ar=new ki,ql=new Rn,nm=new w,Xl=new w,jl=new w,Kl=new w,Xu=new w,Yl=new w,im=new w,Jl=new w,at=class extends Xt{constructor(e=new ot,t=new $t){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Yl.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(Xu.fromBufferAttribute(u,e),a?Yl.addScaledVector(Xu,h):Yl.addScaledVector(Xu.sub(t),h))}t.add(Yl)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ql.copy(n.boundingSphere),ql.applyMatrix4(r),ar.copy(e.ray).recast(e.near),!(ql.containsPoint(ar.origin)===!1&&(ar.intersectSphere(ql,nm)===null||ar.origin.distanceToSquared(nm)>(e.far-e.near)**2))&&(tm.copy(r).invert(),ar.copy(e.ray).applyMatrix4(tm),!(n.boundingBox!==null&&ar.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,ar)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,_=d.length;p<_;p++){let g=d[p],m=a[g.materialIndex],x=Math.max(g.start,f.start),M=Math.min(o.count,Math.min(g.start+g.count,f.start+f.count));for(let b=x,v=M;b<v;b+=3){let S=o.getX(b),R=o.getX(b+1),y=o.getX(b+2);s=Zl(this,m,e,n,c,h,u,S,R,y),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let p=Math.max(0,f.start),_=Math.min(o.count,f.start+f.count);for(let g=p,m=_;g<m;g+=3){let x=o.getX(g),M=o.getX(g+1),b=o.getX(g+2);s=Zl(this,a,e,n,c,h,u,x,M,b),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,_=d.length;p<_;p++){let g=d[p],m=a[g.materialIndex],x=Math.max(g.start,f.start),M=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let b=x,v=M;b<v;b+=3){let S=b,R=b+1,y=b+2;s=Zl(this,m,e,n,c,h,u,S,R,y),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let p=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let g=p,m=_;g<m;g+=3){let x=g,M=g+1,b=g+2;s=Zl(this,a,e,n,c,h,u,x,M,b),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};ao=new Lt,sm=new Lt,rm=new Lt,tx=new Lt,am=new De,$l=new w,ju=new Rn,om=new De,Ku=new ki,ds=class extends at{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=td,this.bindMatrix=new De,this.bindMatrixInverse=new De,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new yn),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,$l),this.boundingBox.expandByPoint($l)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Rn),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,$l),this.boundingSphere.expandByPoint($l)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ju.copy(this.boundingSphere),ju.applyMatrix4(s),e.ray.intersectsSphere(ju)!==!1&&(om.copy(s).invert(),Ku.copy(e.ray).applyMatrix4(om),!(this.boundingBox!==null&&Ku.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Ku)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Lt,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===td?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===$m?this.bindMatrixInverse.copy(this.bindMatrix).invert():Xe("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,s=this.geometry;sm.fromBufferAttribute(s.attributes.skinIndex,e),rm.fromBufferAttribute(s.attributes.skinWeight,e),t.isVector4?(ao.copy(t),t.set(0,0,0,0)):(ao.set(...t,1),t.set(0,0,0)),ao.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){let a=rm.getComponent(r);if(a!==0){let o=sm.getComponent(r);am.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(tx.copy(ao).applyMatrix4(am),a)}}return t.isVector4&&(t.w=ao.w),t.applyMatrix4(this.bindMatrixInverse)}},Os=class extends Xt{constructor(){super(),this.isBone=!0,this.type="Bone"}},Oi=class extends hn{constructor(e=null,t=1,n=1,s,r,a,o,l,c=jt,h=jt,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},lm=new De,nx=new De,fs=class i{constructor(e=[],t=[]){this.uuid=li(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Xe("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new De)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new De;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,a=e.length;r<a;r++){let o=e[r]?e[r].matrixWorld:nx;lm.multiplyMatrices(o,t[r]),lm.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new i(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new Oi(t,e,e,Hn,ii);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){let r=e.bones[n],a=t[r];a===void 0&&(Xe("Skeleton: No bone found with UUID:",r),a=new Os),this.bones.push(a),this.boneInverses.push(new De().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){let a=t[s];e.bones.push(a.uuid);let o=n[s];e.boneInverses.push(o.toArray())}return e}},ps=class extends $e{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},ta=new De,cm=new De,Ql=[],hm=new yn,ix=new De,oo=new at,lo=new Rn,Mo=class extends at{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ps(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,ix)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new yn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ta),hm.copy(e.boundingBox).applyMatrix4(ta),this.boundingBox.union(hm)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Rn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ta),lo.copy(e.boundingSphere).applyMatrix4(ta),this.boundingSphere.union(lo)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(oo.geometry=this.geometry,oo.material=this.material,oo.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),lo.copy(this.boundingSphere),lo.applyMatrix4(n),e.ray.intersectsSphere(lo)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,ta),cm.multiplyMatrices(n,ta),oo.matrixWorld=cm,oo.raycast(e,Ql);for(let a=0,o=Ql.length;a<o;a++){let l=Ql[a];l.instanceId=r,l.object=this,t.push(l)}Ql.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new ps(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Oi(new Float32Array(s*this.count),s,this.count,Yc,ii));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},or=new Rn,sx=new $(.5,.5),ec=new w,ma=class{constructor(e=new Un,t=new Un,n=new Un,s=new Un,r=new Un,a=new Un){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=yi,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],u=r[5],d=r[6],f=r[7],p=r[8],_=r[9],g=r[10],m=r[11],x=r[12],M=r[13],b=r[14],v=r[15];if(s[0].setComponents(c-a,f-h,m-p,v-x).normalize(),s[1].setComponents(c+a,f+h,m+p,v+x).normalize(),s[2].setComponents(c+o,f+u,m+_,v+M).normalize(),s[3].setComponents(c-o,f-u,m-_,v-M).normalize(),n)s[4].setComponents(l,d,g,b).normalize(),s[5].setComponents(c-l,f-d,m-g,v-b).normalize();else if(s[4].setComponents(c-l,f-d,m-g,v-b).normalize(),t===yi)s[5].setComponents(c+l,f+d,m+g,v+b).normalize();else if(t===la)s[5].setComponents(l,d,g,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),or.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),or.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(or)}intersectsSprite(e){or.center.set(0,0,0);let t=sx.distanceTo(e.center);return or.radius=.7071067811865476+t,or.applyMatrix4(e.matrixWorld),this.intersectsSphere(or)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(ec.x=s.normal.x>0?e.max.x:e.min.x,ec.y=s.normal.y>0?e.max.y:e.min.y,ec.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(ec)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Bs=class extends Cn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ye(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Mc=new w,Sc=new w,um=new De,co=new ki,tc=new Rn,Yu=new w,dm=new w,gr=class extends Xt{constructor(e=new ot,t=new Bs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)Mc.fromBufferAttribute(t,s-1),Sc.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=Mc.distanceTo(Sc);e.setAttribute("lineDistance",new Ye(n,1))}else Xe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),tc.copy(n.boundingSphere),tc.applyMatrix4(s),tc.radius+=r,e.ray.intersectsSphere(tc)===!1)return;um.copy(s).invert(),co.copy(e.ray).applyMatrix4(um);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){let f=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let _=f,g=p-1;_<g;_+=c){let m=h.getX(_),x=h.getX(_+1),M=nc(this,e,co,l,m,x,_);M&&t.push(M)}if(this.isLineLoop){let _=h.getX(p-1),g=h.getX(f),m=nc(this,e,co,l,_,g,p-1);m&&t.push(m)}}else{let f=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let _=f,g=p-1;_<g;_+=c){let m=nc(this,e,co,l,_,_+1,_);m&&t.push(m)}if(this.isLineLoop){let _=nc(this,e,co,l,p-1,f,p-1);_&&t.push(_)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};fm=new w,pm=new w,br=class extends gr{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)fm.fromBufferAttribute(t,s),pm.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+fm.distanceTo(pm);e.setAttribute("lineDistance",new Ye(n,1))}else Xe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},So=class extends gr{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},ms=class extends Cn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ye(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},mm=new De,id=new ki,ic=new Rn,sc=new w,Hs=class extends Xt{constructor(e=new ot,t=new ms){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ic.copy(n.boundingSphere),ic.applyMatrix4(s),ic.radius+=r,e.ray.intersectsSphere(ic)===!1)return;mm.copy(s).invert(),id.copy(e.ray).applyMatrix4(mm);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){let d=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let p=d,_=f;p<_;p++){let g=c.getX(p);sc.fromBufferAttribute(u,g),gm(sc,g,l,s,e,t,this)}}else{let d=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let p=d,_=f;p<_;p++)sc.fromBufferAttribute(u,p),gm(sc,p,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};_r=class extends hn{constructor(e=[],t=qs,n,s,r,a,o,l,c,h){super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Bi=class extends hn{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Hi=class extends hn{constructor(e,t,n=Ti,s,r,a,o=jt,l=jt,c,h=Ui,u=1){if(h!==Ui&&h!==Ki)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:u};super(d,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ua(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Ec=class extends Hi{constructor(e,t=Ti,n=qs,s,r,a=jt,o=jt,l,c=Ui){let h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,n,s,r,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Eo=class extends hn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},At=class i extends ot{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,f=0;p("z","y","x",-1,-1,n,t,e,a,r,0),p("z","y","x",1,-1,n,t,-e,a,r,1),p("x","z","y",1,1,e,n,t,s,a,2),p("x","z","y",1,-1,e,n,-t,s,a,3),p("x","y","z",1,-1,e,t,n,s,r,4),p("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Ye(c,3)),this.setAttribute("normal",new Ye(h,3)),this.setAttribute("uv",new Ye(u,2));function p(_,g,m,x,M,b,v,S,R,y,A){let C=b/R,D=v/y,F=b/2,O=v/2,L=S/2,k=R+1,G=y+1,V=0,te=0,N=new w;for(let Z=0;Z<G;Z++){let ie=Z*D-O;for(let be=0;be<k;be++){let me=be*C-F;N[_]=me*x,N[g]=ie*M,N[m]=L,c.push(N.x,N.y,N.z),N[_]=0,N[g]=0,N[m]=S>0?1:-1,h.push(N.x,N.y,N.z),u.push(be/R),u.push(1-Z/y),V+=1}}for(let Z=0;Z<y;Z++)for(let ie=0;ie<R;ie++){let be=d+ie+k*Z,me=d+ie+k*(Z+1),Je=d+(ie+1)+k*(Z+1),We=d+(ie+1)+k*Z;l.push(be,me,We),l.push(me,Je,We),te+=6}o.addGroup(f,te,A),f+=te,d+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}},hi=class i extends ot{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new w,h=new $;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=n+u/t*s;c.x=e*Math.cos(f),c.y=e*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Ye(a,3)),this.setAttribute("normal",new Ye(o,3)),this.setAttribute("uv",new Ye(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Mt=class i extends ot{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],p=0,_=[],g=n/2,m=0;x(),a===!1&&(e>0&&M(!0),t>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new Ye(u,3)),this.setAttribute("normal",new Ye(d,3)),this.setAttribute("uv",new Ye(f,2));function x(){let b=new w,v=new w,S=0,R=(t-e)/n;for(let y=0;y<=r;y++){let A=[],C=y/r,D=C*(t-e)+e;for(let F=0;F<=s;F++){let O=F/s,L=O*l+o,k=Math.sin(L),G=Math.cos(L);v.x=D*k,v.y=-C*n+g,v.z=D*G,u.push(v.x,v.y,v.z),b.set(k,R,G).normalize(),d.push(b.x,b.y,b.z),f.push(O,1-C),A.push(p++)}_.push(A)}for(let y=0;y<s;y++)for(let A=0;A<r;A++){let C=_[A][y],D=_[A+1][y],F=_[A+1][y+1],O=_[A][y+1];(e>0||A!==0)&&(h.push(C,D,O),S+=3),(t>0||A!==r-1)&&(h.push(D,F,O),S+=3)}c.addGroup(m,S,0),m+=S}function M(b){let v=p,S=new $,R=new w,y=0,A=b===!0?e:t,C=b===!0?1:-1;for(let F=1;F<=s;F++)u.push(0,g*C,0),d.push(0,C,0),f.push(.5,.5),p++;let D=p;for(let F=0;F<=s;F++){let L=F/s*l+o,k=Math.cos(L),G=Math.sin(L);R.x=A*G,R.y=g*C,R.z=A*k,u.push(R.x,R.y,R.z),d.push(0,C,0),S.x=k*.5+.5,S.y=G*.5*C+.5,f.push(S.x,S.y),p++}for(let F=0;F<s;F++){let O=v+F,L=D+F;b===!0?h.push(L,L+1,O):h.push(L+1,L,O),y+=3}c.addGroup(m,y,b===!0?1:2),m+=y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Nt=class i extends Mt{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},wc=class i extends ot{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),c(n),h(),this.setAttribute("position",new Ye(r,3)),this.setAttribute("normal",new Ye(r.slice(),3)),this.setAttribute("uv",new Ye(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(x){let M=new w,b=new w,v=new w;for(let S=0;S<t.length;S+=3)f(t[S+0],M),f(t[S+1],b),f(t[S+2],v),l(M,b,v,x)}function l(x,M,b,v){let S=v+1,R=[];for(let y=0;y<=S;y++){R[y]=[];let A=x.clone().lerp(b,y/S),C=M.clone().lerp(b,y/S),D=S-y;for(let F=0;F<=D;F++)F===0&&y===S?R[y][F]=A:R[y][F]=A.clone().lerp(C,F/D)}for(let y=0;y<S;y++)for(let A=0;A<2*(S-y)-1;A++){let C=Math.floor(A/2);A%2===0?(d(R[y][C+1]),d(R[y+1][C]),d(R[y][C])):(d(R[y][C+1]),d(R[y+1][C+1]),d(R[y+1][C]))}}function c(x){let M=new w;for(let b=0;b<r.length;b+=3)M.x=r[b+0],M.y=r[b+1],M.z=r[b+2],M.normalize().multiplyScalar(x),r[b+0]=M.x,r[b+1]=M.y,r[b+2]=M.z}function h(){let x=new w;for(let M=0;M<r.length;M+=3){x.x=r[M+0],x.y=r[M+1],x.z=r[M+2];let b=g(x)/2/Math.PI+.5,v=m(x)/Math.PI+.5;a.push(b,1-v)}p(),u()}function u(){for(let x=0;x<a.length;x+=6){let M=a[x+0],b=a[x+2],v=a[x+4],S=Math.max(M,b,v),R=Math.min(M,b,v);S>.9&&R<.1&&(M<.2&&(a[x+0]+=1),b<.2&&(a[x+2]+=1),v<.2&&(a[x+4]+=1))}}function d(x){r.push(x.x,x.y,x.z)}function f(x,M){let b=x*3;M.x=e[b+0],M.y=e[b+1],M.z=e[b+2]}function p(){let x=new w,M=new w,b=new w,v=new w,S=new $,R=new $,y=new $;for(let A=0,C=0;A<r.length;A+=9,C+=6){x.set(r[A+0],r[A+1],r[A+2]),M.set(r[A+3],r[A+4],r[A+5]),b.set(r[A+6],r[A+7],r[A+8]),S.set(a[C+0],a[C+1]),R.set(a[C+2],a[C+3]),y.set(a[C+4],a[C+5]),v.copy(x).add(M).add(b).divideScalar(3);let D=g(v);_(S,C+0,x,D),_(R,C+2,M,D),_(y,C+4,b,D)}}function _(x,M,b,v){v<0&&x.x===1&&(a[M]=x.x-1),b.x===0&&b.z===0&&(a[M]=v/2/Math.PI+.5)}function g(x){return Math.atan2(x.z,-x.x)}function m(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.detail)}},ti=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Xe("Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,s=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),s=0,r=n.length,a;t?a=t:a=e*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);let h=n[s],d=n[s+1]-h,f=(a-h)/d;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=t||(a.isVector2?new $:new w);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new w,s=[],r=[],a=[],o=new w,l=new De;for(let f=0;f<=e;f++){let p=f/e;s[f]=this.getTangentAt(p,new w)}r[0]=new w,a[0]=new w;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(s[f-1],s[f]),o.length()>Number.EPSILON){o.normalize();let p=Math.acos(ct(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,p))}a[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(ct(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(o.crossVectors(r[0],r[e]))>0&&(f=-f);for(let p=1;p<=e;p++)r[p].applyMatrix4(l.makeRotationAxis(s[p],f*p)),a[p].crossVectors(s[p],r[p])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ga=class extends ti{constructor(e=0,t=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new $){let n=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Tc=class extends ga{constructor(e,t,n,s,r,a){super(e,t,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};bm=new w,_m=new w,Ju=new Id,Zu=new Id,$u=new Id,zi=class extends ti{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new w){let n=t,s=this.points,r=s.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(_m.subVectors(s[0],s[1]).add(s[0]),c=_m);let u=s[o%r],d=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(bm.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=bm),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(u),f),_=Math.pow(u.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(h),f);_<1e-4&&(_=1),p<1e-4&&(p=_),g<1e-4&&(g=_),Ju.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,p,_,g),Zu.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,p,_,g),$u.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,p,_,g)}else this.curveType==="catmullrom"&&(Ju.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Zu.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),$u.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(Ju.calc(l),Zu.calc(l),$u.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new w().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};wo=class extends ti{constructor(e=new $,t=new $,n=new $,s=new $){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new $){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(mo(e,s.x,r.x,a.x,o.x),mo(e,s.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ac=class extends ti{constructor(e=new w,t=new w,n=new w,s=new w){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new w){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(mo(e,s.x,r.x,a.x,o.x),mo(e,s.y,r.y,a.y,o.y),mo(e,s.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},To=class extends ti{constructor(e=new $,t=new $){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new $){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new $){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Rc=class extends ti{constructor(e=new w,t=new w){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new w){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new w){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ao=class extends ti{constructor(e=new $,t=new $,n=new $){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new $){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(po(e,s.x,r.x,a.x),po(e,s.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ro=class extends ti{constructor(e=new w,t=new w,n=new w){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new w){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(po(e,s.x,r.x,a.x),po(e,s.y,r.y,a.y),po(e,s.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Co=class extends ti{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new $){let n=t,s=this.points,r=(s.length-1)*e,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],u=s[a>s.length-3?s.length-1:a+2];return n.set(xm(o,l.x,c.x,h.x,u.x),xm(o,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new $().fromArray(s))}return this}},Cc=Object.freeze({__proto__:null,ArcCurve:Tc,CatmullRomCurve3:zi,CubicBezierCurve:wo,CubicBezierCurve3:Ac,EllipseCurve:ga,LineCurve:To,LineCurve3:Rc,QuadraticBezierCurve:Ao,QuadraticBezierCurve3:Ro,SplineCurve:Co}),Pc=class extends ti{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Cc[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(new Cc[s.type]().fromJSON(s))}return this}},Po=class extends Pc{constructor(e){super(),this.type="Path",this.currentPoint=new $,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new To(this.currentPoint.clone(),new $(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,s){let r=new Ao(this.currentPoint.clone(),new $(e,t),new $(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(e,t,n,s,r,a){let o=new wo(this.currentPoint.clone(),new $(e,t),new $(n,s),new $(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new Co(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,s,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,s,r,a),this}absarc(e,t,n,s,r,a){return this.absellipse(e,t,n,n,s,r,a),this}ellipse(e,t,n,s,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,s,r,a,o,l),this}absellipse(e,t,n,s,r,a,o,l){let c=new ga(e,t,n,s,r,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Wn=class extends Po{constructor(e){super(e),this.uuid=li(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,s=this.holes.length;n<s;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(new Po().fromJSON(s))}return this}};ad=class{static triangulate(e,t,n=2){return dx(e,t,n)}},Ni=class i{static area(e){let t=e.length,n=0;for(let s=t-1,r=0;r<t;s=r++)n+=e[s].x*e[r].y-e[r].x*e[s].y;return n*.5}static isClockWise(e){return i.area(e)<0}static triangulateShape(e,t){let n=[],s=[],r=[];ym(e),Mm(n,e);let a=e.length;t.forEach(ym);for(let l=0;l<t.length;l++)s.push(a),a+=t[l].length,Mm(n,t[l]);let o=ad.triangulate(n,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};Si=class i extends ot{constructor(e=new Wn([new $(.5,.5),new $(-.5,.5),new $(-.5,-.5),new $(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,s=[],r=[];for(let o=0,l=e.length;o<l;o++){let c=e[o];a(c)}this.setAttribute("position",new Ye(s,3)),this.setAttribute("uv",new Ye(r,2)),this.computeVertexNormals();function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled!==void 0?t.bevelEnabled:!0,f=t.bevelThickness!==void 0?t.bevelThickness:.2,p=t.bevelSize!==void 0?t.bevelSize:f-.1,_=t.bevelOffset!==void 0?t.bevelOffset:0,g=t.bevelSegments!==void 0?t.bevelSegments:3,m=t.extrudePath,x=t.UVGenerator!==void 0?t.UVGenerator:Cx,M,b=!1,v,S,R,y;if(m){M=m.getSpacedPoints(h),b=!0,d=!1;let X=m.isCatmullRomCurve3?m.closed:!1;v=m.computeFrenetFrames(h,X),S=new w,R=new w,y=new w}d||(g=0,f=0,p=0,_=0);let A=o.extractPoints(c),C=A.shape,D=A.holes;if(!Ni.isClockWise(C)){C=C.reverse();for(let X=0,J=D.length;X<J;X++){let ce=D[X];Ni.isClockWise(ce)&&(D[X]=ce.reverse())}}function O(X){let ce=10000000000000001e-36,he=X[0];for(let de=1;de<=X.length;de++){let Te=de%X.length,Pe=X[Te],je=Pe.x-he.x,Oe=Pe.y-he.y,U=je*je+Oe*Oe,lt=Math.max(Math.abs(Pe.x),Math.abs(Pe.y),Math.abs(he.x),Math.abs(he.y)),rt=ce*lt*lt;if(U<=rt){X.splice(Te,1),de--;continue}he=Pe}}O(C),D.forEach(O);let L=D.length,k=C;for(let X=0;X<L;X++){let J=D[X];C=C.concat(J)}function G(X,J,ce){return J||Qe("ExtrudeGeometry: vec does not exist"),X.clone().addScaledVector(J,ce)}let V=C.length;function te(X,J,ce){let he,de,Te,Pe=X.x-J.x,je=X.y-J.y,Oe=ce.x-X.x,U=ce.y-X.y,lt=Pe*Pe+je*je,rt=Pe*U-je*Oe;if(Math.abs(rt)>Number.EPSILON){let I=Math.sqrt(lt),E=Math.sqrt(Oe*Oe+U*U),z=J.x-je/I,W=J.y+Pe/I,ne=ce.x-U/E,pe=ce.y+Oe/E,_e=((ne-z)*U-(pe-W)*Oe)/(Pe*U-je*Oe);he=z+Pe*_e-X.x,de=W+je*_e-X.y;let se=he*he+de*de;if(se<=2)return new $(he,de);Te=Math.sqrt(se/2)}else{let I=!1;Pe>Number.EPSILON?Oe>Number.EPSILON&&(I=!0):Pe<-Number.EPSILON?Oe<-Number.EPSILON&&(I=!0):Math.sign(je)===Math.sign(U)&&(I=!0),I?(he=-je,de=Pe,Te=Math.sqrt(lt)):(he=Pe,de=je,Te=Math.sqrt(lt/2))}return new $(he/Te,de/Te)}let N=[];for(let X=0,J=k.length,ce=J-1,he=X+1;X<J;X++,ce++,he++)ce===J&&(ce=0),he===J&&(he=0),N[X]=te(k[X],k[ce],k[he]);let Z=[],ie,be=N.concat();for(let X=0,J=L;X<J;X++){let ce=D[X];ie=[];for(let he=0,de=ce.length,Te=de-1,Pe=he+1;he<de;he++,Te++,Pe++)Te===de&&(Te=0),Pe===de&&(Pe=0),ie[he]=te(ce[he],ce[Te],ce[Pe]);Z.push(ie),be=be.concat(ie)}let me;if(g===0)me=Ni.triangulateShape(k,D);else{let X=[],J=[];for(let ce=0;ce<g;ce++){let he=ce/g,de=f*Math.cos(he*Math.PI/2),Te=p*Math.sin(he*Math.PI/2)+_;for(let Pe=0,je=k.length;Pe<je;Pe++){let Oe=G(k[Pe],N[Pe],Te);Q(Oe.x,Oe.y,-de),he===0&&X.push(Oe)}for(let Pe=0,je=L;Pe<je;Pe++){let Oe=D[Pe];ie=Z[Pe];let U=[];for(let lt=0,rt=Oe.length;lt<rt;lt++){let I=G(Oe[lt],ie[lt],Te);Q(I.x,I.y,-de),he===0&&U.push(I)}he===0&&J.push(U)}}me=Ni.triangulateShape(X,J)}let Je=me.length,We=p+_;for(let X=0;X<V;X++){let J=d?G(C[X],be[X],We):C[X];b?(R.copy(v.normals[0]).multiplyScalar(J.x),S.copy(v.binormals[0]).multiplyScalar(J.y),y.copy(M[0]).add(R).add(S),Q(y.x,y.y,y.z)):Q(J.x,J.y,0)}for(let X=1;X<=h;X++)for(let J=0;J<V;J++){let ce=d?G(C[J],be[J],We):C[J];b?(R.copy(v.normals[X]).multiplyScalar(ce.x),S.copy(v.binormals[X]).multiplyScalar(ce.y),y.copy(M[X]).add(R).add(S),Q(y.x,y.y,y.z)):Q(ce.x,ce.y,u/h*X)}for(let X=g-1;X>=0;X--){let J=X/g,ce=f*Math.cos(J*Math.PI/2),he=p*Math.sin(J*Math.PI/2)+_;for(let de=0,Te=k.length;de<Te;de++){let Pe=G(k[de],N[de],he);Q(Pe.x,Pe.y,u+ce)}for(let de=0,Te=D.length;de<Te;de++){let Pe=D[de];ie=Z[de];for(let je=0,Oe=Pe.length;je<Oe;je++){let U=G(Pe[je],ie[je],he);b?Q(U.x,U.y+M[h-1].y,M[h-1].x+ce):Q(U.x,U.y,u+ce)}}}we(),q();function we(){let X=s.length/3;if(d){let J=0,ce=V*J;for(let he=0;he<Je;he++){let de=me[he];fe(de[2]+ce,de[1]+ce,de[0]+ce)}J=h+g*2,ce=V*J;for(let he=0;he<Je;he++){let de=me[he];fe(de[0]+ce,de[1]+ce,de[2]+ce)}}else{for(let J=0;J<Je;J++){let ce=me[J];fe(ce[2],ce[1],ce[0])}for(let J=0;J<Je;J++){let ce=me[J];fe(ce[0]+V*h,ce[1]+V*h,ce[2]+V*h)}}n.addGroup(X,s.length/3-X,0)}function q(){let X=s.length/3,J=0;j(k,J),J+=k.length;for(let ce=0,he=D.length;ce<he;ce++){let de=D[ce];j(de,J),J+=de.length}n.addGroup(X,s.length/3-X,1)}function j(X,J){let ce=X.length;for(;--ce>=0;){let he=ce,de=ce-1;de<0&&(de=X.length-1);for(let Te=0,Pe=h+g*2;Te<Pe;Te++){let je=V*Te,Oe=V*(Te+1),U=J+he+je,lt=J+de+je,rt=J+de+Oe,I=J+he+Oe;ae(U,lt,rt,I)}}}function Q(X,J,ce){l.push(X),l.push(J),l.push(ce)}function fe(X,J,ce){ge(X),ge(J),ge(ce);let he=s.length/3,de=x.generateTopUV(n,s,he-3,he-2,he-1);et(de[0]),et(de[1]),et(de[2])}function ae(X,J,ce,he){ge(X),ge(J),ge(he),ge(J),ge(ce),ge(he);let de=s.length/3,Te=x.generateSideWallUV(n,s,de-6,de-3,de-2,de-1);et(Te[0]),et(Te[1]),et(Te[3]),et(Te[1]),et(Te[2]),et(Te[3])}function ge(X){s.push(l[X*3+0]),s.push(l[X*3+1]),s.push(l[X*3+2])}function et(X){r.push(X.x),r.push(X.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Px(t,n,e)}static fromJSON(e,t){let n=[];for(let r=0,a=e.shapes.length;r<a;r++){let o=t[e.shapes[r]];n.push(o)}let s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new Cc[s.type]().fromJSON(s)),new i(n,e.options)}},Cx={generateTopUV:function(i,e,t,n,s){let r=e[t*3],a=e[t*3+1],o=e[n*3],l=e[n*3+1],c=e[s*3],h=e[s*3+1];return[new $(r,a),new $(o,l),new $(c,h)]},generateSideWallUV:function(i,e,t,n,s,r){let a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[n*3],h=e[n*3+1],u=e[n*3+2],d=e[s*3],f=e[s*3+1],p=e[s*3+2],_=e[r*3],g=e[r*3+1],m=e[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new $(a,1-l),new $(c,1-u),new $(d,1-p),new $(_,1-m)]:[new $(o,1-l),new $(h,1-u),new $(f,1-p),new $(g,1-m)]}};zs=class i extends ot{constructor(e=[new $(0,-.5),new $(.5,0),new $(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=ct(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],h=1/t,u=new w,d=new $,f=new w,p=new w,_=new w,g=0,m=0;for(let x=0;x<=e.length-1;x++)switch(x){case 0:g=e[x+1].x-e[x].x,m=e[x+1].y-e[x].y,f.x=m*1,f.y=-g,f.z=m*0,_.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:g=e[x+1].x-e[x].x,m=e[x+1].y-e[x].y,f.x=m*1,f.y=-g,f.z=m*0,p.copy(f),f.x+=_.x,f.y+=_.y,f.z+=_.z,f.normalize(),l.push(f.x,f.y,f.z),_.copy(p)}for(let x=0;x<=t;x++){let M=n+x*h*s,b=Math.sin(M),v=Math.cos(M);for(let S=0;S<=e.length-1;S++){u.x=e[S].x*b,u.y=e[S].y,u.z=e[S].x*v,a.push(u.x,u.y,u.z),d.x=x/t,d.y=S/(e.length-1),o.push(d.x,d.y);let R=l[3*S+0]*b,y=l[3*S+1],A=l[3*S+0]*v;c.push(R,y,A)}}for(let x=0;x<t;x++)for(let M=0;M<e.length-1;M++){let b=M+x*e.length,v=b,S=b+e.length,R=b+e.length+1,y=b+1;r.push(v,S,y),r.push(R,y,S)}this.setIndex(r),this.setAttribute("position",new Ye(a,3)),this.setAttribute("uv",new Ye(o,2)),this.setAttribute("normal",new Ye(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}},gs=class i extends wc{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},Mn=class i extends ot{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=e/o,d=t/l,f=[],p=[],_=[],g=[];for(let m=0;m<h;m++){let x=m*d-a;for(let M=0;M<c;M++){let b=M*u-r;p.push(b,-x,0),_.push(0,0,1),g.push(M/o),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let x=0;x<o;x++){let M=x+c*m,b=x+c*(m+1),v=x+1+c*(m+1),S=x+1+c*m;f.push(M,b,S),f.push(b,v,S)}this.setIndex(f),this.setAttribute("position",new Ye(p,3)),this.setAttribute("normal",new Ye(_,3)),this.setAttribute("uv",new Ye(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},No=class i extends ot{constructor(e=new Wn([new $(0,.5),new $(-.5,-.5),new $(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],s=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new Ye(s,3)),this.setAttribute("normal",new Ye(r,3)),this.setAttribute("uv",new Ye(a,2));function c(h){let u=s.length/3,d=h.extractPoints(t),f=d.shape,p=d.holes;Ni.isClockWise(f)===!1&&(f=f.reverse());for(let g=0,m=p.length;g<m;g++){let x=p[g];Ni.isClockWise(x)===!0&&(p[g]=x.reverse())}let _=Ni.triangulateShape(f,p);for(let g=0,m=p.length;g<m;g++){let x=p[g];f=f.concat(x)}for(let g=0,m=f.length;g<m;g++){let x=f[g];s.push(x.x,x.y,0),r.push(0,0,1),a.push(x.x,x.y)}for(let g=0,m=_.length;g<m;g++){let x=_[g],M=x[0]+u,b=x[1]+u,v=x[2]+u;n.push(M,b,v),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Ix(t,e)}static fromJSON(e,t){let n=[];for(let s=0,r=e.shapes.length;s<r;s++){let a=t[e.shapes[s]];n.push(a)}return new i(n,e.curveSegments)}};bt=class i extends ot{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new w,d=new w,f=[],p=[],_=[],g=[];for(let m=0;m<=n;m++){let x=[],M=m/n,b=a+M*o,v=e*Math.cos(b),S=Math.sqrt(e*e-v*v),R=0;m===0&&a===0?R=.5/t:m===n&&l===Math.PI&&(R=-.5/t);for(let y=0;y<=t;y++){let A=y/t,C=s+A*r;u.x=-S*Math.cos(C),u.y=v,u.z=S*Math.sin(C),p.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),g.push(A+R,1-M),x.push(c++)}h.push(x)}for(let m=0;m<n;m++)for(let x=0;x<t;x++){let M=h[m][x+1],b=h[m][x],v=h[m+1][x],S=h[m+1][x+1];(m!==0||a>0)&&f.push(M,b,S),(m!==n-1||l<Math.PI)&&f.push(b,v,S)}this.setIndex(f),this.setAttribute("position",new Ye(p,3)),this.setAttribute("normal",new Ye(_,3)),this.setAttribute("uv",new Ye(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},_t=class i extends ot{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],u=[],d=new w,f=new w,p=new w;for(let _=0;_<=n;_++){let g=a+_/n*o;for(let m=0;m<=s;m++){let x=m/s*r;f.x=(e+t*Math.cos(g))*Math.cos(x),f.y=(e+t*Math.cos(g))*Math.sin(x),f.z=t*Math.sin(g),c.push(f.x,f.y,f.z),d.x=e*Math.cos(x),d.y=e*Math.sin(x),p.subVectors(f,d).normalize(),h.push(p.x,p.y,p.z),u.push(m/s),u.push(_/n)}}for(let _=1;_<=n;_++)for(let g=1;g<=s;g++){let m=(s+1)*_+g-1,x=(s+1)*(_-1)+g-1,M=(s+1)*(_-1)+g,b=(s+1)*_+g;l.push(m,x,b),l.push(x,M,b)}this.setIndex(l),this.setAttribute("position",new Ye(c,3)),this.setAttribute("normal",new Ye(h,3)),this.setAttribute("uv",new Ye(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}},_a=class i extends ot{constructor(e=new Ro(new w(-1,-1,0),new w(-1,1,0),new w(1,1,0)),t=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:s,closed:r};let a=e.computeFrenetFrames(t,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new w,l=new w,c=new $,h=new w,u=[],d=[],f=[],p=[];_(),this.setIndex(p),this.setAttribute("position",new Ye(u,3)),this.setAttribute("normal",new Ye(d,3)),this.setAttribute("uv",new Ye(f,2));function _(){for(let M=0;M<t;M++)g(M);g(r===!1?t:0),x(),m()}function g(M){h=e.getPointAt(M/t,h);let b=a.normals[M],v=a.binormals[M];for(let S=0;S<=s;S++){let R=S/s*Math.PI*2,y=Math.sin(R),A=-Math.cos(R);l.x=A*b.x+y*v.x,l.y=A*b.y+y*v.y,l.z=A*b.z+y*v.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,u.push(o.x,o.y,o.z)}}function m(){for(let M=1;M<=t;M++)for(let b=1;b<=s;b++){let v=(s+1)*(M-1)+(b-1),S=(s+1)*M+(b-1),R=(s+1)*M+b,y=(s+1)*(M-1)+b;p.push(v,S,y),p.push(S,R,y)}}function x(){for(let M=0;M<=t;M++)for(let b=0;b<=s;b++)c.x=M/t,c.y=b/s,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new i(new Cc[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};zn={clone:Ar,merge:Dn},Lx=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Nx=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Bt=class extends Cn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Lx,this.fragmentShader=Nx,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ar(e.uniforms),this.uniformsGroups=Dx(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new ye().setHex(s.value);break;case"v2":this.uniforms[n].value=new $().fromArray(s.value);break;case"v3":this.uniforms[n].value=new w().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Lt().fromArray(s.value);break;case"m3":this.uniforms[n].value=new it().fromArray(s.value);break;case"m4":this.uniforms[n].value=new De().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},xa=class extends Bt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Ht=class extends Cn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ye(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ye(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=rl,this.normalScale=new $(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Mi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},qn=class extends Ht{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new $(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ct(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ye(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ye(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ye(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}},Fo=class extends Cn{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=rl,this.normalScale=new $(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}},Ic=class extends Cn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=t0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Dc=class extends Cn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};Gi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];e:{t:{let a;n:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break t}a=t.length;break n}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break t}a=n,n=0;break n}break e}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Lc=class extends Gi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:lr,endingEnd:lr}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case cr:r=e,o=2*t-n;break;case go:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case cr:a=e,l=2*n-t;break;case go:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(s-t),_=p*p,g=_*p,m=-d*g+2*d*_-d*p,x=(1+d)*g+(-1.5-2*d)*_+(-.5+d)*p+1,M=(-1-f)*g+(1.5+f)*_+.5*p,b=f*g-f*_;for(let v=0;v!==o;++v)r[v]=m*a[h+v]+x*a[c+v]+M*a[l+v]+b*a[u+v];return r}},Uo=class extends Gi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},Nc=class extends Gi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Fc=class extends Gi{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,u=this.outTangents;if(!h||!u){let p=(n-t)/(s-t),_=1-p;for(let g=0;g!==o;++g)r[g]=a[c+g]*_+a[l+g]*p;return r}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let _=a[c+p],g=a[l+p],m=f*d+p*2,x=u[m],M=u[m+1],b=e*d+p*2,v=h[b],S=h[b+1],R=Ox(n,t,x,v,s);r[p]=v0(R,_,M,S,g)}return r}};Xn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Fs(t,this.TimeBufferType),this.values=Fs(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Fs(e.times,Array),values:Fs(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),uc(e.settings)&&(n.settings={inTangents:Fs(e.settings.inTangents,Array),outTangents:Fs(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Nc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Uo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Lc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Fc(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case ur:t=this.InterpolantFactoryMethodDiscrete;break;case dr:t=this.InterpolantFactoryMethodLinear;break;case cc:t=this.InterpolantFactoryMethodSmooth;break;case nd:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Xe("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ur;case this.InterpolantFactoryMethodLinear:return dr;case this.InterpolantFactoryMethodSmooth:return cc;case this.InterpolantFactoryMethodBezier:return nd}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;uc(this.settings)&&(wm(this.settings.inTangents,e),wm(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Qe("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Qe("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Qe("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Qe("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&y_(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Qe("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===cc,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,f=u+n;for(let p=0;p!==n;++p){let _=t[u+p];if(_!==t[d+p]||_!==t[f+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,uc(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};Xn.prototype.ValueTypeName="";Xn.prototype.TimeBufferType=Float32Array;Xn.prototype.ValueBufferType=Float32Array;Xn.prototype.DefaultInterpolation=dr;bs=class extends Xn{constructor(e,t,n){super(e,t,n)}};bs.prototype.ValueTypeName="bool";bs.prototype.ValueBufferType=Array;bs.prototype.DefaultInterpolation=ur;bs.prototype.InterpolantFactoryMethodLinear=void 0;bs.prototype.InterpolantFactoryMethodSmooth=void 0;ko=class extends Xn{constructor(e,t,n,s){super(e,t,n,s)}};ko.prototype.ValueTypeName="color";_s=class extends Xn{constructor(e,t,n,s){super(e,t,n,s)}};_s.prototype.ValueTypeName="number";Uc=class extends Gi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)Ke.slerpFlat(r,0,a,c-o,a,c,l);return r}},ni=class extends Xn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new Uc(this.times,this.values,this.getValueSize(),e)}};ni.prototype.ValueTypeName="quaternion";ni.prototype.InterpolantFactoryMethodSmooth=void 0;xs=class extends Xn{constructor(e,t,n){super(e,t,n)}};xs.prototype.ValueTypeName="string";xs.prototype.ValueBufferType=Array;xs.prototype.DefaultInterpolation=ur;xs.prototype.InterpolantFactoryMethodLinear=void 0;xs.prototype.InterpolantFactoryMethodSmooth=void 0;ui=class extends Xn{constructor(e,t,n,s){super(e,t,n,s)}};ui.prototype.ValueTypeName="vector";jn=class{constructor(e="",t=-1,n=[],s=Ih){this.name=e,this.tracks=n,this.duration=t,this.blendMode=s,this.uuid=li(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,s=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push(Hx(n[a]).scale(s));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,a=n.length;r!==a;++r)t.push(Xn.toJSON(n[r]));return s}static CreateFromMorphTargetSequence(e,t,n,s){let r=t.length,a=[];for(let o=0;o<r;o++){let l=[],c=[];l.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);let h=Fx(l);l=Em(l,1,h),c=Em(c,1,h),!s&&l[0]===0&&(l.push(r),c.push(c[0])),a.push(new _s(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let s=e;n=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<n.length;s++)if(n[s].name===t)return n[s];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let s={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){let c=e[o],h=c.name.match(r);if(h&&h.length>1){let u=h[1],d=s[u];d||(s[u]=d=[]),d.push(c)}}let a=[];for(let o in s)a.push(this.CreateFromMorphTargetSequence(o,s[o],t,n));return a}resetDuration(){let e=this.tracks,t=0;for(let n=0,s=e.length;n!==s;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};Fi={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(Tm(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!Tm(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};va=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],p=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},y0=new va,Vi=class{constructor(e){this.manager=e!==void 0?e:y0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Vi.DEFAULT_MATERIAL_NAME="__DEFAULT";cs={},od=class extends Error{constructor(e,t){super(e),this.response=t}},ya=class extends Vi{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=Fi.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0);return}if(cs[e]!==void 0){cs[e].push({onLoad:t,onProgress:n,onError:s});return}cs[e]=[],cs[e].push({onLoad:t,onProgress:n,onError:s});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Xe("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let h=cs[e],u=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=d?parseInt(d):0,p=f!==0,_=0,g=new ReadableStream({start(m){x();function x(){u.read().then(({done:M,value:b})=>{if(M)m.close();else{_+=b.byteLength;let v=new ProgressEvent("progress",{lengthComputable:p,loaded:_,total:f});for(let S=0,R=h.length;S<R;S++){let y=h[S];y.onProgress&&y.onProgress(v)}m.enqueue(b),x()}},M=>{m.error(M)})}}});return new Response(g)}else throw new od(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{let u=/charset="?([^;"\s]*)"?/i.exec(o),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return c.arrayBuffer().then(p=>f.decode(p))}}}).then(c=>{Fi.add(`file:${e}`,c);let h=cs[e];delete cs[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onLoad&&f.onLoad(c)}}).catch(c=>{let h=cs[e];if(h===void 0)throw this.manager.itemError(e),c;delete cs[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onError&&f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},na=new WeakMap,kc=class extends Vi{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=Fi.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let u=na.get(a);u===void 0&&(u=[],na.set(a,u)),u.push({onLoad:t,onError:s})}return a}let o=ca("img");function l(){h(),t&&t(this);let u=na.get(this)||[];for(let d=0;d<u.length;d++){let f=u[d];f.onLoad&&f.onLoad(this)}na.delete(this),r.manager.itemEnd(e)}function c(u){h(),s&&s(u),Fi.remove(`image:${e}`);let d=na.get(this)||[];for(let f=0;f<d.length;f++){let p=d[f];p.onError&&p.onError(u)}na.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Fi.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}},Wi=class extends Vi{constructor(e){super(e)}load(e,t,n,s){let r=new hn,a=new kc(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},Gs=class extends Xt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ye(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},vs=class extends Gs{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Xt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ye(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Qu=new De,Am=new w,Rm=new w,Ma=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new $(512,512),this.mapType=In,this.map=null,this.mapPass=null,this.matrix=new De,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ma,this._frameExtents=new $(1,1),this._viewportCount=1,this._viewports=[new Lt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Am.setFromMatrixPosition(e.matrixWorld),t.position.copy(Am),Rm.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Rm),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){Qu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Qu,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===la||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Qu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},oc=new w,lc=new Ke,Li=new w,Oo=class extends Xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new De,this.projectionMatrix=new De,this.projectionMatrixInverse=new De,this.coordinateSystem=yi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(oc,lc,Li),Li.x===1&&Li.y===1&&Li.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(oc,lc,Li.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(oc,lc,Li),Li.x===1&&Li.y===1&&Li.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(oc,lc,Li.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Ns=new w,Cm=new $,Pm=new $,Yt=class extends Oo{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=fr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(uo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return fr*2*Math.atan(Math.tan(uo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ns.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ns.x,Ns.y).multiplyScalar(-e/Ns.z),Ns.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ns.x,Ns.y).multiplyScalar(-e/Ns.z)}getViewSize(e,t){return this.getViewBounds(e,Cm,Pm),t.subVectors(Pm,Cm)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(uo*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ld=class extends Ma{constructor(){super(new Yt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=fr*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}},vr=class extends Gs{constructor(e,t,n=0,s=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Xt.DEFAULT_UP),this.updateMatrix(),this.target=new Xt,this.distance=n,this.angle=s,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new ld}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},cd=class extends Ma{constructor(){super(new Yt(90,1,.5,500)),this.isPointLightShadow=!0}},yr=class extends Gs{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new cd}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},qi=class extends Oo{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},hd=class extends Ma{constructor(){super(new qi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},vn=class extends Gs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Xt.DEFAULT_UP),this.updateMatrix(),this.target=new Xt,this.shadow=new hd}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Bo=class extends Gs{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}},ys=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}},ed=new WeakMap,Ho=class extends Vi{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Xe("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Xe("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=Fi.get(`image-bitmap:${e}`);if(a!==void 0){if(r.manager.itemStart(e),a.then){a.then(c=>{ed.has(a)===!0?(s&&s(ed.get(a)),r.manager.itemError(e),r.manager.itemEnd(e)):(t&&t(c),r.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},r.options,{colorSpaceConversion:"none"}))}).then(function(c){return Fi.add(`image-bitmap:${e}`,c),t&&t(c),r.manager.itemEnd(e),c}).catch(function(c){s&&s(c),ed.set(l,c),Fi.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});Fi.add(`image-bitmap:${e}`,l),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},ia=-90,sa=1,Oc=class extends Xt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Yt(ia,sa,e,t);s.layers=this.layers,this.add(s);let r=new Yt(ia,sa,e,t);r.layers=this.layers,this.add(r);let a=new Yt(ia,sa,e,t);a.layers=this.layers,this.add(a);let o=new Yt(ia,sa,e,t);o.layers=this.layers,this.add(o);let l=new Yt(ia,sa,e,t);l.layers=this.layers,this.add(l);let c=new Yt(ia,sa,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===yi)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===la)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Bc=class extends Yt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Mr=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=zx.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};Hc=class{constructor(e,t,n){this.binding=e,this.valueSize=n;let s,r,a;switch(t){case"quaternion":s=this._slerp,r=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":s=this._select,r=this._select,a=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:s=this._lerp,r=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=s,this._mixBufferRegionAdditive=r,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let n=this.buffer,s=this.valueSize,r=e*s+s,a=this.cumulativeWeight;if(a===0){for(let o=0;o!==s;++o)n[r+o]=n[o];a=t}else{a+=t;let o=t/a;this._mixBufferRegion(n,r,0,o,s)}this.cumulativeWeight=a}accumulateAdditive(e){let t=this.buffer,n=this.valueSize,s=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,s,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,n=this.buffer,s=e*t+t,r=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){let l=t*this._origIndex;this._mixBufferRegion(n,s,l,1-r,t)}a>0&&this._mixBufferRegionAdditive(n,s,this._addIndex*t,1,t);for(let l=t,c=t+t;l!==c;++l)if(n[l]!==n[l+t]){o.setValue(n,s);break}}saveOriginalState(){let e=this.binding,t=this.buffer,n=this.valueSize,s=n*this._origIndex;e.getValue(t,s);for(let r=n,a=s;r!==a;++r)t[r]=t[s+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,s,r){if(s>=.5)for(let a=0;a!==r;++a)e[t+a]=e[n+a]}_slerp(e,t,n,s){Ke.slerpFlat(e,t,e,t,e,n,s)}_slerpAdditive(e,t,n,s,r){let a=this._workIndex*r;Ke.multiplyQuaternionsFlat(e,a,e,t,e,n),Ke.slerpFlat(e,t,e,t,e,a,s)}_lerp(e,t,n,s,r){let a=1-s;for(let o=0;o!==r;++o){let l=t+o;e[l]=e[l]*a+e[n+o]*s}}_lerpAdditive(e,t,n,s,r){for(let a=0;a!==r;++a){let o=t+a;e[o]=e[o]+e[n+a]*s}}},Ld="\\[\\]\\.:\\/",Gx=new RegExp("["+Ld+"]","g"),Nd="[^"+Ld+"]",Vx="[^"+Ld.replace("\\.","")+"]",Wx=/((?:WC+[\/:])*)/.source.replace("WC",Nd),qx=/(WCOD+)?/.source.replace("WCOD",Vx),Xx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Nd),jx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Nd),Kx=new RegExp("^"+Wx+qx+Xx+jx+"$"),Yx=["material","materials","bones","map"],ud=class{constructor(e,t,n){let s=n||kt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},kt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Gx,"")}static parseTrackName(e){let t=Kx.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Yx.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Xe("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Qe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Qe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Qe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Qe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Qe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Qe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Qe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;Qe("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Qe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Qe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};kt.Composite=ud;kt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};kt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};kt.prototype.GetterByBindingType=[kt.prototype._getValue_direct,kt.prototype._getValue_array,kt.prototype._getValue_arrayElement,kt.prototype._getValue_toArray];kt.prototype.SetterByBindingTypeAndVersioning=[[kt.prototype._setValue_direct,kt.prototype._setValue_direct_setNeedsUpdate,kt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[kt.prototype._setValue_array,kt.prototype._setValue_array_setNeedsUpdate,kt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[kt.prototype._setValue_arrayElement,kt.prototype._setValue_arrayElement_setNeedsUpdate,kt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[kt.prototype._setValue_fromArray,kt.prototype._setValue_fromArray_setNeedsUpdate,kt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];zc=class{constructor(e,t,n=null,s=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=s;let r=t.tracks,a=r.length,o=new Array(a),l={endingStart:lr,endingEnd:lr};for(let c=0;c!==a;++c){let h=r[c].createInterpolant(null);o[c]=h,h.settings=l}this._interpolantSettings=l,this._interpolants=o,this._propertyBindings=new Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=Ph,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n=!1){if(e.fadeOut(t),this.fadeIn(t),n===!0){let s=this._clip.duration,r=e._clip.duration,a=r/s,o=s/r;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,a,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,n=!1){return e.crossFadeFrom(this,t,n)}stopFading(){let e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){let s=this._mixer,r=s.time,a=this.timeScale,o=this._timeScaleInterpolant;o===null&&(o=s._lendControlInterpolant(),this._timeScaleInterpolant=o);let l=o.parameterPositions,c=o.sampleValues;return l[0]=r,l[1]=r+n,c[0]=e/a,c[1]=t/a,this}stopWarping(){let e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,s){if(!this.enabled){this._updateWeight(e);return}let r=this._startTime;if(r!==null){let l=(e-r)*n;l<0||n===0?t=0:(this._startTime=null,t=n*l)}t*=this._updateTimeScale(e);let a=this._updateTime(t),o=this._updateWeight(e);if(o>0){let l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case e0:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(a),c[h].accumulateAdditive(o);break;case Ih:default:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(a),c[h].accumulate(s,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let n=this._weightInterpolant;if(n!==null){let s=n.evaluate(e)[0];t*=s,e>n.parameterPositions[1]&&(this.stopFading(),s===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let s=n.evaluate(e)[0];t*=s,e>n.parameterPositions[1]&&(t===0?this.paused=!0:(this._restoreTimeScale!==null&&(t=this._restoreTimeScale),this.timeScale=t),this.stopWarping())}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,n=this.loop,s=this.time+e,r=this._loopCount,a=n===Qm;if(e===0)return r===-1?s:a&&(r&1)===1?t-s:s;if(n===Ch){r===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(s>=t)s=t;else if(s<0)s=0;else{this.time=s;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=s,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(r===-1&&(e>=0?(r=0,this._setEndings(!0,this.repetitions===0,a)):this._setEndings(this.repetitions===0,!0,a)),s>=t||s<0){let o=Math.floor(s/t);s-=t*o,r+=Math.abs(o);let l=this.repetitions-r;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,s=e>0?t:0,this.time=s,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(l===1){let c=e<0;this._setEndings(c,!c,a)}else this._setEndings(!1,!1,a);this._loopCount=r,this.time=s,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=r,this.time=s;if(a&&(r&1)===1)return t-s}return s}_setEndings(e,t,n){let s=this._interpolantSettings;n?(s.endingStart=cr,s.endingEnd=cr):(e?s.endingStart=this.zeroSlopeAtStart?cr:lr:s.endingStart=go,t?s.endingEnd=this.zeroSlopeAtEnd?cr:lr:s.endingEnd=go)}_scheduleFading(e,t,n){let s=this._mixer,r=s.time,a=this._weightInterpolant;a===null&&(a=s._lendControlInterpolant(),this._weightInterpolant=a);let o=a.parameterPositions,l=a.sampleValues;return o[0]=r,l[0]=t,o[1]=r+e,l[1]=n,this}},Jx=new Float32Array(1),Vs=class extends ci{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(e,t){let n=e._localRoot||this._root,s=e._clip.tracks,r=s.length,a=e._propertyBindings,o=e._interpolants,l=n.uuid,c=this._bindingsByRootAndName,h=c[l];h===void 0&&(h={},c[l]=h);for(let u=0;u!==r;++u){let d=s[u],f=d.name,p=h[f];if(p!==void 0)++p.referenceCount,a[u]=p;else{if(p=a[u],p!==void 0){p._cacheIndex===null&&(++p.referenceCount,this._addInactiveBinding(p,l,f));continue}let _=t&&t._propertyBindings[u].binding.parsedPath;p=new Hc(kt.create(n,f,_),d.ValueTypeName,d.getValueSize()),++p.referenceCount,this._addInactiveBinding(p,l,f),a[u]=p}o[u].resultBuffer=p.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let n=(e._localRoot||this._root).uuid,s=e._clip.uuid,r=this._actionsByClip[s];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,s,n)}let t=e._propertyBindings;for(let n=0,s=t.length;n!==s;++n){let r=t[n];r.useCount++===0&&(this._lendBinding(r),r.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let n=0,s=t.length;n!==s;++n){let r=t[n];--r.useCount===0&&(r.restoreOriginalState(),this._takeBackBinding(r))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){let s=this._actions,r=this._actionsByClip,a=r[t];if(a===void 0)a={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,r[t]=a;else{let o=a.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=s.length,s.push(e),a.actionByRoot[n]=e}_removeInactiveAction(e){let t=this._actions,n=t[t.length-1],s=e._cacheIndex;n._cacheIndex=s,t[s]=n,t.pop(),e._cacheIndex=null;let r=e._clip.uuid,a=this._actionsByClip,o=a[r],l=o.knownActions,c=l[l.length-1],h=e._byClipCacheIndex;c._byClipCacheIndex=h,l[h]=c,l.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,d=(e._localRoot||this._root).uuid;delete u[d],l.length===0&&delete a[r],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let n=0,s=t.length;n!==s;++n){let r=t[n];--r.referenceCount===0&&this._removeInactiveBinding(r)}}_lendAction(e){let t=this._actions,n=e._cacheIndex,s=this._nActiveActions++,r=t[s];e._cacheIndex=s,t[s]=e,r._cacheIndex=n,t[n]=r}_takeBackAction(e){let t=this._actions,n=e._cacheIndex,s=--this._nActiveActions,r=t[s];e._cacheIndex=s,t[s]=e,r._cacheIndex=n,t[n]=r}_addInactiveBinding(e,t,n){let s=this._bindingsByRootAndName,r=this._bindings,a=s[t];a===void 0&&(a={},s[t]=a),a[n]=e,e._cacheIndex=r.length,r.push(e)}_removeInactiveBinding(e){let t=this._bindings,n=e.binding,s=n.rootNode.uuid,r=n.path,a=this._bindingsByRootAndName,o=a[s],l=t[t.length-1],c=e._cacheIndex;l._cacheIndex=c,t[c]=l,t.pop(),delete o[r],Object.keys(o).length===0&&delete a[s]}_lendBinding(e){let t=this._bindings,n=e._cacheIndex,s=this._nActiveBindings++,r=t[s];e._cacheIndex=s,t[s]=e,r._cacheIndex=n,t[n]=r}_takeBackBinding(e){let t=this._bindings,n=e._cacheIndex,s=--this._nActiveBindings,r=t[s];e._cacheIndex=s,t[s]=e,r._cacheIndex=n,t[n]=r}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,n=e[t];return n===void 0&&(n=new Uo(new Float32Array(2),new Float32Array(2),1,Jx),n.__cacheIndex=t,e[t]=n),n}_takeBackControlInterpolant(e){let t=this._controlInterpolants,n=e.__cacheIndex,s=--this._nActiveControlInterpolants,r=t[s];e.__cacheIndex=s,t[s]=e,r.__cacheIndex=n,t[n]=r}clipAction(e,t,n){let s=t||this._root,r=s.uuid,a=typeof e=="string"?jn.findByName(s,e):e,o=a!==null?a.uuid:e,l=this._actionsByClip[o],c=null;if(n===void 0&&(a!==null?n=a.blendMode:n=Ih),l!==void 0){let u=l.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;c=l.knownActions[0],a===null&&(a=c._clip)}if(a===null)return null;let h=new zc(this,a,t,n);return this._bindAction(h,c),this._addInactiveAction(h,o,r),h}existingAction(e,t){let n=t||this._root,s=n.uuid,r=typeof e=="string"?jn.findByName(n,e):e,a=r?r.uuid:e,o=this._actionsByClip[a];return o!==void 0&&o.actionByRoot[s]||null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;let t=this._actions,n=this._nActiveActions,s=this.time+=e,r=Math.sign(e),a=this._accuIndex^=1;for(let c=0;c!==n;++c)t[c]._update(s,e,r,a);let o=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)o[c].apply(a);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,n=e.uuid,s=this._actionsByClip,r=s[n];if(r!==void 0){let a=r.knownActions;for(let o=0,l=a.length;o!==l;++o){let c=a[o];this._deactivateAction(c);let h=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=h,t[h]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete s[n]}}uncacheRoot(e){let t=e.uuid,n=this._actionsByClip;for(let a in n){let o=n[a].actionByRoot,l=o[t];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}let s=this._bindingsByRootAndName,r=s[t];if(r!==void 0)for(let a in r){let o=r[a];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){let n=this.existingAction(e,t);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}},Im=new De,zo=class{constructor(e,t,n=0,s=1/0){this.ray=new ki(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new da,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Qe("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Im.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Im),this}intersectObject(e,t=!0,n=[]){return dd(e,this,n,t),n.sort(Dm),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)dd(e[s],this,n,t);return n.sort(Dm),n}};Sa=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=ct(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(ct(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}},fd=class i{static{i.prototype.isMatrix2=!0}constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}},Go=class extends ci{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Xe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186")});function V0(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Qx(i){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,o),u.length===0)i.bufferSubData(c,0,h);else{u.sort((f,p)=>f.start-p.start);let d=0;for(let f=1;f<u.length;f++){let p=u[d],_=u[f];_.start<=p.start+p.count+1?p.count=Math.max(p.count,_.start+_.count-p.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,p=u.length;f<p;f++){let _=u[f];i.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}function F1(i,e,t,n,s,r){let a=new ye(0),o=s===!0?0:1,l,c,h=null,u=0,d=null;function f(x){let M=x.isScene===!0?x.background:null;if(M&&M.isTexture){let b=x.backgroundBlurriness>0;M=e.get(M,b)}return M}function p(x){let M=!1,b=f(x);b===null?g(a,o):b&&b.isColor&&(g(b,1),M=!0);let v=i.xr.getEnvironmentBlendMode();v==="additive"?t.buffers.color.setClear(0,0,0,1,r):v==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||M)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function _(x,M){let b=f(M);b&&(b.isCubeTexture||b.mapping===Zo)?(c===void 0&&(c=new at(new At(1,1,1),new Bt({name:"BackgroundCubeMaterial",uniforms:Ar(Ji.backgroundCube.uniforms),vertexShader:Ji.backgroundCube.vertexShader,fragmentShader:Ji.backgroundCube.fragmentShader,side:On,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(v,S,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=b,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(N1.makeRotationFromEuler(M.backgroundRotation)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(W0),c.material.toneMapped=ht.getTransfer(b.colorSpace)!==wt,(h!==b||u!==b.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,h=b,u=b.version,d=i.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null)):b&&b.isTexture&&(l===void 0&&(l=new at(new Mn(2,2),new Bt({name:"BackgroundMaterial",uniforms:Ar(Ji.background.uniforms),vertexShader:Ji.background.vertexShader,fragmentShader:Ji.background.fragmentShader,side:Xi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=b,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=ht.getTransfer(b.colorSpace)!==wt,b.matrixAutoUpdate===!0&&b.updateMatrix(),l.material.uniforms.uvTransform.value.copy(b.matrix),(h!==b||u!==b.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,h=b,u=b.version,d=i.toneMapping),l.layers.enableAll(),x.unshift(l,l.geometry,l.material,0,0,null))}function g(x,M){x.getRGB(Nh,Dd(i)),t.buffers.color.setClear(Nh.r,Nh.g,Nh.b,M,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,M=1){a.set(x),o=M,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(x){o=x,g(a,o)},render:p,addToRenderList:_,dispose:m}}function U1(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(D,F,O,L,k){let G=!1,V=u(D,L,O,F);r!==V&&(r=V,c(r.object)),G=f(D,L,O,k),G&&p(D,L,O,k),k!==null&&e.update(k,i.ELEMENT_ARRAY_BUFFER),(G||a)&&(a=!1,b(D,F,O,L),k!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function l(){return i.createVertexArray()}function c(D){return i.bindVertexArray(D)}function h(D){return i.deleteVertexArray(D)}function u(D,F,O,L){let k=L.wireframe===!0,G=n[F.id];G===void 0&&(G={},n[F.id]=G);let V=D.isInstancedMesh===!0?D.id:0,te=G[V];te===void 0&&(te={},G[V]=te);let N=te[O.id];N===void 0&&(N={},te[O.id]=N);let Z=N[k];return Z===void 0&&(Z=d(l()),N[k]=Z),Z}function d(D){let F=[],O=[],L=[];for(let k=0;k<t;k++)F[k]=0,O[k]=0,L[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:O,attributeDivisors:L,object:D,attributes:{},index:null}}function f(D,F,O,L){let k=r.attributes,G=F.attributes,V=0,te=O.getAttributes();for(let N in te)if(te[N].location>=0){let ie=k[N],be=G[N];if(be===void 0&&(N==="instanceMatrix"&&D.instanceMatrix&&(be=D.instanceMatrix),N==="instanceColor"&&D.instanceColor&&(be=D.instanceColor)),ie===void 0||ie.attribute!==be||be&&ie.data!==be.data)return!0;V++}return r.attributesNum!==V||r.index!==L}function p(D,F,O,L){let k={},G=F.attributes,V=0,te=O.getAttributes();for(let N in te)if(te[N].location>=0){let ie=G[N];ie===void 0&&(N==="instanceMatrix"&&D.instanceMatrix&&(ie=D.instanceMatrix),N==="instanceColor"&&D.instanceColor&&(ie=D.instanceColor));let be={};be.attribute=ie,ie&&ie.data&&(be.data=ie.data),k[N]=be,V++}r.attributes=k,r.attributesNum=V,r.index=L}function _(){let D=r.newAttributes;for(let F=0,O=D.length;F<O;F++)D[F]=0}function g(D){m(D,0)}function m(D,F){let O=r.newAttributes,L=r.enabledAttributes,k=r.attributeDivisors;O[D]=1,L[D]===0&&(i.enableVertexAttribArray(D),L[D]=1),k[D]!==F&&(i.vertexAttribDivisor(D,F),k[D]=F)}function x(){let D=r.newAttributes,F=r.enabledAttributes;for(let O=0,L=F.length;O<L;O++)F[O]!==D[O]&&(i.disableVertexAttribArray(O),F[O]=0)}function M(D,F,O,L,k,G,V){V===!0?i.vertexAttribIPointer(D,F,O,k,G):i.vertexAttribPointer(D,F,O,L,k,G)}function b(D,F,O,L){_();let k=L.attributes,G=O.getAttributes(),V=F.defaultAttributeValues;for(let te in G){let N=G[te];if(N.location>=0){let Z=k[te];if(Z===void 0&&(te==="instanceMatrix"&&D.instanceMatrix&&(Z=D.instanceMatrix),te==="instanceColor"&&D.instanceColor&&(Z=D.instanceColor)),Z!==void 0){let ie=Z.normalized,be=Z.itemSize,me=e.get(Z);if(me===void 0)continue;let Je=me.buffer,We=me.type,we=me.bytesPerElement,q=We===i.INT||We===i.UNSIGNED_INT||Z.gpuType===Xc;if(Z.isInterleavedBufferAttribute){let j=Z.data,Q=j.stride,fe=Z.offset;if(j.isInstancedInterleavedBuffer){for(let ae=0;ae<N.locationSize;ae++)m(N.location+ae,j.meshPerAttribute);D.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let ae=0;ae<N.locationSize;ae++)g(N.location+ae);i.bindBuffer(i.ARRAY_BUFFER,Je);for(let ae=0;ae<N.locationSize;ae++)M(N.location+ae,be/N.locationSize,We,ie,Q*we,(fe+be/N.locationSize*ae)*we,q)}else{if(Z.isInstancedBufferAttribute){for(let j=0;j<N.locationSize;j++)m(N.location+j,Z.meshPerAttribute);D.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let j=0;j<N.locationSize;j++)g(N.location+j);i.bindBuffer(i.ARRAY_BUFFER,Je);for(let j=0;j<N.locationSize;j++)M(N.location+j,be/N.locationSize,We,ie,be*we,be/N.locationSize*j*we,q)}}else if(V!==void 0){let ie=V[te];if(ie!==void 0)switch(ie.length){case 2:i.vertexAttrib2fv(N.location,ie);break;case 3:i.vertexAttrib3fv(N.location,ie);break;case 4:i.vertexAttrib4fv(N.location,ie);break;default:i.vertexAttrib1fv(N.location,ie)}}}}x()}function v(){A();for(let D in n){let F=n[D];for(let O in F){let L=F[O];for(let k in L){let G=L[k];for(let V in G)h(G[V].object),delete G[V];delete L[k]}}delete n[D]}}function S(D){if(n[D.id]===void 0)return;let F=n[D.id];for(let O in F){let L=F[O];for(let k in L){let G=L[k];for(let V in G)h(G[V].object),delete G[V];delete L[k]}}delete n[D.id]}function R(D){for(let F in n){let O=n[F];for(let L in O){let k=O[L];if(k[D.id]===void 0)continue;let G=k[D.id];for(let V in G)h(G[V].object),delete G[V];delete k[D.id]}}}function y(D){for(let F in n){let O=n[F],L=D.isInstancedMesh===!0?D.id:0,k=O[L];if(k!==void 0){for(let G in k){let V=k[G];for(let te in V)h(V[te].object),delete V[te];delete k[G]}delete O[L],Object.keys(O).length===0&&delete n[F]}}}function A(){C(),a=!0,r!==s&&(r=s,c(r.object))}function C(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:C,dispose:v,releaseStatesOfGeometry:S,releaseStatesOfObject:y,releaseStatesOfProgram:R,initAttributes:_,enableAttribute:g,disableUnusedAttributes:x}}function k1(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let f=0;f<h;f++)d+=c[f];t.update(d,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function O1(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(R){return!(R!==Hn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let y=R===Qt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==In&&R!==ii&&!y&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Xe("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&Xe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),x=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),v=i.getParameter(i.MAX_SAMPLES),S=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:p,maxTextureSize:_,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:x,maxVaryings:M,maxFragmentUniforms:b,maxSamples:v,samples:S}}function B1(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Un,o=new it,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let p=u.clippingPlanes,_=u.clipIntersection,g=u.clipShadows,m=i.get(u);if(!s||p===null||p.length===0||r&&!g)r?h(null):c();else{let x=r?0:n,M=x*4,b=m.clippingState||null;l.value=b,b=h(p,d,M,f);for(let v=0;v!==M;++v)b[v]=t[v];m.clippingState=b,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,p){let _=u!==null?u.length:0,g=null;if(_!==0){if(g=l.value,p!==!0||g===null){let m=f+_*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(g===null||g.length<m)&&(g=new Float32Array(m));for(let M=0,b=f;M!==_;++M,b+=4)a.copy(u[M]).applyMatrix4(x,o),a.normal.toArray(g,b),g[b+3]=a.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,g}}function W1(i){let e=[],t=[],n=i,s=i-Pa+1+H1;for(let r=0;r<s;r++){let a=Math.pow(2,n);e.push(a);let o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,d=6,f=3,p=new Float32Array(f*d*u),_=new Float32Array(f*d*u);for(let m=0;m<u;m++){let x=m%3*2/3-1,M=m>2?0:-1,b=[x,M,0,x+2/3,M,0,x+2/3,M+1,0,x,M,0,x+2/3,M+1,0,x,M+1,0];p.set(b,f*d*m);for(let v=0;v<d;v++){let S=h[v*2]*2-1,R=h[v*2+1]*2-1;m===0?Rr.set(1,R,S):m===1?Rr.set(-S,1,-R):m===2?Rr.set(-S,R,1):m===3?Rr.set(-1,R,-S):m===4?Rr.set(-S,-1,R):Rr.set(S,R,-1),Rr.toArray(_,(m*d+v)*f)}}let g=new ot;g.setAttribute("position",new $e(p,f)),g.setAttribute("outputDirection",new $e(_,f)),t.push(new at(g,null)),n>Pa&&n--}return{lodMeshes:t,sizeLods:e}}function S0(i,e,t){let n=new qt(i,e,t);return n.texture.mapping=Zo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ca(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function q1(i,e,t){return new Bt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:G1,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Oh(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:nn,depthTest:!1,depthWrite:!1})}function X1(i,e,t){return new Bt({name:"SphericalGaussianBlur",defines:{SAMPLES:z1,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Oh(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:nn,depthTest:!1,depthWrite:!1})}function E0(){return new Bt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Oh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:nn,depthTest:!1,depthWrite:!1})}function w0(){return new Bt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Oh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:nn,depthTest:!1,depthWrite:!1})}function Oh(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}function j1(i){let e=new WeakMap,t=new WeakMap,n=null;function s(d,f=!1){return d==null?null:f?a(d):r(d)}function r(d){if(d&&d.isTexture){let f=d.mapping;if(f===Vc||f===Wc)if(e.has(d)){let p=e.get(d).texture;return o(p,d.mapping)}else{let p=d.image;if(p&&p.height>0){let _=new kh(p.height);return _.fromEquirectangularTexture(i,d),e.set(d,_),d.addEventListener("dispose",c),o(_.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let f=d.mapping,p=f===Vc||f===Wc,_=f===qs||f===wr;if(p||_){let g=t.get(d),m=g!==void 0?g.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return n===null&&(n=new Uh(i)),g=p?n.fromEquirectangular(d,g):n.fromCubemap(d,g),g.texture.pmremVersion=d.pmremVersion,t.set(d,g),g.texture;if(g!==void 0)return g.texture;{let x=d.image;return p&&x&&x.height>0||_&&x&&l(x)?(n===null&&(n=new Uh(i)),g=p?n.fromEquirectangular(d):n.fromCubemap(d),g.texture.pmremVersion=d.pmremVersion,t.set(d,g),d.addEventListener("dispose",h),g.texture):null}}}return d}function o(d,f){return f===Vc?d.mapping=qs:f===Wc&&(d.mapping=wr),d}function l(d){let f=0,p=6;for(let _=0;_<p;_++)d[_]!==void 0&&f++;return f===p}function c(d){let f=d.target;f.removeEventListener("dispose",c);let p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function h(d){let f=d.target;f.removeEventListener("dispose",h);let p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function u(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:u}}function K1(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&hr("WebGLRenderer: "+n+" extension not supported."),s}}}function Y1(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let p in d.attributes)e.remove(d.attributes[p]);d.removeEventListener("dispose",a),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let f in d)e.update(d[f],i.ARRAY_BUFFER)}function c(u){let d=[],f=u.index,p=u.attributes.position,_=0;if(p===void 0)return;if(f!==null){let x=f.array;_=f.version;for(let M=0,b=x.length;M<b;M+=3){let v=x[M+0],S=x[M+1],R=x[M+2];d.push(v,S,S,R,R,v)}}else{let x=p.array;_=p.version;for(let M=0,b=x.length/3-1;M<b;M+=3){let v=M+0,S=M+1,R=M+2;d.push(v,S,S,R,R,v)}}let g=new(p.count>=65535?yo:vo)(d,1);g.version=_;let m=r.get(u);m&&e.remove(m),r.set(u,g)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function J1(i,e,t){let n;function s(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,d){i.drawElements(n,d,r,u*a),t.update(d,n,1)}function c(u,d,f){f!==0&&(i.drawElementsInstanced(n,d,r,u*a,f),t.update(d,n,f))}function h(u,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,u,0,f);let _=0;for(let g=0;g<f;g++)_+=d[g];t.update(_,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function Z1(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Qe("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function $1(i,e,t){let n=new WeakMap,s=new Lt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(o);if(d===void 0||d.count!==u){let A=function(){R.dispose(),n.delete(o),o.removeEventListener("dispose",A)};d!==void 0&&d.texture.dispose();let f=o.morphAttributes.position!==void 0,p=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],x=o.morphAttributes.color||[],M=0;f===!0&&(M=1),p===!0&&(M=2),_===!0&&(M=3);let b=o.attributes.position.count*M,v=1;b>e.maxTextureSize&&(v=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);let S=new Float32Array(b*v*4*u),R=new xo(S,b,v,u);R.type=ii,R.needsUpdate=!0;let y=M*4;for(let C=0;C<u;C++){let D=g[C],F=m[C],O=x[C],L=b*v*4*C;for(let k=0;k<D.count;k++){let G=k*y;f===!0&&(s.fromBufferAttribute(D,k),S[L+G+0]=s.x,S[L+G+1]=s.y,S[L+G+2]=s.z,S[L+G+3]=0),p===!0&&(s.fromBufferAttribute(F,k),S[L+G+4]=s.x,S[L+G+5]=s.y,S[L+G+6]=s.z,S[L+G+7]=0),_===!0&&(s.fromBufferAttribute(O,k),S[L+G+8]=s.x,S[L+G+9]=s.y,S[L+G+10]=s.z,S[L+G+11]=O.itemSize===4?s.w:1)}}d={count:u,texture:R,size:new $(b,v)},n.set(o,d),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let f=0;for(let _=0;_<c.length;_++)f+=c[_];let p=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",p),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function Q1(i,e,t,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,u=c.geometry,d=e.get(c,u);if(r.get(d)!==h&&(e.update(d),r.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return d}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}function tM(i,e,t,n,s,r){let a=new qt(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new ot;c.setAttribute("position",new Ye([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Ye([0,2,0,0,2,0],2));let h=new xa({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new at(c,h),d=new qi(-1,1,1,-1,0,1),f=null,p=null,_=!1,g,m=null,x=[],M=!1;this.setSize=function(b,v){a.setSize(b,v),o!==null&&o.setSize(b,v),l!==null&&l.setSize(b,v);for(let S=0;S<x.length;S++){let R=x[S];R.setSize&&R.setSize(b,v)}},this.setEffects=function(b){x=b,M=x.length>0&&x[0].isRenderPass===!0;let v=a.width,S=a.height;x.length>0&&o===null&&(o=new qt(v,S,{type:Qt,depthBuffer:!1,stencilBuffer:!1}),l=new qt(v,S,{type:Qt,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<x.length;R++){let y=x[R];y.setSize&&y.setSize(v,S)}},this.begin=function(b,v){if(_||b.toneMapping===Ei&&x.length===0)return!1;if(m=v,v!==null){let S=v.width,R=v.height;(a.width!==S||a.height!==R)&&this.setSize(S,R)}return M===!1&&b.setRenderTarget(a),g=b.toneMapping,b.toneMapping=Ei,!0},this.hasRenderPass=function(){return M},this.end=function(b,v){b.toneMapping=g,_=!0;let S=a,R=o;for(let y=0;y<x.length;y++){let A=x[y];A.enabled!==!1&&(A.render(b,R,S,v),A.needsSwap!==!1&&(S=R,R=R===o?l:o))}if(f!==b.outputColorSpace||p!==b.toneMapping){f=b.outputColorSpace,p=b.toneMapping,h.defines={},ht.getTransfer(f)===wt&&(h.defines.SRGB_TRANSFER="");let y=eM[p];y&&(h.defines[y]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=S.texture,b.setRenderTarget(m),b.render(u,d),m=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}function Da(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=T0[s];if(r===void 0&&(r=new Float32Array(s),T0[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function un(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function dn(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Bh(i,e){let t=A0[e];t===void 0&&(t=new Int32Array(e),A0[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function nM(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function iM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(un(t,e))return;i.uniform2fv(this.addr,e),dn(t,e)}}function sM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(un(t,e))return;i.uniform3fv(this.addr,e),dn(t,e)}}function rM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(un(t,e))return;i.uniform4fv(this.addr,e),dn(t,e)}}function aM(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(un(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),dn(t,e)}else{if(un(t,n))return;P0.set(n),i.uniformMatrix2fv(this.addr,!1,P0),dn(t,n)}}function oM(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(un(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),dn(t,e)}else{if(un(t,n))return;C0.set(n),i.uniformMatrix3fv(this.addr,!1,C0),dn(t,n)}}function lM(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(un(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),dn(t,e)}else{if(un(t,n))return;R0.set(n),i.uniformMatrix4fv(this.addr,!1,R0),dn(t,n)}}function cM(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function hM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(un(t,e))return;i.uniform2iv(this.addr,e),dn(t,e)}}function uM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(un(t,e))return;i.uniform3iv(this.addr,e),dn(t,e)}}function dM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(un(t,e))return;i.uniform4iv(this.addr,e),dn(t,e)}}function fM(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function pM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(un(t,e))return;i.uniform2uiv(this.addr,e),dn(t,e)}}function mM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(un(t,e))return;i.uniform3uiv(this.addr,e),dn(t,e)}}function gM(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(un(t,e))return;i.uniform4uiv(this.addr,e),dn(t,e)}}function bM(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Vd.compareFunction=t.isReversedDepthBuffer()?Lh:Dh,r=Vd):r=q0,t.setTexture2D(e||r,s)}function _M(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||j0,s)}function xM(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||K0,s)}function vM(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||X0,s)}function yM(i){switch(i){case 5126:return nM;case 35664:return iM;case 35665:return sM;case 35666:return rM;case 35674:return aM;case 35675:return oM;case 35676:return lM;case 5124:case 35670:return cM;case 35667:case 35671:return hM;case 35668:case 35672:return uM;case 35669:case 35673:return dM;case 5125:return fM;case 36294:return pM;case 36295:return mM;case 36296:return gM;case 35678:case 36198:case 36298:case 36306:case 35682:return bM;case 35679:case 36299:case 36307:return _M;case 35680:case 36300:case 36308:case 36293:return xM;case 36289:case 36303:case 36311:case 36292:return vM}}function MM(i,e){i.uniform1fv(this.addr,e)}function SM(i,e){let t=Da(e,this.size,2);i.uniform2fv(this.addr,t)}function EM(i,e){let t=Da(e,this.size,3);i.uniform3fv(this.addr,t)}function wM(i,e){let t=Da(e,this.size,4);i.uniform4fv(this.addr,t)}function TM(i,e){let t=Da(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function AM(i,e){let t=Da(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function RM(i,e){let t=Da(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function CM(i,e){i.uniform1iv(this.addr,e)}function PM(i,e){i.uniform2iv(this.addr,e)}function IM(i,e){i.uniform3iv(this.addr,e)}function DM(i,e){i.uniform4iv(this.addr,e)}function LM(i,e){i.uniform1uiv(this.addr,e)}function NM(i,e){i.uniform2uiv(this.addr,e)}function FM(i,e){i.uniform3uiv(this.addr,e)}function UM(i,e){i.uniform4uiv(this.addr,e)}function kM(i,e,t){let n=this.cache,s=e.length,r=Bh(t,s);un(n,r)||(i.uniform1iv(this.addr,r),dn(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=Vd:a=q0;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function OM(i,e,t){let n=this.cache,s=e.length,r=Bh(t,s);un(n,r)||(i.uniform1iv(this.addr,r),dn(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||j0,r[a])}function BM(i,e,t){let n=this.cache,s=e.length,r=Bh(t,s);un(n,r)||(i.uniform1iv(this.addr,r),dn(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||K0,r[a])}function HM(i,e,t){let n=this.cache,s=e.length,r=Bh(t,s);un(n,r)||(i.uniform1iv(this.addr,r),dn(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||X0,r[a])}function zM(i){switch(i){case 5126:return MM;case 35664:return SM;case 35665:return EM;case 35666:return wM;case 35674:return TM;case 35675:return AM;case 35676:return RM;case 5124:case 35670:return CM;case 35667:case 35671:return PM;case 35668:case 35672:return IM;case 35669:case 35673:return DM;case 5125:return LM;case 36294:return NM;case 36295:return FM;case 36296:return UM;case 35678:case 36198:case 36298:case 36306:case 35682:return kM;case 35679:case 36299:case 36307:return OM;case 35680:case 36300:case 36308:case 36293:return BM;case 36289:case 36303:case 36311:case 36292:return HM}}function I0(i,e){i.seq.push(e),i.map[e.id]=e}function GM(i,e,t){let n=i.name,s=n.length;for(zd.lastIndex=0;;){let r=zd.exec(n),a=zd.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){I0(t,c===void 0?new Wd(o,i,e):new qd(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new Xd(o),I0(t,u)),t=u}}}function D0(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}function qM(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}function XM(i){ht._getMatrix(L0,ht.workingColorSpace,i);let e=`mat3( ${L0.elements.map(t=>t.toFixed(4))} )`;switch(ht.getTransfer(i)){case bo:return[e,"LinearTransferOETF"];case wt:return[e,"sRGBTransferOETF"];default:return Xe("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function N0(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+qM(i.getShaderSource(e),o)}else return r}function jM(i,e){let t=XM(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function YM(i,e){let t=KM[e];return t===void 0?(Xe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function JM(){ht.getLuminanceCoefficients(Fh);let i=Fh.x.toFixed(4),e=Fh.y.toFixed(4),t=Fh.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ZM(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ll).join(`
`)}function $M(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function QM(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function ll(i){return i!==""}function F0(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function U0(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}function jd(i){return i.replace(eS,nS)}function nS(i,e){let t=dt[e];if(t===void 0){let n=tS.get(e);if(n!==void 0)t=dt[n],Xe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return jd(t)}function k0(i){return i.replace(iS,sS)}function sS(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function O0(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function aS(i){return rS[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}function lS(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":oS[i.envMapMode]||"ENVMAP_TYPE_CUBE"}function hS(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":cS[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}function dS(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":uS[i.combine]||"ENVMAP_BLENDING_NONE"}function fS(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function pS(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=aS(t),c=lS(t),h=hS(t),u=dS(t),d=fS(t),f=ZM(t),p=$M(r),_=s.createProgram(),g,m,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(ll).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(ll).join(`
`),m.length>0&&(m+=`
`)):(g=[O0(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ll).join(`
`),m=[O0(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ei?"#define TONE_MAPPING":"",t.toneMapping!==Ei?dt.tonemapping_pars_fragment:"",t.toneMapping!==Ei?YM("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",dt.colorspace_pars_fragment,jM("linearToOutputTexel",t.outputColorSpace),JM(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ll).join(`
`)),a=jd(a),a=F0(a,t),a=U0(a,t),o=jd(o),o=F0(o,t),o=U0(o,t),a=k0(a),o=k0(o),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",t.glslVersion===Cd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Cd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let M=x+g+a,b=x+m+o,v=D0(s,s.VERTEX_SHADER,M),S=D0(s,s.FRAGMENT_SHADER,b);s.attachShader(_,v),s.attachShader(_,S),t.index0AttributeName!==void 0?s.bindAttribLocation(_,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function R(D){if(i.debug.checkShaderErrors){let F=s.getProgramInfoLog(_)||"",O=s.getShaderInfoLog(v)||"",L=s.getShaderInfoLog(S)||"",k=F.trim(),G=O.trim(),V=L.trim(),te=!0,N=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(te=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,v,S);else{let Z=N0(s,v,"vertex"),ie=N0(s,S,"fragment");Qe("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+k+`
`+Z+`
`+ie)}else k!==""?Xe("WebGLProgram: Program Info Log:",k):(G===""||V==="")&&(N=!1);N&&(D.diagnostics={runnable:te,programLog:k,vertexShader:{log:G,prefix:g},fragmentShader:{log:V,prefix:m}})}s.deleteShader(v),s.deleteShader(S),y=new Ia(s,_),A=QM(s,_)}let y;this.getUniforms=function(){return y===void 0&&R(this),y};let A;this.getAttributes=function(){return A===void 0&&R(this),A};let C=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return C===!1&&(C=s.getProgramParameter(_,VM)),C},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=WM++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=v,this.fragmentShader=S,this}function gS(i){return i===js||i===nl||i===il}function bS(i,e,t,n,s,r){let a=new da,o=new Kd,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer,d=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(y){return l.add(y),y===0?"uv":`uv${y}`}function _(y,A,C,D,F,O){let L=D.fog,k=F.geometry,G=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?D.environment:null,V=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,te=e.get(y.envMap||G,V),N=te&&te.mapping===Zo?te.image.height:null,Z=f[y.type];y.precision!==null&&(d=n.getMaxPrecision(y.precision),d!==y.precision&&Xe("WebGLProgram.getParameters:",y.precision,"not supported, using",d,"instead."));let ie=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,be=ie!==void 0?ie.length:0,me=0;k.morphAttributes.position!==void 0&&(me=1),k.morphAttributes.normal!==void 0&&(me=2),k.morphAttributes.color!==void 0&&(me=3);let Je,We,we,q;if(Z){let Rt=Ji[Z];Je=Rt.vertexShader,We=Rt.fragmentShader}else{Je=y.vertexShader,We=y.fragmentShader;let Rt=o.getVertexShaderStage(y),vt=o.getFragmentShaderStage(y);o.update(y,Rt,vt),we=Rt.id,q=vt.id}let j=i.getRenderTarget(),Q=i.state.buffers.depth.getReversed(),fe=F.isInstancedMesh===!0,ae=F.isBatchedMesh===!0,ge=!!y.map,et=!!y.matcap,X=!!te,J=!!y.aoMap,ce=!!y.lightMap,he=!!y.bumpMap&&y.wireframe===!1,de=!!y.normalMap,Te=!!y.displacementMap,Pe=!!y.emissiveMap,je=!!y.metalnessMap,Oe=!!y.roughnessMap,U=y.anisotropy>0,lt=y.clearcoat>0,rt=y.dispersion>0,I=y.retroreflectivity>0,E=y.iridescence>0,z=y.sheen>0,W=y.transmission>0,ne=U&&!!y.anisotropyMap,pe=lt&&!!y.clearcoatMap,_e=lt&&!!y.clearcoatNormalMap,se=lt&&!!y.clearcoatRoughnessMap,le=E&&!!y.iridescenceMap,Me=E&&!!y.iridescenceThicknessMap,Be=z&&!!y.sheenColorMap,ve=z&&!!y.sheenRoughnessMap,xe=!!y.specularMap,Ne=!!y.specularColorMap,Ge=!!y.specularIntensityMap,Ze=W&&!!y.transmissionMap,H=W&&!!y.thicknessMap,Se=!!y.gradientMap,oe=!!y.alphaMap,Ee=y.alphaTest>0,Ae=!!y.alphaHash,ue=!!y.extensions,Ve=Ei;y.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Ve=i.toneMapping);let ke={shaderID:Z,shaderType:y.type,shaderName:y.name,vertexShader:Je,fragmentShader:We,defines:y.defines,customVertexShaderID:we,customFragmentShaderID:q,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:d,batching:ae,batchingColor:ae&&F._colorsTexture!==null,instancing:fe,instancingColor:fe&&F.instanceColor!==null,instancingMorph:fe&&F.morphTexture!==null,outputColorSpace:j===null?i.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:ht.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:ge,matcap:et,envMap:X,envMapMode:X&&te.mapping,envMapCubeUVHeight:N,aoMap:J,lightMap:ce,bumpMap:he,normalMap:de,displacementMap:Te,emissiveMap:Pe,normalMapObjectSpace:de&&y.normalMapType===n0,normalMapTangentSpace:de&&y.normalMapType===rl,packedNormalMap:de&&y.normalMapType===rl&&gS(y.normalMap.format),metalnessMap:je,roughnessMap:Oe,anisotropy:U,anisotropyMap:ne,clearcoat:lt,clearcoatMap:pe,clearcoatNormalMap:_e,clearcoatRoughnessMap:se,dispersion:rt,retroreflection:I,iridescence:E,iridescenceMap:le,iridescenceThicknessMap:Me,sheen:z,sheenColorMap:Be,sheenRoughnessMap:ve,specularMap:xe,specularColorMap:Ne,specularIntensityMap:Ge,transmission:W,transmissionMap:Ze,thicknessMap:H,gradientMap:Se,opaque:y.transparent===!1&&y.blending===wa&&y.alphaToCoverage===!1,alphaMap:oe,alphaTest:Ee,alphaHash:Ae,combine:y.combine,mapUv:ge&&p(y.map.channel),aoMapUv:J&&p(y.aoMap.channel),lightMapUv:ce&&p(y.lightMap.channel),bumpMapUv:he&&p(y.bumpMap.channel),normalMapUv:de&&p(y.normalMap.channel),displacementMapUv:Te&&p(y.displacementMap.channel),emissiveMapUv:Pe&&p(y.emissiveMap.channel),metalnessMapUv:je&&p(y.metalnessMap.channel),roughnessMapUv:Oe&&p(y.roughnessMap.channel),anisotropyMapUv:ne&&p(y.anisotropyMap.channel),clearcoatMapUv:pe&&p(y.clearcoatMap.channel),clearcoatNormalMapUv:_e&&p(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:se&&p(y.clearcoatRoughnessMap.channel),iridescenceMapUv:le&&p(y.iridescenceMap.channel),iridescenceThicknessMapUv:Me&&p(y.iridescenceThicknessMap.channel),sheenColorMapUv:Be&&p(y.sheenColorMap.channel),sheenRoughnessMapUv:ve&&p(y.sheenRoughnessMap.channel),specularMapUv:xe&&p(y.specularMap.channel),specularColorMapUv:Ne&&p(y.specularColorMap.channel),specularIntensityMapUv:Ge&&p(y.specularIntensityMap.channel),transmissionMapUv:Ze&&p(y.transmissionMap.channel),thicknessMapUv:H&&p(y.thicknessMap.channel),alphaMapUv:oe&&p(y.alphaMap.channel),vertexTangents:!!k.attributes.tangent&&(de||U),vertexNormals:!!k.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!k.attributes.uv&&(ge||oe),fog:!!L,useFog:y.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||k.attributes.normal===void 0&&de===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Q,skinning:F.isSkinnedMesh===!0,hasPositionAttribute:k.attributes.position!==void 0,morphTargets:k.morphAttributes.position!==void 0,morphNormals:k.morphAttributes.normal!==void 0,morphColors:k.morphAttributes.color!==void 0,morphTargetsCount:be,morphTextureStride:me,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:O.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&C.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ve,decodeVideoTexture:ge&&y.map.isVideoTexture===!0&&ht.getTransfer(y.map.colorSpace)===wt,decodeVideoTextureEmissive:Pe&&y.emissiveMap.isVideoTexture===!0&&ht.getTransfer(y.emissiveMap.colorSpace)===wt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Pn,flipSided:y.side===On,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:ue&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ue&&y.extensions.multiDraw===!0||ae)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return ke.vertexUv1s=l.has(1),ke.vertexUv2s=l.has(2),ke.vertexUv3s=l.has(3),l.clear(),ke}function g(y){let A=[];if(y.shaderID?A.push(y.shaderID):(A.push(y.customVertexShaderID),A.push(y.customFragmentShaderID)),y.defines!==void 0)for(let C in y.defines)A.push(C),A.push(y.defines[C]);return y.isRawShaderMaterial===!1&&(m(A,y),x(A,y),A.push(i.outputColorSpace)),A.push(y.customProgramCacheKey),A.join()}function m(y,A){y.push(A.precision),y.push(A.outputColorSpace),y.push(A.envMapMode),y.push(A.envMapCubeUVHeight),y.push(A.mapUv),y.push(A.alphaMapUv),y.push(A.lightMapUv),y.push(A.aoMapUv),y.push(A.bumpMapUv),y.push(A.normalMapUv),y.push(A.displacementMapUv),y.push(A.emissiveMapUv),y.push(A.metalnessMapUv),y.push(A.roughnessMapUv),y.push(A.anisotropyMapUv),y.push(A.clearcoatMapUv),y.push(A.clearcoatNormalMapUv),y.push(A.clearcoatRoughnessMapUv),y.push(A.iridescenceMapUv),y.push(A.iridescenceThicknessMapUv),y.push(A.sheenColorMapUv),y.push(A.sheenRoughnessMapUv),y.push(A.specularMapUv),y.push(A.specularColorMapUv),y.push(A.specularIntensityMapUv),y.push(A.transmissionMapUv),y.push(A.thicknessMapUv),y.push(A.combine),y.push(A.fogExp2),y.push(A.sizeAttenuation),y.push(A.morphTargetsCount),y.push(A.morphAttributeCount),y.push(A.numSunLights),y.push(A.numDirLights),y.push(A.numPointLights),y.push(A.numSpotLights),y.push(A.numSpotLightMaps),y.push(A.numHemiLights),y.push(A.numRectAreaLights),y.push(A.numSunLightShadows),y.push(A.numDirLightShadows),y.push(A.numPointLightShadows),y.push(A.numSpotLightShadows),y.push(A.numSpotLightShadowsWithMaps),y.push(A.numLightProbes),y.push(A.shadowMapType),y.push(A.toneMapping),y.push(A.numClippingPlanes),y.push(A.numClipIntersection),y.push(A.depthPacking)}function x(y,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),y.push(a.mask)}function M(y){let A=f[y.type],C;if(A){let D=Ji[A];C=zn.clone(D.uniforms)}else C=y.uniforms;return C}function b(y,A){let C=h.get(A);return C!==void 0?++C.usedTimes:(C=new pS(i,A,y,s),c.push(C),h.set(A,C)),C}function v(y){if(--y.usedTimes===0){let A=c.indexOf(y);c[A]=c[c.length-1],c.pop(),h.delete(y.cacheKey),y.destroy()}}function S(y){o.remove(y)}function R(){o.dispose()}return{getParameters:_,getProgramCacheKey:g,getUniforms:M,acquireProgram:b,releaseProgram:v,releaseShaderCache:S,programs:c,dispose:R}}function _S(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function xS(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function B0(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function H0(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function o(d,f,p,_,g,m){let x=i[e];return x===void 0?(x={id:d.id,object:d,geometry:f,material:p,materialVariant:a(d),groupOrder:_,renderOrder:d.renderOrder,z:g,group:m},i[e]=x):(x.id=d.id,x.object=d,x.geometry=f,x.material=p,x.materialVariant=a(d),x.groupOrder=_,x.renderOrder=d.renderOrder,x.z=g,x.group=m),e++,x}function l(d,f,p,_,g,m,x){x.reversedDepth===!0&&(g=-g);let M=o(d,f,p,_,g,m);p.transmission>0?n.push(M):p.transparent===!0?s.push(M):t.push(M)}function c(d,f,p,_,g,m){let x=o(d,f,p,_,g,m);p.transmission>0?n.unshift(x):p.transparent===!0?s.unshift(x):t.unshift(x)}function h(d,f){t.length>1&&t.sort(d||xS),n.length>1&&n.sort(f||B0),s.length>1&&s.sort(f||B0)}function u(){for(let d=e,f=i.length;d<f;d++){let p=i[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:u,sort:h}}function vS(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new H0,i.set(n,[a])):s>=r.length?(a=new H0,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function yS(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new w,color:new ye};break;case"SpotLight":t={position:new w,direction:new w,color:new ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new w,color:new ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new w,skyColor:new ye,groundColor:new ye};break;case"RectAreaLight":t={color:new ye,position:new w,halfWidth:new w,halfHeight:new w};break}return i[e.id]=t,t}}}function MS(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}function ES(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function wS(i){let e=new yS,t=MS(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new w);let s=new w,r=new De,a=new De;function o(c){let h=0,u=0,d=0;for(let F=0;F<9;F++)n.probe[F].set(0,0,0);let f=0,p=0,_=0,g=0,m=0,x=0,M=0,b=0,v=0,S=0,R=0,y=0,A=0,C=0;c.sort(ES);for(let F=0,O=c.length;F<O;F++){let L=c[F],k=L.color,G=L.intensity,V=L.distance,te=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===js?te=L.shadow.map.texture:te=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)h+=k.r*G,u+=k.g*G,d+=k.b*G;else if(L.isLightProbe){for(let N=0;N<9;N++)n.probe[N].addScaledVector(L.sh.coefficients[N],G);C++}else if(L.isSunLight){let N=e.get(L);if(N.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let Z=L.shadow,ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize.copy(Z.mapSize).multiply(Z.getFrameExtents()),n.sunShadow[p]=ie,n.sunShadowMap[p]=te;let be=Z.getViewportCount();for(let me=0;me<be;me++)n.sunShadowMatrix[_+me]=Z.getMatrix(me),n.sunShadowCascade[_+me]=Z._cascadeData[me];_+=be,p++}n.sun[f]=N,f++}else if(L.isDirectionalLight){let N=e.get(L);if(N.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let Z=L.shadow,ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize=Z.mapSize,n.directionalShadow[g]=ie,n.directionalShadowMap[g]=te,n.directionalShadowMatrix[g]=L.shadow.matrix,v++}n.directional[g]=N,g++}else if(L.isSpotLight){let N=e.get(L);N.position.setFromMatrixPosition(L.matrixWorld),N.color.copy(k).multiplyScalar(G),N.distance=V,N.coneCos=Math.cos(L.angle),N.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),N.decay=L.decay,n.spot[x]=N;let Z=L.shadow;if(L.map&&(n.spotLightMap[y]=L.map,y++,Z.updateMatrices(L),L.castShadow&&A++),n.spotLightMatrix[x]=Z.matrix,L.castShadow){let ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize=Z.mapSize,n.spotShadow[x]=ie,n.spotShadowMap[x]=te,R++}x++}else if(L.isRectAreaLight){let N=e.get(L);N.color.copy(k).multiplyScalar(G),N.halfWidth.set(L.width*.5,0,0),N.halfHeight.set(0,L.height*.5,0),n.rectArea[M]=N,M++}else if(L.isPointLight){let N=e.get(L);if(N.color.copy(L.color).multiplyScalar(L.intensity),N.distance=L.distance,N.decay=L.decay,L.castShadow){let Z=L.shadow,ie=t.get(L);ie.shadowIntensity=Z.intensity,ie.shadowBias=Z.bias,ie.shadowNormalBias=Z.normalBias,ie.shadowRadius=Z.radius,ie.shadowMapSize=Z.mapSize,ie.shadowCameraNear=Z.camera.near,ie.shadowCameraFar=Z.camera.far,n.pointShadow[m]=ie,n.pointShadowMap[m]=te,n.pointShadowMatrix[m]=L.shadow.matrix,S++}n.point[m]=N,m++}else if(L.isHemisphereLight){let N=e.get(L);N.skyColor.copy(L.color).multiplyScalar(G),N.groundColor.copy(L.groundColor).multiplyScalar(G),n.hemi[b]=N,b++}}M>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Ce.LTC_FLOAT_1,n.rectAreaLTC2=Ce.LTC_FLOAT_2):(n.rectAreaLTC1=Ce.LTC_HALF_1,n.rectAreaLTC2=Ce.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let D=n.hash;(D.sunLength!==f||D.directionalLength!==g||D.pointLength!==m||D.spotLength!==x||D.rectAreaLength!==M||D.hemiLength!==b||D.numSunShadows!==p||D.numDirectionalShadows!==v||D.numPointShadows!==S||D.numSpotShadows!==R||D.numSpotMaps!==y||D.numLightProbes!==C)&&(n.sun.length=f,n.directional.length=g,n.spot.length=x,n.rectArea.length=M,n.point.length=m,n.hemi.length=b,n.sunShadow.length=p,n.sunShadowMap.length=p,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=v,n.directionalShadowMap.length=v,n.directionalShadowMatrix.length=v,n.pointShadow.length=S,n.pointShadowMap.length=S,n.pointShadowMatrix.length=S,n.spotShadow.length=R,n.spotShadowMap.length=R,n.spotLightMatrix.length=R+y-A,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=C,D.sunLength=f,D.directionalLength=g,D.pointLength=m,D.spotLength=x,D.rectAreaLength=M,D.hemiLength=b,D.numSunShadows=p,D.numDirectionalShadows=v,D.numPointShadows=S,D.numSpotShadows=R,D.numSpotMaps=y,D.numLightProbes=C,n.version=SS++)}function l(c,h){let u=0,d=0,f=0,p=0,_=0,g=0,m=h.matrixWorldInverse;for(let x=0,M=c.length;x<M;x++){let b=c[x];if(b.isSunLight){let v=n.sun[u];v.direction.setFromMatrixPosition(b.matrixWorld),v.direction.transformDirection(m),u++}else if(b.isDirectionalLight){let v=n.directional[d];v.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),d++}else if(b.isSpotLight){let v=n.spot[p];v.position.setFromMatrixPosition(b.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),p++}else if(b.isRectAreaLight){let v=n.rectArea[_];v.position.setFromMatrixPosition(b.matrixWorld),v.position.applyMatrix4(m),a.identity(),r.copy(b.matrixWorld),r.premultiply(m),a.extractRotation(r),v.halfWidth.set(b.width*.5,0,0),v.halfHeight.set(0,b.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),_++}else if(b.isPointLight){let v=n.point[f];v.position.setFromMatrixPosition(b.matrixWorld),v.position.applyMatrix4(m),f++}else if(b.isHemisphereLight){let v=n.hemi[g];v.direction.setFromMatrixPosition(b.matrixWorld),v.direction.transformDirection(m),g++}}}return{setup:o,setupView:l,state:n}}function z0(i){let e=new wS(i),t=[],n=[],s=[];function r(d){u.camera=d,t.length=0,n.length=0,s.length=0}function a(d){t.push(d)}function o(d){n.push(d)}function l(d){s.push(d)}function c(){e.setup(t)}function h(d){e.setupView(t,d)}let u={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function TS(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new z0(i),e.set(s,[o])):r>=a.length?(o=new z0(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}function IS(i,e,t){let n=new ma,s=new $,r=new $,a=new Lt,o=new Ic,l=new Dc,c={},h=t.maxTextureSize,u={[Xi]:On,[On]:Xi,[Pn]:Pn},d=new Bt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new $},radius:{value:4}},vertexShader:AS,fragmentShader:RS}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let p=new ot;p.setAttribute("position",new $e(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new at(p,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Sr;let m=this.type;this.render=function(S,R,y){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||S.length===0)return;this.type===Fm&&(Xe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Sr);let A=i.getRenderTarget(),C=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),F=i.state;F.setBlending(nn),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let O=m!==this.type;O&&R.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(k=>k.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,k=S.length;L<k;L++){let G=S[L],V=G.shadow;if(V===void 0){Xe("WebGLShadowMap:",G,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);let te=V.getFrameExtents();s.multiply(te),r.copy(V.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/te.x),s.x=r.x*te.x,V.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/te.y),s.y=r.y*te.y,V.mapSize.y=r.y));let N=i.state.buffers.depth.getReversed();if(V.camera._reversedDepth=N,V.map===null||O===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===Ea){if(G.isPointLight){Xe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new qt(s.x,s.y,{format:js,type:Qt,minFilter:tn,magFilter:tn,generateMipmaps:!1}),V.map.texture.name=G.name+".shadowMap",V.map.depthTexture=new Hi(s.x,s.y,ii),V.map.depthTexture.name=G.name+".shadowMapDepth",V.map.depthTexture.format=Ui,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=jt,V.map.depthTexture.magFilter=jt}else G.isPointLight?(V.map=new kh(s.x),V.map.depthTexture=new Ec(s.x,Ti)):(V.map=new qt(s.x,s.y),V.map.depthTexture=new Hi(s.x,s.y,Ti)),V.map.depthTexture.name=G.name+".shadowMap",V.map.depthTexture.format=Ui,this.type===Sr?(V.map.depthTexture.compareFunction=N?Lh:Dh,V.map.depthTexture.minFilter=tn,V.map.depthTexture.magFilter=tn):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=jt,V.map.depthTexture.magFilter=jt);V.camera.updateProjectionMatrix()}V.map.isWebGLCubeRenderTarget!==!0&&(V.map.width!==s.x||V.map.height!==s.y)&&V.map.setSize(s.x,s.y);let Z=V.map.isWebGLCubeRenderTarget?6:V.getViewportCount();G.isPointLight!==!0&&V.updateMatrices(G,y);for(let ie=0;ie<Z;ie++){let be=V.getCamera(ie);if(G.isPointLight){let me=V.camera,Je=V.matrix,We=G.distance||me.far;We!==me.far&&(me.far=We,me.updateProjectionMatrix()),ol.setFromMatrixPosition(G.matrixWorld),me.position.copy(ol),Gd.copy(me.position),Gd.add(CS[ie]),me.up.copy(PS[ie]),me.lookAt(Gd),me.updateMatrixWorld(),Je.makeTranslation(-ol.x,-ol.y,-ol.z),G0.multiplyMatrices(me.projectionMatrix,me.matrixWorldInverse),V._frustum.setFromProjectionMatrix(G0,me.coordinateSystem,me.reversedDepth)}if(V.map.isWebGLCubeRenderTarget)i.setRenderTarget(V.map,ie),i.clear();else{ie===0&&(i.setRenderTarget(V.map),i.clear());let me=V.getViewport(ie);a.set(r.x*me.x,r.y*me.y,r.x*me.z,r.y*me.w),F.viewport(a)}n=V.getFrustum(ie),b(R,y,be,G,this.type)}V.isPointLightShadow!==!0&&this.type===Ea&&x(V,y),V.needsUpdate=!1}m=this.type,g.needsUpdate=!1,i.setRenderTarget(A,C,D)};function x(S,R){let y=e.update(_);d.defines.VSM_SAMPLES!==S.blurSamples&&(d.defines.VSM_SAMPLES=S.blurSamples,f.defines.VSM_SAMPLES=S.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),S.mapPass===null?S.mapPass=new qt(s.x,s.y,{format:js,type:Qt}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),d.uniforms.shadow_pass.value=S.map.depthTexture,d.uniforms.resolution.value.set(S.map.width,S.map.height),d.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(R,null,y,d,_,null),f.uniforms.shadow_pass.value=S.mapPass.texture,f.uniforms.resolution.value.set(S.map.width,S.map.height),f.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(R,null,y,f,_,null)}function M(S,R,y,A){let C=null,D=y.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(D!==void 0)C=D;else if(C=y.isPointLight===!0?l:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let F=C.uuid,O=R.uuid,L=c[F];L===void 0&&(L={},c[F]=L);let k=L[O];k===void 0&&(k=C.clone(),L[O]=k,R.addEventListener("dispose",v)),C=k}if(C.visible=R.visible,C.wireframe=R.wireframe,A===Ea?C.side=R.shadowSide!==null?R.shadowSide:R.side:C.side=R.shadowSide!==null?R.shadowSide:u[R.side],C.alphaMap=R.alphaMap,C.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,C.map=R.map,C.clipShadows=R.clipShadows,C.clippingPlanes=R.clippingPlanes,C.clipIntersection=R.clipIntersection,C.displacementMap=R.displacementMap,C.displacementScale=R.displacementScale,C.displacementBias=R.displacementBias,C.wireframeLinewidth=R.wireframeLinewidth,C.linewidth=R.linewidth,y.isPointLight===!0&&C.isMeshDistanceMaterial===!0){let F=i.properties.get(C);F.light=y}return C}function b(S,R,y,A,C){if(S.visible===!1)return;if(S.layers.test(R.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&C===Ea)&&(!S.frustumCulled||S.intersectsFrustum(n))){S.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,S.matrixWorld);let O=e.update(S),L=S.material;if(Array.isArray(L)){let k=O.groups;for(let G=0,V=k.length;G<V;G++){let te=k[G],N=L[te.materialIndex];if(N&&N.visible){let Z=M(S,N,A,C);S.onBeforeShadow(i,S,R,y,O,Z,te),i.renderBufferDirect(y,null,O,Z,S,te),S.onAfterShadow(i,S,R,y,O,Z,te)}}}else if(L.visible){let k=M(S,L,A,C);S.onBeforeShadow(i,S,R,y,O,k,null),i.renderBufferDirect(y,null,O,k,S,null),S.onAfterShadow(i,S,R,y,O,k,null)}}let F=S.children;for(let O=0,L=F.length;O<L;O++)b(F[O],R,y,A,C)}function v(S){S.target.removeEventListener("dispose",v);for(let y in c){let A=c[y],C=S.target.uuid;C in A&&(A[C].dispose(),delete A[C])}}}function DS(i,e){function t(){let H=!1,Se=new Lt,oe=null,Ee=new Lt(0,0,0,0);return{setMask:function(Ae){oe!==Ae&&!H&&(i.colorMask(Ae,Ae,Ae,Ae),oe=Ae)},setLocked:function(Ae){H=Ae},setClear:function(Ae,ue,Ve,ke,Rt){Rt===!0&&(Ae*=ke,ue*=ke,Ve*=ke),Se.set(Ae,ue,Ve,ke),Ee.equals(Se)===!1&&(i.clearColor(Ae,ue,Ve,ke),Ee.copy(Se))},reset:function(){H=!1,oe=null,Ee.set(-1,0,0,0)}}}function n(){let H=!1,Se=!1,oe=null,Ee=null,Ae=null;return{setReversed:function(ue){if(Se!==ue){let Ve=e.get("EXT_clip_control");ue?Ve.clipControlEXT(Ve.LOWER_LEFT_EXT,Ve.ZERO_TO_ONE_EXT):Ve.clipControlEXT(Ve.LOWER_LEFT_EXT,Ve.NEGATIVE_ONE_TO_ONE_EXT),Se=ue;let ke=Ae;Ae=null,this.setClear(ke)}},getReversed:function(){return Se},setTest:function(ue){ue?j(i.DEPTH_TEST):Q(i.DEPTH_TEST)},setMask:function(ue){oe!==ue&&!H&&(i.depthMask(ue),oe=ue)},setFunc:function(ue){if(Se&&(ue=f0[ue]),Ee!==ue){switch(ue){case dc:i.depthFunc(i.NEVER);break;case fc:i.depthFunc(i.ALWAYS);break;case pc:i.depthFunc(i.LESS);break;case aa:i.depthFunc(i.LEQUAL);break;case mc:i.depthFunc(i.EQUAL);break;case gc:i.depthFunc(i.GEQUAL);break;case bc:i.depthFunc(i.GREATER);break;case _c:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Ee=ue}},setLocked:function(ue){H=ue},setClear:function(ue){Ae!==ue&&(Ae=ue,Se&&(ue=1-ue),i.clearDepth(ue))},reset:function(){H=!1,oe=null,Ee=null,Ae=null,Se=!1}}}function s(){let H=!1,Se=null,oe=null,Ee=null,Ae=null,ue=null,Ve=null,ke=null,Rt=null;return{setTest:function(vt){H||(vt?j(i.STENCIL_TEST):Q(i.STENCIL_TEST))},setMask:function(vt){Se!==vt&&!H&&(i.stencilMask(vt),Se=vt)},setFunc:function(vt,Zn,$n){(oe!==vt||Ee!==Zn||Ae!==$n)&&(i.stencilFunc(vt,Zn,$n),oe=vt,Ee=Zn,Ae=$n)},setOp:function(vt,Zn,$n){(ue!==vt||Ve!==Zn||ke!==$n)&&(i.stencilOp(vt,Zn,$n),ue=vt,Ve=Zn,ke=$n)},setLocked:function(vt){H=vt},setClear:function(vt){Rt!==vt&&(i.clearStencil(vt),Rt=vt)},reset:function(){H=!1,Se=null,oe=null,Ee=null,Ae=null,ue=null,Ve=null,ke=null,Rt=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,c=new WeakMap,h={},u={},d={},f=new WeakMap,p=[],_=null,g=!1,m=null,x=null,M=null,b=null,v=null,S=null,R=null,y=new ye(0,0,0),A=0,C=!1,D=null,F=null,O=null,L=null,k=null,G=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,te=0,N=i.getParameter(i.VERSION);N.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(N)[1]),V=te>=1):N.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),V=te>=2);let Z=null,ie={},be=i.getParameter(i.SCISSOR_BOX),me=i.getParameter(i.VIEWPORT),Je=new Lt().fromArray(be),We=new Lt().fromArray(me);function we(H,Se,oe,Ee){let Ae=new Uint8Array(4),ue=i.createTexture();i.bindTexture(H,ue),i.texParameteri(H,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(H,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ve=0;Ve<oe;Ve++)H===i.TEXTURE_3D||H===i.TEXTURE_2D_ARRAY?i.texImage3D(Se,0,i.RGBA,1,1,Ee,0,i.RGBA,i.UNSIGNED_BYTE,Ae):i.texImage2D(Se+Ve,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Ae);return ue}let q={};q[i.TEXTURE_2D]=we(i.TEXTURE_2D,i.TEXTURE_2D,1),q[i.TEXTURE_CUBE_MAP]=we(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[i.TEXTURE_2D_ARRAY]=we(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),q[i.TEXTURE_3D]=we(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),j(i.DEPTH_TEST),a.setFunc(aa),he(!1),de(pd),j(i.CULL_FACE),J(nn);function j(H){h[H]!==!0&&(i.enable(H),h[H]=!0)}function Q(H){h[H]!==!1&&(i.disable(H),h[H]=!1)}function fe(H,Se){return d[H]!==Se?(i.bindFramebuffer(H,Se),d[H]=Se,H===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=Se),H===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=Se),!0):!1}function ae(H,Se){let oe=p,Ee=!1;if(H){oe=f.get(Se),oe===void 0&&(oe=[],f.set(Se,oe));let Ae=H.textures;if(oe.length!==Ae.length||oe[0]!==i.COLOR_ATTACHMENT0){for(let ue=0,Ve=Ae.length;ue<Ve;ue++)oe[ue]=i.COLOR_ATTACHMENT0+ue;oe.length=Ae.length,Ee=!0}}else oe[0]!==i.BACK&&(oe[0]=i.BACK,Ee=!0);Ee&&i.drawBuffers(oe)}function ge(H){return _!==H?(i.useProgram(H),_=H,!0):!1}let et={[fi]:i.FUNC_ADD,[Um]:i.FUNC_SUBTRACT,[km]:i.FUNC_REVERSE_SUBTRACT};et[Om]=i.MIN,et[Bm]=i.MAX;let X={[Er]:i.ZERO,[Hm]:i.ONE,[zm]:i.SRC_COLOR,[bd]:i.SRC_ALPHA,[qm]:i.SRC_ALPHA_SATURATE,[Wo]:i.DST_COLOR,[Vo]:i.DST_ALPHA,[Gm]:i.ONE_MINUS_SRC_COLOR,[_d]:i.ONE_MINUS_SRC_ALPHA,[Wm]:i.ONE_MINUS_DST_COLOR,[Vm]:i.ONE_MINUS_DST_ALPHA,[Xm]:i.CONSTANT_COLOR,[jm]:i.ONE_MINUS_CONSTANT_COLOR,[Km]:i.CONSTANT_ALPHA,[Ym]:i.ONE_MINUS_CONSTANT_ALPHA};function J(H,Se,oe,Ee,Ae,ue,Ve,ke,Rt,vt){if(H===nn){g===!0&&(Q(i.BLEND),g=!1);return}if(g===!1&&(j(i.BLEND),g=!0),H!==Gc){if(H!==m||vt!==C){if((x!==fi||v!==fi)&&(i.blendEquation(i.FUNC_ADD),x=fi,v=fi),vt)switch(H){case wa:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Bn:i.blendFunc(i.ONE,i.ONE);break;case md:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case gd:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Qe("WebGLState: Invalid blending: ",H);break}else switch(H){case wa:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Bn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case md:Qe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case gd:Qe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Qe("WebGLState: Invalid blending: ",H);break}M=null,b=null,S=null,R=null,y.set(0,0,0),A=0,m=H,C=vt}return}Ae=Ae||Se,ue=ue||oe,Ve=Ve||Ee,(Se!==x||Ae!==v)&&(i.blendEquationSeparate(et[Se],et[Ae]),x=Se,v=Ae),(oe!==M||Ee!==b||ue!==S||Ve!==R)&&(i.blendFuncSeparate(X[oe],X[Ee],X[ue],X[Ve]),M=oe,b=Ee,S=ue,R=Ve),(ke.equals(y)===!1||Rt!==A)&&(i.blendColor(ke.r,ke.g,ke.b,Rt),y.copy(ke),A=Rt),m=H,C=!1}function ce(H,Se){H.side===Pn?Q(i.CULL_FACE):j(i.CULL_FACE);let oe=H.side===On;Se&&(oe=!oe),he(oe),H.blending===wa&&H.transparent===!1?J(nn):J(H.blending,H.blendEquation,H.blendSrc,H.blendDst,H.blendEquationAlpha,H.blendSrcAlpha,H.blendDstAlpha,H.blendColor,H.blendAlpha,H.premultipliedAlpha),a.setFunc(H.depthFunc),a.setTest(H.depthTest),a.setMask(H.depthWrite),r.setMask(H.colorWrite);let Ee=H.stencilWrite;o.setTest(Ee),Ee&&(o.setMask(H.stencilWriteMask),o.setFunc(H.stencilFunc,H.stencilRef,H.stencilFuncMask),o.setOp(H.stencilFail,H.stencilZFail,H.stencilZPass)),Pe(H.polygonOffset,H.polygonOffsetFactor,H.polygonOffsetUnits),H.alphaToCoverage===!0?j(i.SAMPLE_ALPHA_TO_COVERAGE):Q(i.SAMPLE_ALPHA_TO_COVERAGE)}function he(H){D!==H&&(H?i.frontFace(i.CW):i.frontFace(i.CCW),D=H)}function de(H){H!==Lm?(j(i.CULL_FACE),H!==F&&(H===pd?i.cullFace(i.BACK):H===Nm?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Q(i.CULL_FACE),F=H}function Te(H){H!==O&&(V&&i.lineWidth(H),O=H)}function Pe(H,Se,oe){H?(j(i.POLYGON_OFFSET_FILL),(L!==Se||k!==oe)&&(L=Se,k=oe,a.getReversed()&&(Se=-Se),i.polygonOffset(Se,oe))):Q(i.POLYGON_OFFSET_FILL)}function je(H){H?j(i.SCISSOR_TEST):Q(i.SCISSOR_TEST)}function Oe(H){H===void 0&&(H=i.TEXTURE0+G-1),Z!==H&&(i.activeTexture(H),Z=H)}function U(H,Se,oe){oe===void 0&&(Z===null?oe=i.TEXTURE0+G-1:oe=Z);let Ee=ie[oe];Ee===void 0&&(Ee={type:void 0,texture:void 0},ie[oe]=Ee),(Ee.type!==H||Ee.texture!==Se)&&(Z!==oe&&(i.activeTexture(oe),Z=oe),i.bindTexture(H,Se||q[H]),Ee.type=H,Ee.texture=Se)}function lt(){let H=ie[Z];H!==void 0&&H.type!==void 0&&(i.bindTexture(H.type,null),H.type=void 0,H.texture=void 0)}function rt(){try{i.compressedTexImage2D(...arguments)}catch(H){Qe("WebGLState:",H)}}function I(){try{i.compressedTexImage3D(...arguments)}catch(H){Qe("WebGLState:",H)}}function E(){try{i.texSubImage2D(...arguments)}catch(H){Qe("WebGLState:",H)}}function z(){try{i.texSubImage3D(...arguments)}catch(H){Qe("WebGLState:",H)}}function W(){try{i.compressedTexSubImage2D(...arguments)}catch(H){Qe("WebGLState:",H)}}function ne(){try{i.compressedTexSubImage3D(...arguments)}catch(H){Qe("WebGLState:",H)}}function pe(){try{i.texStorage2D(...arguments)}catch(H){Qe("WebGLState:",H)}}function _e(){try{i.texStorage3D(...arguments)}catch(H){Qe("WebGLState:",H)}}function se(){try{i.texImage2D(...arguments)}catch(H){Qe("WebGLState:",H)}}function le(){try{i.texImage3D(...arguments)}catch(H){Qe("WebGLState:",H)}}function Me(H){return u[H]!==void 0?u[H]:i.getParameter(H)}function Be(H,Se){u[H]!==Se&&(i.pixelStorei(H,Se),u[H]=Se)}function ve(H){Je.equals(H)===!1&&(i.scissor(H.x,H.y,H.z,H.w),Je.copy(H))}function xe(H){We.equals(H)===!1&&(i.viewport(H.x,H.y,H.z,H.w),We.copy(H))}function Ne(H,Se){let oe=c.get(Se);oe===void 0&&(oe=new WeakMap,c.set(Se,oe));let Ee=oe.get(H);Ee===void 0&&(Ee=i.getUniformBlockIndex(Se,H.name),oe.set(H,Ee))}function Ge(H,Se){let Ee=c.get(Se).get(H);l.get(Se)!==Ee&&(i.uniformBlockBinding(Se,Ee,H.__bindingPointIndex),l.set(Se,Ee))}function Ze(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},u={},Z=null,ie={},d={},f=new WeakMap,p=[],_=null,g=!1,m=null,x=null,M=null,b=null,v=null,S=null,R=null,y=new ye(0,0,0),A=0,C=!1,D=null,F=null,O=null,L=null,k=null,Je.set(0,0,i.canvas.width,i.canvas.height),We.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:j,disable:Q,bindFramebuffer:fe,drawBuffers:ae,useProgram:ge,setBlending:J,setMaterial:ce,setFlipSided:he,setCullFace:de,setLineWidth:Te,setPolygonOffset:Pe,setScissorTest:je,activeTexture:Oe,bindTexture:U,unbindTexture:lt,compressedTexImage2D:rt,compressedTexImage3D:I,texImage2D:se,texImage3D:le,pixelStorei:Be,getParameter:Me,updateUBOMapping:Ne,uniformBlockBinding:Ge,texStorage2D:pe,texStorage3D:_e,texSubImage2D:E,texSubImage3D:z,compressedTexSubImage2D:W,compressedTexSubImage3D:ne,scissor:ve,viewport:xe,reset:Ze}}function LS(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new $,h=new WeakMap,u=new Set,d,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(I,E){return p?new OffscreenCanvas(I,E):ca("canvas")}function g(I,E,z){let W=1,ne=rt(I);if((ne.width>z||ne.height>z)&&(W=z/Math.max(ne.width,ne.height)),W<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let pe=Math.floor(W*ne.width),_e=Math.floor(W*ne.height);d===void 0&&(d=_(pe,_e));let se=E?_(pe,_e):d;return se.width=pe,se.height=_e,se.getContext("2d").drawImage(I,0,0,pe,_e),Xe("WebGLRenderer: Texture has been resized from ("+ne.width+"x"+ne.height+") to ("+pe+"x"+_e+")."),se}else return"data"in I&&Xe("WebGLRenderer: Image in DataTexture is too big ("+ne.width+"x"+ne.height+")."),I;return I}function m(I){return I.generateMipmaps}function x(I){i.generateMipmap(I)}function M(I){return I.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?i.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function b(I,E,z,W,ne,pe=!1){if(I!==null){if(i[I]!==void 0)return i[I];Xe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let _e;W&&(_e=e.get("EXT_texture_norm16"),_e||Xe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let se=E;if(E===i.RED&&(z===i.FLOAT&&(se=i.R32F),z===i.HALF_FLOAT&&(se=i.R16F),z===i.UNSIGNED_BYTE&&(se=i.R8),z===i.UNSIGNED_SHORT&&_e&&(se=_e.R16_EXT),z===i.SHORT&&_e&&(se=_e.R16_SNORM_EXT)),E===i.RED_INTEGER&&(z===i.UNSIGNED_BYTE&&(se=i.R8UI),z===i.UNSIGNED_SHORT&&(se=i.R16UI),z===i.UNSIGNED_INT&&(se=i.R32UI),z===i.BYTE&&(se=i.R8I),z===i.SHORT&&(se=i.R16I),z===i.INT&&(se=i.R32I)),E===i.RG&&(z===i.FLOAT&&(se=i.RG32F),z===i.HALF_FLOAT&&(se=i.RG16F),z===i.UNSIGNED_BYTE&&(se=i.RG8),z===i.UNSIGNED_SHORT&&_e&&(se=_e.RG16_EXT),z===i.SHORT&&_e&&(se=_e.RG16_SNORM_EXT)),E===i.RG_INTEGER&&(z===i.UNSIGNED_BYTE&&(se=i.RG8UI),z===i.UNSIGNED_SHORT&&(se=i.RG16UI),z===i.UNSIGNED_INT&&(se=i.RG32UI),z===i.BYTE&&(se=i.RG8I),z===i.SHORT&&(se=i.RG16I),z===i.INT&&(se=i.RG32I)),E===i.RGB_INTEGER&&(z===i.UNSIGNED_BYTE&&(se=i.RGB8UI),z===i.UNSIGNED_SHORT&&(se=i.RGB16UI),z===i.UNSIGNED_INT&&(se=i.RGB32UI),z===i.BYTE&&(se=i.RGB8I),z===i.SHORT&&(se=i.RGB16I),z===i.INT&&(se=i.RGB32I)),E===i.RGBA_INTEGER&&(z===i.UNSIGNED_BYTE&&(se=i.RGBA8UI),z===i.UNSIGNED_SHORT&&(se=i.RGBA16UI),z===i.UNSIGNED_INT&&(se=i.RGBA32UI),z===i.BYTE&&(se=i.RGBA8I),z===i.SHORT&&(se=i.RGBA16I),z===i.INT&&(se=i.RGBA32I)),E===i.RGB&&(z===i.UNSIGNED_SHORT&&_e&&(se=_e.RGB16_EXT),z===i.SHORT&&_e&&(se=_e.RGB16_SNORM_EXT),z===i.UNSIGNED_INT_5_9_9_9_REV&&(se=i.RGB9_E5),z===i.UNSIGNED_INT_10F_11F_11F_REV&&(se=i.R11F_G11F_B10F)),E===i.RGBA){let le=pe?bo:ht.getTransfer(ne);z===i.FLOAT&&(se=i.RGBA32F),z===i.HALF_FLOAT&&(se=i.RGBA16F),z===i.UNSIGNED_BYTE&&(se=le===wt?i.SRGB8_ALPHA8:i.RGBA8),z===i.UNSIGNED_SHORT&&_e&&(se=_e.RGBA16_EXT),z===i.SHORT&&_e&&(se=_e.RGBA16_SNORM_EXT),z===i.UNSIGNED_SHORT_4_4_4_4&&(se=i.RGBA4),z===i.UNSIGNED_SHORT_5_5_5_1&&(se=i.RGB5_A1)}return(se===i.R16F||se===i.R32F||se===i.RG16F||se===i.RG32F||se===i.RGBA16F||se===i.RGBA32F)&&e.get("EXT_color_buffer_float"),se}function v(I,E){let z;return I?E===null||E===Ti||E===Xs?z=i.DEPTH24_STENCIL8:E===ii?z=i.DEPTH32F_STENCIL8:E===Aa&&(z=i.DEPTH24_STENCIL8,Xe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===Ti||E===Xs?z=i.DEPTH_COMPONENT24:E===ii?z=i.DEPTH_COMPONENT32F:E===Aa&&(z=i.DEPTH_COMPONENT16),z}function S(I,E){return m(I)===!0||I.isFramebufferTexture&&I.minFilter!==jt&&I.minFilter!==tn?Math.log2(Math.max(E.width,E.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?E.mipmaps.length:1}function R(I){let E=I.target;E.removeEventListener("dispose",R),A(E),E.isVideoTexture&&h.delete(E),E.isHTMLTexture&&u.delete(E)}function y(I){let E=I.target;E.removeEventListener("dispose",y),D(E)}function A(I){let E=n.get(I);if(E.__webglInit===void 0)return;let z=I.source,W=f.get(z);if(W){let ne=W[E.__cacheKey];ne.usedTimes--,ne.usedTimes===0&&C(I),Object.keys(W).length===0&&f.delete(z)}n.remove(I)}function C(I){let E=n.get(I);i.deleteTexture(E.__webglTexture);let z=I.source,W=f.get(z);delete W[E.__cacheKey],a.memory.textures--}function D(I){let E=n.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),n.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(E.__webglFramebuffer[W]))for(let ne=0;ne<E.__webglFramebuffer[W].length;ne++)i.deleteFramebuffer(E.__webglFramebuffer[W][ne]);else i.deleteFramebuffer(E.__webglFramebuffer[W]);E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer[W])}else{if(Array.isArray(E.__webglFramebuffer))for(let W=0;W<E.__webglFramebuffer.length;W++)i.deleteFramebuffer(E.__webglFramebuffer[W]);else i.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&i.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let W=0;W<E.__webglColorRenderbuffer.length;W++)E.__webglColorRenderbuffer[W]&&i.deleteRenderbuffer(E.__webglColorRenderbuffer[W]);E.__webglDepthRenderbuffer&&i.deleteRenderbuffer(E.__webglDepthRenderbuffer)}let z=I.textures;for(let W=0,ne=z.length;W<ne;W++){let pe=n.get(z[W]);pe.__webglTexture&&(i.deleteTexture(pe.__webglTexture),a.memory.textures--),n.remove(z[W])}n.remove(I)}let F=0;function O(){F=0}function L(){return F}function k(I){F=I}function G(){let I=F;return I>=s.maxTextures&&Xe("WebGLTextures: Trying to use "+(I+1)+" texture units while this GPU supports only "+s.maxTextures),F+=1,I}function V(I){let E=[];return E.push(I.wrapS),E.push(I.wrapT),E.push(I.wrapR||0),E.push(I.magFilter),E.push(I.minFilter),E.push(I.anisotropy),E.push(I.internalFormat),E.push(I.format),E.push(I.type),E.push(I.generateMipmaps),E.push(I.premultiplyAlpha),E.push(I.flipY),E.push(I.unpackAlignment),E.push(I.colorSpace),E.join()}function te(I,E){let z=n.get(I);if(I.isVideoTexture&&U(I),I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&z.__version!==I.version){let W=I.image;if(W===null)Xe("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Xe("WebGLRenderer: Texture marked for update but image is incomplete");else{Q(z,I,E);return}}else I.isExternalTexture&&(z.__webglTexture=I.sourceTexture?I.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,z.__webglTexture,i.TEXTURE0+E)}function N(I,E){let z=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&z.__version!==I.version){Q(z,I,E);return}else I.isExternalTexture&&(z.__webglTexture=I.sourceTexture?I.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,z.__webglTexture,i.TEXTURE0+E)}function Z(I,E){let z=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&z.__version!==I.version){Q(z,I,E);return}t.bindTexture(i.TEXTURE_3D,z.__webglTexture,i.TEXTURE0+E)}function ie(I,E){let z=n.get(I);if(I.isCubeDepthTexture!==!0&&I.version>0&&z.__version!==I.version){fe(z,I,E);return}t.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture,i.TEXTURE0+E)}let be={[xn]:i.REPEAT,[oi]:i.CLAMP_TO_EDGE,[oa]:i.MIRRORED_REPEAT},me={[jt]:i.NEAREST,[qc]:i.NEAREST_MIPMAP_NEAREST,[Tr]:i.NEAREST_MIPMAP_LINEAR,[tn]:i.LINEAR,[Ta]:i.LINEAR_MIPMAP_NEAREST,[wi]:i.LINEAR_MIPMAP_LINEAR},Je={[s0]:i.NEVER,[c0]:i.ALWAYS,[r0]:i.LESS,[Dh]:i.LEQUAL,[a0]:i.EQUAL,[Lh]:i.GEQUAL,[o0]:i.GREATER,[l0]:i.NOTEQUAL};function We(I,E){if(E.type===ii&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===tn||E.magFilter===Ta||E.magFilter===Tr||E.magFilter===wi||E.minFilter===tn||E.minFilter===Ta||E.minFilter===Tr||E.minFilter===wi)&&Xe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(I,i.TEXTURE_WRAP_S,be[E.wrapS]),i.texParameteri(I,i.TEXTURE_WRAP_T,be[E.wrapT]),(I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY)&&i.texParameteri(I,i.TEXTURE_WRAP_R,be[E.wrapR]),i.texParameteri(I,i.TEXTURE_MAG_FILTER,me[E.magFilter]),i.texParameteri(I,i.TEXTURE_MIN_FILTER,me[E.minFilter]),E.compareFunction&&(i.texParameteri(I,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(I,i.TEXTURE_COMPARE_FUNC,Je[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===jt||E.minFilter!==Tr&&E.minFilter!==wi||E.type===ii&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||n.get(E).__currentAnisotropy){let z=e.get("EXT_texture_filter_anisotropic");i.texParameterf(I,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,s.getMaxAnisotropy())),n.get(E).__currentAnisotropy=E.anisotropy}}}function we(I,E){let z=!1;I.__webglInit===void 0&&(I.__webglInit=!0,E.addEventListener("dispose",R));let W=E.source,ne=f.get(W);ne===void 0&&(ne={},f.set(W,ne));let pe=V(E);if(pe!==I.__cacheKey){ne[pe]===void 0&&(ne[pe]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,z=!0),ne[pe].usedTimes++;let _e=ne[I.__cacheKey];_e!==void 0&&(ne[I.__cacheKey].usedTimes--,_e.usedTimes===0&&C(E)),I.__cacheKey=pe,I.__webglTexture=ne[pe].texture}return z}function q(I,E,z){return Math.floor(Math.floor(I/z)/E)}function j(I,E,z,W){let pe=I.updateRanges;if(pe.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,E.width,E.height,z,W,E.data);else{pe.sort((Be,ve)=>Be.start-ve.start);let _e=0;for(let Be=1;Be<pe.length;Be++){let ve=pe[_e],xe=pe[Be],Ne=ve.start+ve.count,Ge=q(xe.start,E.width,4),Ze=q(ve.start,E.width,4);xe.start<=Ne+1&&Ge===Ze&&q(xe.start+xe.count-1,E.width,4)===Ge?ve.count=Math.max(ve.count,xe.start+xe.count-ve.start):(++_e,pe[_e]=xe)}pe.length=_e+1;let se=t.getParameter(i.UNPACK_ROW_LENGTH),le=t.getParameter(i.UNPACK_SKIP_PIXELS),Me=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,E.width);for(let Be=0,ve=pe.length;Be<ve;Be++){let xe=pe[Be],Ne=Math.floor(xe.start/4),Ge=Math.ceil(xe.count/4),Ze=Ne%E.width,H=Math.floor(Ne/E.width),Se=Ge,oe=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Ze),t.pixelStorei(i.UNPACK_SKIP_ROWS,H),t.texSubImage2D(i.TEXTURE_2D,0,Ze,H,Se,oe,z,W,E.data)}I.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,se),t.pixelStorei(i.UNPACK_SKIP_PIXELS,le),t.pixelStorei(i.UNPACK_SKIP_ROWS,Me)}}function Q(I,E,z){let W=i.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(W=i.TEXTURE_2D_ARRAY),E.isData3DTexture&&(W=i.TEXTURE_3D);let ne=we(I,E),pe=E.source;t.bindTexture(W,I.__webglTexture,i.TEXTURE0+z);let _e=n.get(pe);if(pe.version!==_e.__version||ne===!0){if(t.activeTexture(i.TEXTURE0+z),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){let oe=ht.getPrimaries(ht.workingColorSpace),Ee=E.colorSpace===si?null:ht.getPrimaries(E.colorSpace),Ae=E.colorSpace===si||oe===Ee?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae)}t.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment);let le=g(E.image,!1,s.maxTextureSize);le=lt(E,le);let Me=r.convert(E.format,E.colorSpace),Be=r.convert(E.type),ve=b(E.internalFormat,Me,Be,E.normalized,E.colorSpace,E.isVideoTexture);We(W,E);let xe,Ne=E.mipmaps,Ge=E.isVideoTexture!==!0,Ze=_e.__version===void 0||ne===!0,H=pe.dataReady,Se=S(E,le);if(E.isDepthTexture)ve=v(E.format===Ki,E.type),Ze&&(Ge?t.texStorage2D(i.TEXTURE_2D,1,ve,le.width,le.height):t.texImage2D(i.TEXTURE_2D,0,ve,le.width,le.height,0,Me,Be,null));else if(E.isDataTexture)if(Ne.length>0){Ge&&Ze&&t.texStorage2D(i.TEXTURE_2D,Se,ve,Ne[0].width,Ne[0].height);for(let oe=0,Ee=Ne.length;oe<Ee;oe++)xe=Ne[oe],Ge?H&&t.texSubImage2D(i.TEXTURE_2D,oe,0,0,xe.width,xe.height,Me,Be,xe.data):t.texImage2D(i.TEXTURE_2D,oe,ve,xe.width,xe.height,0,Me,Be,xe.data);E.generateMipmaps=!1}else Ge?(Ze&&t.texStorage2D(i.TEXTURE_2D,Se,ve,le.width,le.height),H&&j(E,le,Me,Be)):t.texImage2D(i.TEXTURE_2D,0,ve,le.width,le.height,0,Me,Be,le.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){Ge&&Ze&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Se,ve,Ne[0].width,Ne[0].height,le.depth);for(let oe=0,Ee=Ne.length;oe<Ee;oe++)if(xe=Ne[oe],E.format!==Hn)if(Me!==null)if(Ge){if(H)if(E.layerUpdates.size>0){let Ae=Fd(xe.width,xe.height,E.format,E.type);for(let ue of E.layerUpdates){let Ve=xe.data.subarray(ue*Ae/xe.data.BYTES_PER_ELEMENT,(ue+1)*Ae/xe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,oe,0,0,ue,xe.width,xe.height,1,Me,Ve)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,oe,0,0,0,xe.width,xe.height,le.depth,Me,xe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,oe,ve,xe.width,xe.height,le.depth,0,xe.data,0,0);else Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ge?H&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,oe,0,0,0,xe.width,xe.height,le.depth,Me,Be,xe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,oe,ve,xe.width,xe.height,le.depth,0,Me,Be,xe.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{Ge&&Ze&&t.texStorage2D(i.TEXTURE_2D,Se,ve,Ne[0].width,Ne[0].height);for(let oe=0,Ee=Ne.length;oe<Ee;oe++)xe=Ne[oe],E.format!==Hn?Me!==null?Ge?H&&t.compressedTexSubImage2D(i.TEXTURE_2D,oe,0,0,xe.width,xe.height,Me,xe.data):t.compressedTexImage2D(i.TEXTURE_2D,oe,ve,xe.width,xe.height,0,xe.data):Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ge?H&&t.texSubImage2D(i.TEXTURE_2D,oe,0,0,xe.width,xe.height,Me,Be,xe.data):t.texImage2D(i.TEXTURE_2D,oe,ve,xe.width,xe.height,0,Me,Be,xe.data)}else if(E.isDataArrayTexture)if(Ge){if(Ze&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Se,ve,le.width,le.height,le.depth),H)if(E.layerUpdates.size>0){let oe=Fd(le.width,le.height,E.format,E.type);for(let Ee of E.layerUpdates){let Ae=le.data.subarray(Ee*oe/le.data.BYTES_PER_ELEMENT,(Ee+1)*oe/le.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Ee,le.width,le.height,1,Me,Be,Ae)}E.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,le.width,le.height,le.depth,Me,Be,le.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ve,le.width,le.height,le.depth,0,Me,Be,le.data);else if(E.isData3DTexture)Ge?(Ze&&t.texStorage3D(i.TEXTURE_3D,Se,ve,le.width,le.height,le.depth),H&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,le.width,le.height,le.depth,Me,Be,le.data)):t.texImage3D(i.TEXTURE_3D,0,ve,le.width,le.height,le.depth,0,Me,Be,le.data);else if(E.isFramebufferTexture){if(Ze)if(Ge)t.texStorage2D(i.TEXTURE_2D,Se,ve,le.width,le.height);else{let oe=le.width,Ee=le.height;for(let Ae=0;Ae<Se;Ae++)t.texImage2D(i.TEXTURE_2D,Ae,ve,oe,Ee,0,Me,Be,null),oe>>=1,Ee>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in i){let oe=i.canvas;if(oe.hasAttribute("layoutsubtree")||oe.setAttribute("layoutsubtree","true"),le.parentNode!==oe){oe.appendChild(le),u.add(E),oe.onpaint=Ee=>{let Ae=Ee.changedElements;for(let ue of u)Ae.includes(ue.image)&&(ue.needsUpdate=!0)},oe.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,le);else{let Ae=i.RGBA,ue=i.RGBA,Ve=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Ae,ue,Ve,le)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ne.length>0){if(Ge&&Ze){let oe=rt(Ne[0]);t.texStorage2D(i.TEXTURE_2D,Se,ve,oe.width,oe.height)}for(let oe=0,Ee=Ne.length;oe<Ee;oe++)xe=Ne[oe],Ge?H&&t.texSubImage2D(i.TEXTURE_2D,oe,0,0,Me,Be,xe):t.texImage2D(i.TEXTURE_2D,oe,ve,Me,Be,xe);E.generateMipmaps=!1}else if(Ge){if(Ze){let oe=rt(le);t.texStorage2D(i.TEXTURE_2D,Se,ve,oe.width,oe.height)}H&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Me,Be,le)}else t.texImage2D(i.TEXTURE_2D,0,ve,Me,Be,le);m(E)&&x(W),_e.__version=pe.version,E.onUpdate&&E.onUpdate(E)}I.__version=E.version}function fe(I,E,z){if(E.image.length!==6)return;let W=we(I,E),ne=E.source;t.bindTexture(i.TEXTURE_CUBE_MAP,I.__webglTexture,i.TEXTURE0+z);let pe=n.get(ne);if(ne.version!==pe.__version||W===!0){t.activeTexture(i.TEXTURE0+z);let _e=ht.getPrimaries(ht.workingColorSpace),se=E.colorSpace===si?null:ht.getPrimaries(E.colorSpace),le=E.colorSpace===si||_e===se?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,le);let Me=E.isCompressedTexture||E.image[0].isCompressedTexture,Be=E.image[0]&&E.image[0].isDataTexture,ve=[];for(let ue=0;ue<6;ue++)!Me&&!Be?ve[ue]=g(E.image[ue],!0,s.maxCubemapSize):ve[ue]=Be?E.image[ue].image:E.image[ue],ve[ue]=lt(E,ve[ue]);let xe=ve[0],Ne=r.convert(E.format,E.colorSpace),Ge=r.convert(E.type),Ze=b(E.internalFormat,Ne,Ge,E.normalized,E.colorSpace),H=E.isVideoTexture!==!0,Se=pe.__version===void 0||W===!0,oe=ne.dataReady,Ee=S(E,xe);We(i.TEXTURE_CUBE_MAP,E);let Ae;if(Me){H&&Se&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ee,Ze,xe.width,xe.height);for(let ue=0;ue<6;ue++){Ae=ve[ue].mipmaps;for(let Ve=0;Ve<Ae.length;Ve++){let ke=Ae[Ve];E.format!==Hn?Ne!==null?H?oe&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve,0,0,ke.width,ke.height,Ne,ke.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve,Ze,ke.width,ke.height,0,ke.data):Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):H?oe&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve,0,0,ke.width,ke.height,Ne,Ge,ke.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve,Ze,ke.width,ke.height,0,Ne,Ge,ke.data)}}}else{if(Ae=E.mipmaps,H&&Se){Ae.length>0&&Ee++;let ue=rt(ve[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ee,Ze,ue.width,ue.height)}for(let ue=0;ue<6;ue++)if(Be){H?oe&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,0,0,ve[ue].width,ve[ue].height,Ne,Ge,ve[ue].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,Ze,ve[ue].width,ve[ue].height,0,Ne,Ge,ve[ue].data);for(let Ve=0;Ve<Ae.length;Ve++){let Rt=Ae[Ve].image[ue].image;H?oe&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve+1,0,0,Rt.width,Rt.height,Ne,Ge,Rt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve+1,Ze,Rt.width,Rt.height,0,Ne,Ge,Rt.data)}}else{H?oe&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,0,0,Ne,Ge,ve[ue]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,Ze,Ne,Ge,ve[ue]);for(let Ve=0;Ve<Ae.length;Ve++){let ke=Ae[Ve];H?oe&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve+1,0,0,Ne,Ge,ke.image[ue]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ve+1,Ze,Ne,Ge,ke.image[ue])}}}m(E)&&x(i.TEXTURE_CUBE_MAP),pe.__version=ne.version,E.onUpdate&&E.onUpdate(E)}I.__version=E.version}function ae(I,E,z,W,ne,pe){let _e=r.convert(z.format,z.colorSpace),se=r.convert(z.type),le=b(z.internalFormat,_e,se,z.normalized,z.colorSpace),Me=n.get(E),Be=n.get(z);if(Be.__renderTarget=E,!Me.__hasExternalTextures){let ve=Math.max(1,E.width>>pe),xe=Math.max(1,E.height>>pe);ne===i.TEXTURE_3D||ne===i.TEXTURE_2D_ARRAY?t.texImage3D(ne,pe,le,ve,xe,E.depth,0,_e,se,null):t.texImage2D(ne,pe,le,ve,xe,0,_e,se,null)}t.bindFramebuffer(i.FRAMEBUFFER,I),Oe(E)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,W,ne,Be.__webglTexture,0,je(E)):(ne===i.TEXTURE_2D||ne>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ne<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,W,ne,Be.__webglTexture,pe),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ge(I,E,z){if(i.bindRenderbuffer(i.RENDERBUFFER,I),E.depthBuffer){let W=E.depthTexture,ne=W&&W.isDepthTexture?W.type:null,pe=v(E.stencilBuffer,ne),_e=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Oe(E)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,je(E),pe,E.width,E.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,je(E),pe,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,pe,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,_e,i.RENDERBUFFER,I)}else{let W=E.textures;for(let ne=0;ne<W.length;ne++){let pe=W[ne],_e=r.convert(pe.format,pe.colorSpace),se=r.convert(pe.type),le=b(pe.internalFormat,_e,se,pe.normalized,pe.colorSpace);Oe(E)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,je(E),le,E.width,E.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,je(E),le,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,le,E.width,E.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function et(I,E,z){let W=E.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,I),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ne=n.get(E.depthTexture);if(ne.__renderTarget=E,(!ne.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),W){if(ne.__webglInit===void 0&&(ne.__webglInit=!0,E.depthTexture.addEventListener("dispose",R)),ne.__webglTexture===void 0){ne.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,ne.__webglTexture),We(i.TEXTURE_CUBE_MAP,E.depthTexture);let Me=r.convert(E.depthTexture.format),Be=r.convert(E.depthTexture.type),ve;E.depthTexture.format===Ui?ve=i.DEPTH_COMPONENT24:E.depthTexture.format===Ki&&(ve=i.DEPTH24_STENCIL8);for(let xe=0;xe<6;xe++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,ve,E.width,E.height,0,Me,Be,null)}}else te(E.depthTexture,0);let pe=ne.__webglTexture,_e=je(E),se=W?i.TEXTURE_CUBE_MAP_POSITIVE_X+z:i.TEXTURE_2D,le=E.depthTexture.format===Ki?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(E.depthTexture.format===Ui)Oe(E)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,le,se,pe,0,_e):i.framebufferTexture2D(i.FRAMEBUFFER,le,se,pe,0);else if(E.depthTexture.format===Ki)Oe(E)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,le,se,pe,0,_e):i.framebufferTexture2D(i.FRAMEBUFFER,le,se,pe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function X(I){let E=n.get(I),z=I.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==I.depthTexture){let W=I.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),W){let ne=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,W.removeEventListener("dispose",ne)};W.addEventListener("dispose",ne),E.__depthDisposeCallback=ne}E.__boundDepthTexture=W}if(I.depthTexture&&!E.__autoAllocateDepthBuffer)if(z)for(let W=0;W<6;W++)et(E.__webglFramebuffer[W],I,W);else{let W=I.texture.mipmaps;W&&W.length>0?et(E.__webglFramebuffer[0],I,0):et(E.__webglFramebuffer,I,0)}else if(z){E.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[W]),E.__webglDepthbuffer[W]===void 0)E.__webglDepthbuffer[W]=i.createRenderbuffer(),ge(E.__webglDepthbuffer[W],I,!1);else{let ne=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,pe=E.__webglDepthbuffer[W];i.bindRenderbuffer(i.RENDERBUFFER,pe),i.framebufferRenderbuffer(i.FRAMEBUFFER,ne,i.RENDERBUFFER,pe)}}else{let W=I.texture.mipmaps;if(W&&W.length>0?t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=i.createRenderbuffer(),ge(E.__webglDepthbuffer,I,!1);else{let ne=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,pe=E.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,pe),i.framebufferRenderbuffer(i.FRAMEBUFFER,ne,i.RENDERBUFFER,pe)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function J(I,E,z){let W=n.get(I);E!==void 0&&ae(W.__webglFramebuffer,I,I.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),z!==void 0&&X(I)}function ce(I){let E=I.texture,z=n.get(I),W=n.get(E);I.addEventListener("dispose",y);let ne=I.textures,pe=I.isWebGLCubeRenderTarget===!0,_e=ne.length>1;if(_e||(W.__webglTexture===void 0&&(W.__webglTexture=i.createTexture()),W.__version=E.version,a.memory.textures++),pe){z.__webglFramebuffer=[];for(let se=0;se<6;se++)if(E.mipmaps&&E.mipmaps.length>0){z.__webglFramebuffer[se]=[];for(let le=0;le<E.mipmaps.length;le++)z.__webglFramebuffer[se][le]=i.createFramebuffer()}else z.__webglFramebuffer[se]=i.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){z.__webglFramebuffer=[];for(let se=0;se<E.mipmaps.length;se++)z.__webglFramebuffer[se]=i.createFramebuffer()}else z.__webglFramebuffer=i.createFramebuffer();if(_e)for(let se=0,le=ne.length;se<le;se++){let Me=n.get(ne[se]);Me.__webglTexture===void 0&&(Me.__webglTexture=i.createTexture(),a.memory.textures++)}if(I.samples>0&&Oe(I)===!1){z.__webglMultisampledFramebuffer=i.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let se=0;se<ne.length;se++){let le=ne[se];z.__webglColorRenderbuffer[se]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,z.__webglColorRenderbuffer[se]);let Me=r.convert(le.format,le.colorSpace),Be=r.convert(le.type),ve=b(le.internalFormat,Me,Be,le.normalized,le.colorSpace,I.isXRRenderTarget===!0),xe=je(I);i.renderbufferStorageMultisample(i.RENDERBUFFER,xe,ve,I.width,I.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+se,i.RENDERBUFFER,z.__webglColorRenderbuffer[se])}i.bindRenderbuffer(i.RENDERBUFFER,null),I.depthBuffer&&(z.__webglDepthRenderbuffer=i.createRenderbuffer(),ge(z.__webglDepthRenderbuffer,I,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(pe){t.bindTexture(i.TEXTURE_CUBE_MAP,W.__webglTexture),We(i.TEXTURE_CUBE_MAP,E);for(let se=0;se<6;se++)if(E.mipmaps&&E.mipmaps.length>0)for(let le=0;le<E.mipmaps.length;le++)ae(z.__webglFramebuffer[se][le],I,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+se,le);else ae(z.__webglFramebuffer[se],I,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+se,0);m(E)&&x(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(_e){for(let se=0,le=ne.length;se<le;se++){let Me=ne[se],Be=n.get(Me),ve=i.TEXTURE_2D;(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(ve=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ve,Be.__webglTexture),We(ve,Me),ae(z.__webglFramebuffer,I,Me,i.COLOR_ATTACHMENT0+se,ve,0),m(Me)&&x(ve)}t.unbindTexture()}else{let se=i.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(se=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(se,W.__webglTexture),We(se,E),E.mipmaps&&E.mipmaps.length>0)for(let le=0;le<E.mipmaps.length;le++)ae(z.__webglFramebuffer[le],I,E,i.COLOR_ATTACHMENT0,se,le);else ae(z.__webglFramebuffer,I,E,i.COLOR_ATTACHMENT0,se,0);m(E)&&x(se),t.unbindTexture()}I.depthBuffer&&X(I)}function he(I){let E=I.textures;for(let z=0,W=E.length;z<W;z++){let ne=E[z];if(m(ne)){let pe=M(I),_e=n.get(ne).__webglTexture;t.bindTexture(pe,_e),x(pe),t.unbindTexture()}}}let de=[],Te=[];function Pe(I){if(I.samples>0){if(Oe(I)===!1){let E=I.textures,z=I.width,W=I.height,ne=i.COLOR_BUFFER_BIT,pe=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,_e=n.get(I),se=E.length>1;if(se)for(let Me=0;Me<E.length;Me++)t.bindFramebuffer(i.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Me,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,_e.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Me,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,_e.__webglMultisampledFramebuffer);let le=I.texture.mipmaps;le&&le.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,_e.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,_e.__webglFramebuffer);for(let Me=0;Me<E.length;Me++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(ne|=i.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(ne|=i.STENCIL_BUFFER_BIT)),se){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,_e.__webglColorRenderbuffer[Me]);let Be=n.get(E[Me]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Be,0)}i.blitFramebuffer(0,0,z,W,0,0,z,W,ne,i.NEAREST),l===!0&&(de.length=0,Te.length=0,de.push(i.COLOR_ATTACHMENT0+Me),I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&(de.push(pe),Te.push(pe),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Te)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,de))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),se)for(let Me=0;Me<E.length;Me++){t.bindFramebuffer(i.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Me,i.RENDERBUFFER,_e.__webglColorRenderbuffer[Me]);let Be=n.get(E[Me]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,_e.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Me,i.TEXTURE_2D,Be,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,_e.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&l){let E=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[E])}}}function je(I){return Math.min(s.maxSamples,I.samples)}function Oe(I){let E=n.get(I);return I.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function U(I){let E=a.render.frame;h.get(I)!==E&&(h.set(I,E),I.update())}function lt(I,E){let z=I.colorSpace,W=I.format,ne=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||z!==kn&&z!==si&&(ht.getTransfer(z)===wt?(W!==Hn||ne!==In)&&Xe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Qe("WebGLTextures: Unsupported texture color space:",z)),E}function rt(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(c.width=I.naturalWidth||I.width,c.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(c.width=I.displayWidth,c.height=I.displayHeight):(c.width=I.width,c.height=I.height),c}this.allocateTextureUnit=G,this.resetTextureUnits=O,this.getTextureUnits=L,this.setTextureUnits=k,this.setTexture2D=te,this.setTexture2DArray=N,this.setTexture3D=Z,this.setTextureCube=ie,this.rebindTextures=J,this.setupRenderTarget=ce,this.updateRenderTargetMipmap=he,this.updateMultisampleRenderTarget=Pe,this.setupDepthRenderbuffer=X,this.setupFrameBufferTexture=ae,this.useMultisampledRTT=Oe,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function NS(i,e){function t(n,s=si){let r,a=ht.getTransfer(s);if(n===In)return i.UNSIGNED_BYTE;if(n===jc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Kc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Sd)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ed)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===yd)return i.BYTE;if(n===Md)return i.SHORT;if(n===Aa)return i.UNSIGNED_SHORT;if(n===Xc)return i.INT;if(n===Ti)return i.UNSIGNED_INT;if(n===ii)return i.FLOAT;if(n===Qt)return i.HALF_FLOAT;if(n===wd)return i.ALPHA;if(n===Td)return i.RGB;if(n===Hn)return i.RGBA;if(n===Ui)return i.DEPTH_COMPONENT;if(n===Ki)return i.DEPTH_STENCIL;if(n===Yc)return i.RED;if(n===Jc)return i.RED_INTEGER;if(n===js)return i.RG;if(n===Zc)return i.RG_INTEGER;if(n===$c)return i.RGBA_INTEGER;if(n===$o||n===Qo||n===el||n===tl)if(a===wt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===$o)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Qo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===el)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===tl)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===$o)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Qo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===el)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===tl)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Qc||n===eh||n===th||n===nh)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Qc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===eh)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===th)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===nh)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ih||n===sh||n===rh||n===ah||n===oh||n===nl||n===lh)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ih||n===sh)return a===wt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===rh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===ah)return r.COMPRESSED_R11_EAC;if(n===oh)return r.COMPRESSED_SIGNED_R11_EAC;if(n===nl)return r.COMPRESSED_RG11_EAC;if(n===lh)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ch||n===hh||n===uh||n===dh||n===fh||n===ph||n===mh||n===gh||n===bh||n===_h||n===xh||n===vh||n===yh||n===Mh)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ch)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===hh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===uh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===dh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===fh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ph)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===mh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===gh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===bh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===_h)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===xh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===vh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===yh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Mh)return a===wt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Sh||n===Eh||n===wh)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Sh)return a===wt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Eh)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===wh)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Th||n===Ah||n===il||n===Rh)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Th)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ah)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===il)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Rh)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Xs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}function OS(i,e){function t(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function n(g,m){m.color.getRGB(g.fogColor.value,Dd(i)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function s(g,m,x,M,b){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(g,m):m.isMeshLambertMaterial?(r(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(g,m),u(g,m)):m.isMeshPhongMaterial?(r(g,m),h(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(g,m),d(g,m),m.isMeshPhysicalMaterial&&f(g,m,b)):m.isMeshMatcapMaterial?(r(g,m),p(g,m)):m.isMeshDepthMaterial?r(g,m):m.isMeshDistanceMaterial?(r(g,m),_(g,m)):m.isMeshNormalMaterial?r(g,m):m.isLineBasicMaterial?(a(g,m),m.isLineDashedMaterial&&o(g,m)):m.isPointsMaterial?l(g,m,x,M):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,t(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===On&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,t(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===On&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,t(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,t(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);let x=e.get(m),M=x.envMap,b=x.envMapRotation;M&&(g.envMap.value=M,g.envMapRotation.value.setFromMatrix4(kS.makeRotationFromEuler(b)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Y0),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,g.aoMapTransform))}function a(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform))}function o(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,x,M){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*x,g.scale.value=M*.5,m.map&&(g.map.value=m.map,t(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function h(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function u(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function d(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,x){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===On&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.retroreflectivity>0&&(g.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=x.texture,g.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function _(g,m){let x=e.get(m).light;g.referencePosition.value.setFromMatrixPosition(x.matrixWorld),g.nearDistance.value=x.shadow.camera.near,g.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function BS(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,v){let S=v.program;n.uniformBlockBinding(b,S)}function c(b,v){let S=s[b.id];S===void 0&&(g(b),S=h(b),s[b.id]=S,b.addEventListener("dispose",x));let R=v.program;n.updateUBOMapping(b,R);let y=e.render.frame;r[b.id]!==y&&(d(b),r[b.id]=y)}function h(b){let v=u();b.__bindingPointIndex=v;let S=i.createBuffer(),R=b.__size,y=b.usage;return i.bindBuffer(i.UNIFORM_BUFFER,S),i.bufferData(i.UNIFORM_BUFFER,R,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,S),S}function u(){for(let b=0;b<o;b++)if(a.indexOf(b)===-1)return a.push(b),b;return Qe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){let v=s[b.id],S=b.uniforms,R=b.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let y=0,A=S.length;y<A;y++){let C=S[y];if(Array.isArray(C))for(let D=0,F=C.length;D<F;D++)f(C[D],y,D,R);else f(C,y,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(b,v,S,R){if(_(b,v,S,R)===!0){let y=b.__offset,A=b.value;if(Array.isArray(A)){let C=0;for(let D=0;D<A.length;D++){let F=A[D],O=m(F);p(F,b.__data,C),typeof F!="number"&&typeof F!="boolean"&&!F.isMatrix3&&!ArrayBuffer.isView(F)&&(C+=O.storage/Float32Array.BYTES_PER_ELEMENT)}}else p(A,b.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,y,b.__data)}}function p(b,v,S){typeof b=="number"||typeof b=="boolean"?v[0]=b:b.isMatrix3?(v[0]=b.elements[0],v[1]=b.elements[1],v[2]=b.elements[2],v[3]=0,v[4]=b.elements[3],v[5]=b.elements[4],v[6]=b.elements[5],v[7]=0,v[8]=b.elements[6],v[9]=b.elements[7],v[10]=b.elements[8],v[11]=0):ArrayBuffer.isView(b)?v.set(new b.constructor(b.buffer,b.byteOffset,v.length)):b.toArray(v,S)}function _(b,v,S,R){let y=b.value,A=v+"_"+S;if(R[A]===void 0)return typeof y=="number"||typeof y=="boolean"?R[A]=y:ArrayBuffer.isView(y)?R[A]=y.slice():R[A]=y.clone(),!0;{let C=R[A];if(typeof y=="number"||typeof y=="boolean"){if(C!==y)return R[A]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(C.equals(y)===!1)return C.copy(y),!0}}return!1}function g(b){let v=b.uniforms,S=0,R=16;for(let A=0,C=v.length;A<C;A++){let D=Array.isArray(v[A])?v[A]:[v[A]];for(let F=0,O=D.length;F<O;F++){let L=D[F],k=Array.isArray(L.value)?L.value:[L.value];for(let G=0,V=k.length;G<V;G++){let te=k[G],N=m(te),Z=S%R,ie=Z%N.boundary,be=Z+ie;S+=ie,be!==0&&R-be<N.storage&&(S+=R-be),L.__data=new Float32Array(N.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=S,S+=N.storage}}}let y=S%R;return y>0&&(S+=R-y),b.__size=S,b.__cache={},this}function m(b){let v={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(v.boundary=4,v.storage=4):b.isVector2?(v.boundary=8,v.storage=8):b.isVector3||b.isColor?(v.boundary=16,v.storage=12):b.isVector4?(v.boundary=16,v.storage=16):b.isMatrix3?(v.boundary=48,v.storage=48):b.isMatrix4?(v.boundary=64,v.storage=64):b.isTexture?Xe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(b)?(v.boundary=16,v.storage=b.byteLength):Xe("WebGLRenderer: Unsupported uniform value type.",b),v}function x(b){let v=b.target;v.removeEventListener("dispose",x);let S=a.indexOf(v.__bindingPointIndex);a.splice(S,1),i.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function M(){for(let b in s)i.deleteBuffer(s[b]);a=[],s={},r={}}return{bind:l,update:c,dispose:M}}function zS(){return Yi===null&&(Yi=new Oi(HS,16,16,js,Qt),Yi.name="DFG_LUT",Yi.minFilter=tn,Yi.magFilter=tn,Yi.wrapS=oi,Yi.wrapT=oi,Yi.generateMipmaps=!1,Yi.needsUpdate=!0),Yi}var ev,tv,nv,iv,sv,rv,av,ov,lv,cv,hv,uv,dv,fv,pv,mv,gv,bv,_v,xv,vv,yv,Mv,Sv,Ev,wv,Tv,Av,Rv,Cv,Pv,Iv,Dv,Lv,Nv,Fv,Uv,kv,Ov,Bv,Hv,zv,Gv,Vv,Wv,qv,Xv,jv,Kv,Yv,Jv,Zv,$v,Qv,ey,ty,ny,iy,sy,ry,ay,oy,ly,cy,hy,uy,dy,fy,py,my,gy,by,_y,xy,vy,yy,My,Sy,Ey,wy,Ty,Ay,Ry,Cy,Py,Iy,Dy,Ly,Ny,Fy,Uy,ky,Oy,By,Hy,zy,Gy,Vy,Wy,qy,Xy,jy,Ky,Yy,Jy,Zy,$y,Qy,e1,t1,n1,i1,s1,r1,a1,o1,l1,c1,h1,u1,d1,f1,p1,m1,g1,b1,_1,x1,v1,y1,M1,S1,E1,w1,T1,A1,R1,C1,P1,I1,D1,L1,dt,Ce,Ji,Nh,N1,W0,Pa,H1,z1,G1,al,M0,kd,Od,Bd,Hd,V1,Rr,Uh,kh,eM,q0,Vd,X0,j0,K0,T0,A0,R0,C0,P0,Wd,qd,Xd,zd,Ia,VM,WM,L0,KM,Fh,eS,tS,iS,rS,oS,cS,uS,mS,Kd,Yd,SS,AS,RS,CS,PS,G0,ol,Gd,FS,US,Jd,Zd,kS,Y0,HS,Yi,Cr,St=Vt(()=>{Ud();Ud();ev=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,tv=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,nv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,iv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sv=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rv=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,av=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ov=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,lv=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,cv=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,hv=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,uv=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,dv=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,fv=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,pv=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mv=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,gv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,bv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_v=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,xv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,vv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,yv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Mv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Sv=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ev=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,wv=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Tv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Av=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Rv=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Cv=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Pv="gl_FragColor = linearToOutputTexel( gl_FragColor );",Iv=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Dv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Lv=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Nv=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Fv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Uv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,kv=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ov=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Hv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,zv=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Gv=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Vv=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Wv=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,qv=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Xv=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,jv=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Kv=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yv=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Jv=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zv=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,$v=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Qv=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ey=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ty=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,ny=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,iy=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,sy=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ry=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ay=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,oy=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ly=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,cy=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,hy=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,uy=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,dy=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,fy=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,py=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,my=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,gy=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,by=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,_y=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,xy=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,vy=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yy=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,My=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Sy=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ey=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,wy=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Ty=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ay=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ry=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Cy=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Py=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Iy=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Dy=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ly=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ny=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Fy=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Uy=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,ky=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Oy=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,By=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Hy=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,zy=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Gy=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Vy=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Wy=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,qy=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Xy=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,jy=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ky=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Yy=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Jy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$y=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Qy=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,e1=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,t1=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,n1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,i1=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,s1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,r1=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,a1=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,o1=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,l1=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,c1=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,h1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,u1=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,d1=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,f1=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,p1=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,m1=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,g1=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,b1=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_1=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,x1=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v1=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,y1=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,M1=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,S1=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,E1=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,w1=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,T1=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,A1=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,R1=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,C1=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,P1=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,I1=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,D1=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,L1=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,dt={alphahash_fragment:ev,alphahash_pars_fragment:tv,alphamap_fragment:nv,alphamap_pars_fragment:iv,alphatest_fragment:sv,alphatest_pars_fragment:rv,aomap_fragment:av,aomap_pars_fragment:ov,batching_pars_vertex:lv,batching_vertex:cv,begin_vertex:hv,beginnormal_vertex:uv,bsdfs:dv,iridescence_fragment:fv,bumpmap_pars_fragment:pv,clipping_planes_fragment:mv,clipping_planes_pars_fragment:gv,clipping_planes_pars_vertex:bv,clipping_planes_vertex:_v,color_fragment:xv,color_pars_fragment:vv,color_pars_vertex:yv,color_vertex:Mv,common:Sv,cube_uv_reflection_fragment:Ev,defaultnormal_vertex:wv,displacementmap_pars_vertex:Tv,displacementmap_vertex:Av,emissivemap_fragment:Rv,emissivemap_pars_fragment:Cv,colorspace_fragment:Pv,colorspace_pars_fragment:Iv,envmap_fragment:Dv,envmap_common_pars_fragment:Lv,envmap_pars_fragment:Nv,envmap_pars_vertex:Fv,envmap_physical_pars_fragment:Xv,envmap_vertex:Uv,fog_vertex:kv,fog_pars_vertex:Ov,fog_fragment:Bv,fog_pars_fragment:Hv,gradientmap_pars_fragment:zv,lightmap_pars_fragment:Gv,lights_lambert_fragment:Vv,lights_lambert_pars_fragment:Wv,lights_pars_begin:qv,lights_toon_fragment:jv,lights_toon_pars_fragment:Kv,lights_phong_fragment:Yv,lights_phong_pars_fragment:Jv,lights_physical_fragment:Zv,lights_physical_pars_fragment:$v,lights_fragment_begin:Qv,lights_fragment_maps:ey,lights_fragment_end:ty,lightprobes_pars_fragment:ny,logdepthbuf_fragment:iy,logdepthbuf_pars_fragment:sy,logdepthbuf_pars_vertex:ry,logdepthbuf_vertex:ay,map_fragment:oy,map_pars_fragment:ly,map_particle_fragment:cy,map_particle_pars_fragment:hy,metalnessmap_fragment:uy,metalnessmap_pars_fragment:dy,morphinstance_vertex:fy,morphcolor_vertex:py,morphnormal_vertex:my,morphtarget_pars_vertex:gy,morphtarget_vertex:by,normal_fragment_begin:_y,normal_fragment_maps:xy,normal_pars_fragment:vy,normal_pars_vertex:yy,normal_vertex:My,normalmap_pars_fragment:Sy,clearcoat_normal_fragment_begin:Ey,clearcoat_normal_fragment_maps:wy,clearcoat_pars_fragment:Ty,iridescence_pars_fragment:Ay,opaque_fragment:Ry,packing:Cy,premultiplied_alpha_fragment:Py,project_vertex:Iy,dithering_fragment:Dy,dithering_pars_fragment:Ly,roughnessmap_fragment:Ny,roughnessmap_pars_fragment:Fy,shadowmap_pars_fragment:Uy,shadowmap_pars_vertex:ky,shadowmap_vertex:Oy,shadowmask_pars_fragment:By,skinbase_vertex:Hy,skinning_pars_vertex:zy,skinning_vertex:Gy,skinnormal_vertex:Vy,specularmap_fragment:Wy,specularmap_pars_fragment:qy,tonemapping_fragment:Xy,tonemapping_pars_fragment:jy,transmission_fragment:Ky,transmission_pars_fragment:Yy,uv_pars_fragment:Jy,uv_pars_vertex:Zy,uv_vertex:$y,worldpos_vertex:Qy,background_vert:e1,background_frag:t1,backgroundCube_vert:n1,backgroundCube_frag:i1,cube_vert:s1,cube_frag:r1,depth_vert:a1,depth_frag:o1,distance_vert:l1,distance_frag:c1,equirect_vert:h1,equirect_frag:u1,linedashed_vert:d1,linedashed_frag:f1,meshbasic_vert:p1,meshbasic_frag:m1,meshlambert_vert:g1,meshlambert_frag:b1,meshmatcap_vert:_1,meshmatcap_frag:x1,meshnormal_vert:v1,meshnormal_frag:y1,meshphong_vert:M1,meshphong_frag:S1,meshphysical_vert:E1,meshphysical_frag:w1,meshtoon_vert:T1,meshtoon_frag:A1,points_vert:R1,points_frag:C1,shadow_vert:P1,shadow_frag:I1,sprite_vert:D1,sprite_frag:L1},Ce={common:{diffuse:{value:new ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new it},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new it}},envmap:{envMap:{value:null},envMapRotation:{value:new it},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new it}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new it}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new it},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new it},normalScale:{value:new $(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new it},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new it}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new it}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new it}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new w},probesMax:{value:new w},probesResolution:{value:new w}},points:{diffuse:{value:new ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0},uvTransform:{value:new it}},sprite:{diffuse:{value:new ye(16777215)},opacity:{value:1},center:{value:new $(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new it},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0}}},Ji={basic:{uniforms:Dn([Ce.common,Ce.specularmap,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.fog]),vertexShader:dt.meshbasic_vert,fragmentShader:dt.meshbasic_frag},lambert:{uniforms:Dn([Ce.common,Ce.specularmap,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.fog,Ce.lights,{emissive:{value:new ye(0)},envMapIntensity:{value:1}}]),vertexShader:dt.meshlambert_vert,fragmentShader:dt.meshlambert_frag},phong:{uniforms:Dn([Ce.common,Ce.specularmap,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.fog,Ce.lights,{emissive:{value:new ye(0)},specular:{value:new ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:dt.meshphong_vert,fragmentShader:dt.meshphong_frag},standard:{uniforms:Dn([Ce.common,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.roughnessmap,Ce.metalnessmap,Ce.fog,Ce.lights,{emissive:{value:new ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:dt.meshphysical_vert,fragmentShader:dt.meshphysical_frag},toon:{uniforms:Dn([Ce.common,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.gradientmap,Ce.fog,Ce.lights,{emissive:{value:new ye(0)}}]),vertexShader:dt.meshtoon_vert,fragmentShader:dt.meshtoon_frag},matcap:{uniforms:Dn([Ce.common,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.fog,{matcap:{value:null}}]),vertexShader:dt.meshmatcap_vert,fragmentShader:dt.meshmatcap_frag},points:{uniforms:Dn([Ce.points,Ce.fog]),vertexShader:dt.points_vert,fragmentShader:dt.points_frag},dashed:{uniforms:Dn([Ce.common,Ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:dt.linedashed_vert,fragmentShader:dt.linedashed_frag},depth:{uniforms:Dn([Ce.common,Ce.displacementmap]),vertexShader:dt.depth_vert,fragmentShader:dt.depth_frag},normal:{uniforms:Dn([Ce.common,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,{opacity:{value:1}}]),vertexShader:dt.meshnormal_vert,fragmentShader:dt.meshnormal_frag},sprite:{uniforms:Dn([Ce.sprite,Ce.fog]),vertexShader:dt.sprite_vert,fragmentShader:dt.sprite_frag},background:{uniforms:{uvTransform:{value:new it},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:dt.background_vert,fragmentShader:dt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new it}},vertexShader:dt.backgroundCube_vert,fragmentShader:dt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:dt.cube_vert,fragmentShader:dt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:dt.equirect_vert,fragmentShader:dt.equirect_frag},distance:{uniforms:Dn([Ce.common,Ce.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:dt.distance_vert,fragmentShader:dt.distance_frag},shadow:{uniforms:Dn([Ce.lights,Ce.fog,{color:{value:new ye(0)},opacity:{value:1}}]),vertexShader:dt.shadow_vert,fragmentShader:dt.shadow_frag}};Ji.physical={uniforms:Dn([Ji.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new it},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new it},clearcoatNormalScale:{value:new $(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new it},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new it},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new it},sheen:{value:0},sheenColor:{value:new ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new it},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new it},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new it},transmissionSamplerSize:{value:new $},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new it},attenuationDistance:{value:0},attenuationColor:{value:new ye(0)},specularColor:{value:new ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new it},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new it},anisotropyVector:{value:new $},anisotropyMap:{value:null},anisotropyMapTransform:{value:new it}}]),vertexShader:dt.meshphysical_vert,fragmentShader:dt.meshphysical_frag};Nh={r:0,b:0,g:0},N1=new De,W0=new it;W0.set(-1,0,0,0,1,0,0,0,1);Pa=4,H1=6,z1=20,G1=256,al=new qi,M0=new ye,kd=null,Od=0,Bd=0,Hd=!1,V1=new w,Rr=new w,Uh=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=V1}=r;kd=this._renderer.getRenderTarget(),Od=this._renderer.getActiveCubeFace(),Bd=this._renderer.getActiveMipmapLevel(),Hd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=w0(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=E0(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(kd,Od,Bd),this._renderer.xr.enabled=Hd,e.scissorTest=!1,Ca(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===qs||e.mapping===wr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),kd=this._renderer.getRenderTarget(),Od=this._renderer.getActiveCubeFace(),Bd=this._renderer.getActiveMipmapLevel(),Hd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:tn,minFilter:tn,generateMipmaps:!1,type:Qt,format:Hn,colorSpace:kn,depthBuffer:!1},s=S0(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=S0(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=W1(r)),this._blurMaterial=X1(r,e,t),this._ggxMaterial=q1(r,e,t)}return s}_compileMaterial(e){let t=new at(new ot,e);this._renderer.compile(t,al)}_sceneToCubeUV(e,t,n,s,r){let l=new Yt(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(M0),u.toneMapping=Ei,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new at(new At,new $t({name:"PMREM.Background",side:On,depthWrite:!1,depthTest:!1})));let _=this._backgroundBox,g=_.material,m=!1,x=e.background;x?x.isColor&&(g.color.copy(x),e.background=null,m=!0):(g.color.copy(M0),m=!0);for(let M=0;M<6;M++){let b=M%3;b===0?(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[M],r.y,r.z)):b===1?(l.up.set(0,0,c[M]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[M],r.z)):(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[M]));let v=this._cubeSize;Ca(s,b*v,M>2?v:0,v,v),u.setRenderTarget(s),m&&u.render(_,l),u.render(e,l)}u.toneMapping=f,u.autoClear=d,e.background=x}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===qs||e.mapping===wr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=w0()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=E0());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Ca(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,al)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),d=c*1.25,f=u*d,{_lodMax:p}=this,_=this._sizeLods[n],g=3*_*(n>p-Pa?n-p+Pa:0),m=4*(this._cubeSize-_);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=p-t,Ca(r,g,m,3*_,2*_),s.setRenderTarget(r),s.render(o,al),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=p-n,Ca(e,g,m,3*_,2*_),s.setRenderTarget(e),s.render(o,al)}_blur(e,t,n,s){let r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,a),this._blurPass(r,e,n,n,a)}_blurPass(e,t,n,s,r){let a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],u=3*h*(s>this._lodMax-Pa?s-this._lodMax+Pa:0),d=4*(this._cubeSize-h);Ca(t,u,d,3*h,2*h),a.setRenderTarget(t),a.render(l,al)}};kh=class extends qt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new _r(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new At(5,5,5),r=new Bt({name:"CubemapFromEquirect",uniforms:Ar(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:On,blending:nn});r.uniforms.tEquirect.value=t;let a=new at(s,r),o=t.minFilter;return t.minFilter===wi&&(t.minFilter=tn),new Oc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}};eM={[qo]:"LINEAR_TONE_MAPPING",[Xo]:"REINHARD_TONE_MAPPING",[jo]:"CINEON_TONE_MAPPING",[ji]:"ACES_FILMIC_TONE_MAPPING",[Yo]:"AGX_TONE_MAPPING",[Jo]:"NEUTRAL_TONE_MAPPING",[Ko]:"CUSTOM_TONE_MAPPING"};q0=new hn,Vd=new Hi(1,1),X0=new xo,j0=new yc,K0=new _r,T0=[],A0=[],R0=new Float32Array(16),C0=new Float32Array(9),P0=new Float32Array(4);Wd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=yM(t.type)}},qd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=zM(t.type)}},Xd=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},zd=/(\w+)(\])?(\[|\.)?/g;Ia=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);GM(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};VM=37297,WM=0;L0=new it;KM={[qo]:"Linear",[Xo]:"Reinhard",[jo]:"Cineon",[ji]:"ACESFilmic",[Yo]:"AgX",[Jo]:"Neutral",[Ko]:"Custom"};Fh=new w;eS=/^[ \t]*#include +<([\w\d./]+)>/gm;tS=new Map;iS=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;rS={[Sr]:"SHADOWMAP_TYPE_PCF",[Ea]:"SHADOWMAP_TYPE_VSM"};oS={[qs]:"ENVMAP_TYPE_CUBE",[wr]:"ENVMAP_TYPE_CUBE",[Zo]:"ENVMAP_TYPE_CUBE_UV"};cS={[wr]:"ENVMAP_MODE_REFRACTION"};uS={[xd]:"ENVMAP_BLENDING_MULTIPLY",[Jm]:"ENVMAP_BLENDING_MIX",[Zm]:"ENVMAP_BLENDING_ADD"};mS=0,Kd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Yd(e),t.set(e,n)),n}},Yd=class{constructor(e){this.id=mS++,this.code=e,this.usedTimes=0}};SS=0;AS=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,RS=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,CS=[new w(1,0,0),new w(-1,0,0),new w(0,1,0),new w(0,-1,0),new w(0,0,1),new w(0,0,-1)],PS=[new w(0,-1,0),new w(0,-1,0),new w(0,0,1),new w(0,0,-1),new w(0,-1,0),new w(0,-1,0)],G0=new De,ol=new w,Gd=new w;FS=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,US=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Jd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Eo(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Bt({vertexShader:FS,fragmentShader:US,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new at(new Mn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Zd=class extends ci{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,p=null,_=typeof XRWebGLBinding<"u",g=new Jd,m={},x=t.getContextAttributes(),M=null,b=null,v=[],S=[],R=new $,y=null,A=null,C=new Yt;C.viewport=new Lt;let D=new Yt;D.viewport=new Lt;let F=[C,D],O=new Bc,L=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let j=v[q];return j===void 0&&(j=new fa,v[q]=j),j.getTargetRaySpace()},this.getControllerGrip=function(q){let j=v[q];return j===void 0&&(j=new fa,v[q]=j),j.getGripSpace()},this.getHand=function(q){let j=v[q];return j===void 0&&(j=new fa,v[q]=j),j.getHandSpace()};function G(q){let j=S.indexOf(q.inputSource);if(j===-1)return;let Q=v[j];Q!==void 0&&(Q.update(q.inputSource,q.frame,c||a),Q.dispatchEvent({type:q.type,data:q.inputSource}))}function V(){s.removeEventListener("select",G),s.removeEventListener("selectstart",G),s.removeEventListener("selectend",G),s.removeEventListener("squeeze",G),s.removeEventListener("squeezestart",G),s.removeEventListener("squeezeend",G),s.removeEventListener("end",V),s.removeEventListener("inputsourceschange",te);for(let q=0;q<v.length;q++){let j=S[q];j!==null&&(S[q]=null,v[q].disconnect(j))}L=null,k=null,g.reset();for(let q in m)delete m[q];if(e.setRenderTarget(M),f=null,d=null,u=null,s=null,b=null,we.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(R.width,R.height,!1),A!==null){let q=A.camera;q.fov=A.fov,q.zoom=A.zoom,q.updateProjectionMatrix(),A=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&Xe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&Xe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(s,t)),u},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(M=e.getRenderTarget(),s.addEventListener("select",G),s.addEventListener("selectstart",G),s.addEventListener("selectend",G),s.addEventListener("squeeze",G),s.addEventListener("squeezestart",G),s.addEventListener("squeezeend",G),s.addEventListener("end",V),s.addEventListener("inputsourceschange",te),x.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(R),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let Q=null,fe=null,ae=null;x.depth&&(ae=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=x.stencil?Ki:Ui,fe=x.stencil?Xs:Ti);let ge={colorFormat:t.RGBA8,depthFormat:ae,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(ge),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),b=new qt(d.textureWidth,d.textureHeight,{format:Hn,type:In,depthTexture:new Hi(d.textureWidth,d.textureHeight,fe,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let Q={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,Q),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new qt(f.framebufferWidth,f.framebufferHeight,{format:Hn,type:In,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),we.setContext(s),we.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function te(q){for(let j=0;j<q.removed.length;j++){let Q=q.removed[j],fe=S.indexOf(Q);fe>=0&&(S[fe]=null,v[fe].disconnect(Q))}for(let j=0;j<q.added.length;j++){let Q=q.added[j],fe=S.indexOf(Q);if(fe===-1){for(let ge=0;ge<v.length;ge++)if(ge>=S.length){S.push(Q),fe=ge;break}else if(S[ge]===null){S[ge]=Q,fe=ge;break}if(fe===-1)break}let ae=v[fe];ae&&ae.connect(Q)}}let N=new w,Z=new w;function ie(q,j,Q){N.setFromMatrixPosition(j.matrixWorld),Z.setFromMatrixPosition(Q.matrixWorld);let fe=N.distanceTo(Z),ae=j.projectionMatrix.elements,ge=Q.projectionMatrix.elements,et=ae[14]/(ae[10]-1),X=ae[14]/(ae[10]+1),J=(ae[9]+1)/ae[5],ce=(ae[9]-1)/ae[5],he=(ae[8]-1)/ae[0],de=(ge[8]+1)/ge[0],Te=et*he,Pe=et*de,je=fe/(-he+de),Oe=je*-he;if(j.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Oe),q.translateZ(je),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),ae[10]===-1)q.projectionMatrix.copy(j.projectionMatrix),q.projectionMatrixInverse.copy(j.projectionMatrixInverse);else{let U=et+je,lt=X+je,rt=Te-Oe,I=Pe+(fe-Oe),E=J*X/lt*U,z=ce*X/lt*U;q.projectionMatrix.makePerspective(rt,I,E,z,U,lt),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function be(q,j){j===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(j.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let j=q.near,Q=q.far;g.texture!==null&&(g.depthNear>0&&(j=g.depthNear),g.depthFar>0&&(Q=g.depthFar)),O.near=D.near=C.near=j,O.far=D.far=C.far=Q,(L!==O.near||k!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),L=O.near,k=O.far),O.layers.mask=q.layers.mask|6,C.layers.mask=O.layers.mask&-5,D.layers.mask=O.layers.mask&-3;let fe=q.parent,ae=O.cameras;be(O,fe);for(let ge=0;ge<ae.length;ge++)be(ae[ge],fe);ae.length===2?ie(O,C,D):O.projectionMatrix.copy(C.projectionMatrix),A===null&&q.isPerspectiveCamera&&(A={camera:q,fov:q.fov,zoom:q.zoom}),me(q,O,fe)};function me(q,j,Q){Q===null?q.matrix.copy(j.matrixWorld):(q.matrix.copy(Q.matrixWorld),q.matrix.invert(),q.matrix.multiply(j.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(j.projectionMatrix),q.projectionMatrixInverse.copy(j.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=fr*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(q){l=q,d!==null&&(d.fixedFoveation=q),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=q)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(O)},this.getCameraTexture=function(q){return m[q]};let Je=null;function We(q,j){if(h=j.getViewerPose(c||a),p=j,h!==null){let Q=h.views;f!==null&&(e.setRenderTargetFramebuffer(b,f.framebuffer),e.setRenderTarget(b));let fe=!1;Q.length!==O.cameras.length&&(O.cameras.length=0,fe=!0);for(let X=0;X<Q.length;X++){let J=Q[X],ce=null;if(f!==null)ce=f.getViewport(J);else{let de=u.getViewSubImage(d,J);ce=de.viewport,X===0&&(e.setRenderTargetTextures(b,de.colorTexture,de.depthStencilTexture),e.setRenderTarget(b))}let he=F[X];he===void 0&&(he=new Yt,he.layers.enable(X),he.viewport=new Lt,F[X]=he),he.matrix.fromArray(J.transform.matrix),he.matrix.decompose(he.position,he.quaternion,he.scale),he.projectionMatrix.fromArray(J.projectionMatrix),he.projectionMatrixInverse.copy(he.projectionMatrix).invert(),he.viewport.set(ce.x,ce.y,ce.width,ce.height),X===0&&(O.matrix.copy(he.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),fe===!0&&O.cameras.push(he)}let ae=s.enabledFeatures;if(ae&&ae.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){u=n.getBinding();let X=u.getDepthInformation(Q[0]);X&&X.isValid&&X.texture&&g.init(X,s.renderState)}if(ae&&ae.includes("camera-access")&&_){e.state.unbindTexture(),u=n.getBinding();for(let X=0;X<Q.length;X++){let J=Q[X].camera;if(J){let ce=m[J];ce||(ce=new Eo,m[J]=ce);let he=u.getCameraImage(J);ce.sourceTexture=he}}}}for(let Q=0;Q<v.length;Q++){let fe=S[Q],ae=v[Q];fe!==null&&ae!==void 0&&ae.update(fe,j,c||a)}Je&&Je(q,j),j.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:j}),p=null}let we=new V0;we.setAnimationLoop(We),this.setAnimationLoop=function(q){Je=q},this.dispose=function(){}}},kS=new De,Y0=new it;Y0.set(-1,0,0,0,1,0,0,0,1);HS=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Yi=null;Cr=class{constructor(e={}){let{canvas:t=h0(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=In}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let _=f,g=new Set([$c,Zc,Jc]),m=new Set([In,Ti,Aa,Xs,jc,Kc]),x=new Uint32Array(4),M=new Int32Array(4),b=new w,v=null,S=null,R=[],y=[],A=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ei,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let C=this,D=!1,F=null,O=null,L=null,k=null;this._outputColorSpace=Tt;let G=0,V=0,te=null,N=-1,Z=null,ie=new Lt,be=new Lt,me=null,Je=new ye(0),We=0,we=t.width,q=t.height,j=1,Q=null,fe=null,ae=new Lt(0,0,we,q),ge=new Lt(0,0,we,q),et=!1,X=new ma,J=!1,ce=!1,he=new De,de=new w,Te=new Lt,Pe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},je=!1;function Oe(){return te===null?j:1}let U=n;function lt(T,B){return t.getContext(T,B)}let rt,I,E,z,W,ne,pe,_e,se,le,Me,Be,ve,xe,Ne,Ge,Ze,H,Se,oe,Ee,Ae,ue;try{let T={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",Rt,!1),t.addEventListener("webglcontextrestored",vt,!1),t.addEventListener("webglcontextcreationerror",Zn,!1),U===null){let B="webgl2";if(U=lt(B,T),U===null)throw lt(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ve()}catch(T){throw t.removeEventListener("webglcontextlost",Rt,!1),t.removeEventListener("webglcontextrestored",vt,!1),t.removeEventListener("webglcontextcreationerror",Zn,!1),Qe("WebGLRenderer: "+T.message),T}function Ve(){rt=new K1(U),rt.init(),Ee=new NS(U,rt),I=new O1(U,rt,e,Ee),E=new DS(U,rt),I.reversedDepthBuffer&&d&&E.buffers.depth.setReversed(!0),O=U.createFramebuffer(),L=U.createFramebuffer(),k=U.createFramebuffer(),z=new Z1(U),W=new _S,ne=new LS(U,rt,E,W,I,Ee,z),pe=new j1(C),_e=new Qx(U),Ae=new U1(U,_e),se=new Y1(U,_e,z,Ae),le=new Q1(U,se,_e,Ae,z),H=new $1(U,I,ne),Ne=new B1(W),Me=new bS(C,pe,rt,I,Ae,Ne),Be=new OS(C,W),ve=new vS,xe=new TS(rt),Ze=new F1(C,pe,E,le,p,l),Ge=new IS(C,le,I),ue=new BS(U,z,I,E),Se=new k1(U,rt,z),oe=new J1(U,rt,z),z.programs=Me.programs,C.capabilities=I,C.extensions=rt,C.properties=W,C.renderLists=ve,C.shadowMap=Ge,C.state=E,C.info=z}_!==In&&(A=new tM(_,t.width,t.height,o,s,r));let ke=new Zd(C,U);this.xr=ke,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let T=rt.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){let T=rt.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(T){T!==void 0&&(j=T,this.setSize(we,q,!1))},this.getSize=function(T){return T.set(we,q)},this.setSize=function(T,B,ee=!0){if(ke.isPresenting){Xe("WebGLRenderer: Can't change size while VR device is presenting.");return}we=T,q=B,t.width=Math.floor(T*j),t.height=Math.floor(B*j),ee===!0&&(t.style.width=T+"px",t.style.height=B+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,T,B)},this.getDrawingBufferSize=function(T){return T.set(we*j,q*j).floor()},this.setDrawingBufferSize=function(T,B,ee){we=T,q=B,j=ee,t.width=Math.floor(T*ee),t.height=Math.floor(B*ee),this.setViewport(0,0,T,B)},this.setEffects=function(T){if(_===In){Qe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(T){for(let B=0;B<T.length;B++)if(T[B].isOutputPass===!0){Xe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(T||[])},this.getCurrentViewport=function(T){return T.copy(ie)},this.getViewport=function(T){return T.copy(ae)},this.setViewport=function(T,B,ee,K){T.isVector4?ae.set(T.x,T.y,T.z,T.w):ae.set(T,B,ee,K),E.viewport(ie.copy(ae).multiplyScalar(j).round())},this.getScissor=function(T){return T.copy(ge)},this.setScissor=function(T,B,ee,K){T.isVector4?ge.set(T.x,T.y,T.z,T.w):ge.set(T,B,ee,K),E.scissor(be.copy(ge).multiplyScalar(j).round())},this.getScissorTest=function(){return et},this.setScissorTest=function(T){E.setScissorTest(et=T)},this.setOpaqueSort=function(T){Q=T},this.setTransparentSort=function(T){fe=T},this.getClearColor=function(T){return T.copy(Ze.getClearColor())},this.setClearColor=function(){Ze.setClearColor(...arguments)},this.getClearAlpha=function(){return Ze.getClearAlpha()},this.setClearAlpha=function(){Ze.setClearAlpha(...arguments)},this.clear=function(T=!0,B=!0,ee=!0){let K=0;if(T){let Y=!1;if(te!==null){let Le=te.texture.format;Y=g.has(Le)}if(Y){let Le=te.texture.type,Ue=m.has(Le),Ie=Ze.getClearColor(),He=Ze.getClearAlpha(),qe=Ie.r,ut=Ie.g,pt=Ie.b;Ue?(x[0]=qe,x[1]=ut,x[2]=pt,x[3]=He,U.clearBufferuiv(U.COLOR,0,x)):(M[0]=qe,M[1]=ut,M[2]=pt,M[3]=He,U.clearBufferiv(U.COLOR,0,M))}else K|=U.COLOR_BUFFER_BIT}B&&(K|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ee&&(K|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),K!==0&&U.clear(K)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(T){T.setRenderer(this),F=T},this.dispose=function(){t.removeEventListener("webglcontextlost",Rt,!1),t.removeEventListener("webglcontextrestored",vt,!1),t.removeEventListener("webglcontextcreationerror",Zn,!1),Ze.dispose(),ve.dispose(),xe.dispose(),W.dispose(),pe.dispose(),le.dispose(),Ae.dispose(),ue.dispose(),Me.dispose(),ke.dispose(),ke.removeEventListener("sessionstart",Ip),ke.removeEventListener("sessionend",Dp),ir.stop()};function Rt(T){T.preventDefault(),_o("WebGLRenderer: Context Lost."),D=!0}function vt(){_o("WebGLRenderer: Context Restored."),D=!1;let T=z.autoReset,B=Ge.enabled,ee=Ge.autoUpdate,K=Ge.needsUpdate,Y=Ge.type;Ve(),z.autoReset=T,Ge.enabled=B,Ge.autoUpdate=ee,Ge.needsUpdate=K,Ge.type=Y}function Zn(T){Qe("WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function $n(T){let B=T.target;B.removeEventListener("dispose",$n),Re(B)}function Re(T){nt(T),W.remove(T)}function nt(T){let B=W.get(T).programs;B!==void 0&&(B.forEach(function(ee){Me.releaseProgram(ee)}),T.isShaderMaterial&&Me.releaseShaderCache(T))}this.renderBufferDirect=function(T,B,ee,K,Y,Le){B===null&&(B=Pe);let Ue=Y.isMesh&&Y.matrixWorld.determinantAffine()<0,Ie=g_(T,B,ee,K,Y);E.setMaterial(K,Ue);let He=ee.index,qe=1;if(K.wireframe===!0){if(He=se.getWireframeAttribute(ee),He===void 0)return;qe=2}let ut=ee.drawRange,pt=ee.attributes.position,ze=ut.start*qe,Ct=(ut.start+ut.count)*qe;Le!==null&&(ze=Math.max(ze,Le.start*qe),Ct=Math.min(Ct,(Le.start+Le.count)*qe)),He!==null?(ze=Math.max(ze,0),Ct=Math.min(Ct,He.count)):pt!=null&&(ze=Math.max(ze,0),Ct=Math.min(Ct,pt.count));let on=Ct-ze;if(on<0||on===1/0)return;Ae.setup(Y,K,Ie,ee,He);let Wt,Ot=Se;if(He!==null&&(Wt=_e.get(He),Ot=oe,Ot.setIndex(Wt)),Y.isMesh)K.wireframe===!0?(E.setLineWidth(K.wireframeLinewidth*Oe()),Ot.setMode(U.LINES)):Ot.setMode(U.TRIANGLES);else if(Y.isLine){let wn=K.linewidth;wn===void 0&&(wn=1),E.setLineWidth(wn*Oe()),Y.isLineSegments?Ot.setMode(U.LINES):Y.isLineLoop?Ot.setMode(U.LINE_LOOP):Ot.setMode(U.LINE_STRIP)}else Y.isPoints?Ot.setMode(U.POINTS):Y.isSprite&&Ot.setMode(U.TRIANGLES);if(Y.isBatchedMesh)if(rt.get("WEBGL_multi_draw"))Ot.renderMultiDraw(Y._multiDrawStarts,Y._multiDrawCounts,Y._multiDrawCount);else{let wn=Y._multiDrawStarts,Fe=Y._multiDrawCounts,Nn=Y._multiDrawCount,yt=He?_e.get(He).bytesPerElement:1,ri=W.get(K).currentProgram.getUniforms();for(let Di=0;Di<Nn;Di++)ri.setValue(U,"_gl_DrawID",Di),Ot.render(wn[Di]/yt,Fe[Di])}else if(Y.isInstancedMesh)Ot.renderInstances(ze,on,Y.count);else if(ee.isInstancedBufferGeometry){let wn=ee._maxInstanceCount!==void 0?ee._maxInstanceCount:1/0,Fe=Math.min(ee.instanceCount,wn);Ot.renderInstances(ze,on,Fe)}else Ot.render(ze,on)};function It(T,B,ee,K){F!==null&&T.isNodeMaterial&&F.setObject(K,T),J===!0&&Ne.setState(T,ee,!1),T.transparent===!0&&T.side===Pn&&T.forceSinglePass===!1?(T.side=On,T.needsUpdate=!0,Dl(T,B,K),T.side=Xi,T.needsUpdate=!0,Dl(T,B,K),T.side=Pn):Dl(T,B,K)}this.compile=function(T,B,ee=null){ee===null&&(ee=T),F!==null&&F.renderStart(T,B,ee),S=xe.get(ee),S.init(B),y.push(S),ee.traverseVisible(function(Y){Y.isLight&&Y.layers.test(B.layers)&&(S.pushLight(Y),Y.castShadow&&S.pushShadow(Y))}),T!==ee&&T.traverseVisible(function(Y){Y.isLight&&Y.layers.test(B.layers)&&(S.pushLight(Y),Y.castShadow&&S.pushShadow(Y))}),S.setupLights(),F!==null&&F.updateLights(S.state.lightsArray),ce=this.localClippingEnabled,J=Ne.init(this.clippingPlanes,ce),J===!0&&Ne.setGlobalState(this.clippingPlanes,B),F!==null&&Ge.render(S.state.shadowsArray,ee,B);let K=new Set;return T.traverse(function(Y){if(!(Y.isMesh||Y.isPoints||Y.isLine||Y.isSprite))return;let Le=Y.material;if(Le)if(Array.isArray(Le))for(let Ue=0;Ue<Le.length;Ue++){let Ie=Le[Ue];It(Ie,ee,B,Y),K.add(Ie)}else It(Le,ee,B,Y),K.add(Le)}),S=y.pop(),F!==null&&F.renderEnd(),K},this.compileAsync=function(T,B,ee=null){let K=this.compile(T,B,ee);return new Promise(Y=>{function Le(){if(K.forEach(function(Ue){let He=W.get(Ue).currentProgram;(He===void 0||He.isReady())&&K.delete(Ue)}),K.size===0){Y(T);return}setTimeout(Le,10)}rt.get("KHR_parallel_shader_compile")!==null?Le():setTimeout(Le,10)})};let is=null;function $a(T){is&&is(T)}function Ip(){ir.stop()}function Dp(){ir.start()}let ir=new V0;ir.setAnimationLoop($a),typeof self<"u"&&ir.setContext(self),this.setAnimationLoop=function(T){is=T,ke.setAnimationLoop(T),T===null?ir.stop():ir.start()},ke.addEventListener("sessionstart",Ip),ke.addEventListener("sessionend",Dp),this.render=function(T,B){if(B!==void 0&&B.isCamera!==!0){Qe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;F!==null&&F.renderStart(T,B);let ee=ke.enabled===!0&&ke.isPresenting===!0,K=A!==null&&(te===null||ee)&&A.begin(C,te);if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),ke.enabled===!0&&ke.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(ke.cameraAutoUpdate===!0&&ke.updateCamera(B),B=ke.getCamera()),T.isScene===!0&&T.onBeforeRender(C,T,B,te),S=xe.get(T,y.length),S.init(B),S.state.textureUnits=ne.getTextureUnits(),y.push(S),he.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),X.setFromProjectionMatrix(he,yi,B.reversedDepth),ce=this.localClippingEnabled,J=Ne.init(this.clippingPlanes,ce),v=ve.get(T,R.length),v.init(),R.push(v),ke.enabled===!0&&ke.isPresenting===!0){let Ue=C.xr.getDepthSensingMesh();Ue!==null&&wu(Ue,B,-1/0,C.sortObjects)}wu(T,B,0,C.sortObjects),v.finish(),F!==null&&F.updateLights(S.state.lightsArray),C.sortObjects===!0&&v.sort(Q,fe),je=ke.enabled===!1||ke.isPresenting===!1||ke.hasDepthSensing()===!1,je&&Ze.addToRenderList(v,T),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),J===!0&&Ne.beginShadows();let Y=S.state.shadowsArray;if(Ge.render(Y,T,B),J===!0&&Ne.endShadows(),(K&&A.hasRenderPass())===!1){let Ue=v.opaque,Ie=v.transmissive;if(S.setupLights(),B.isArrayCamera){let He=B.cameras;if(Ie.length>0)for(let qe=0,ut=He.length;qe<ut;qe++){let pt=He[qe];Np(Ue,Ie,T,pt)}je&&Ze.render(T);for(let qe=0,ut=He.length;qe<ut;qe++){let pt=He[qe];Lp(v,T,pt,pt.viewport)}}else Ie.length>0&&Np(Ue,Ie,T,B),je&&Ze.render(T),Lp(v,T,B)}te!==null&&V===0&&(ne.updateMultisampleRenderTarget(te),ne.updateRenderTargetMipmap(te)),K&&A.end(C),T.isScene===!0&&T.onAfterRender(C,T,B),Ae.resetDefaultState(),N=-1,Z=null,y.pop(),y.length>0?(S=y[y.length-1],ne.setTextureUnits(S.state.textureUnits),J===!0&&Ne.setGlobalState(C.clippingPlanes,S.state.camera)):S=null,R.pop(),R.length>0?v=R[R.length-1]:v=null,F!==null&&F.renderEnd()};function wu(T,B,ee,K){if(T.visible===!1)return;if(T.layers.test(B.layers)){if(T.isGroup)ee=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(B);else if(T.isLightProbeGrid)S.pushLightProbeGrid(T);else if(T.isLight)S.pushLight(T),T.castShadow&&S.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||T.intersectsFrustum(X)){K&&Te.setFromMatrixPosition(T.matrixWorld).applyMatrix4(he);let Ue=le.update(T),Ie=T.material;Ie.visible&&v.push(T,Ue,Ie,ee,Te.z,null,B)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||T.intersectsFrustum(X))){let Ue=le.update(T),Ie=T.material;if(K&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),Te.copy(T.boundingSphere.center)):(Ue.boundingSphere===null&&Ue.computeBoundingSphere(),Te.copy(Ue.boundingSphere.center)),Te.applyMatrix4(T.matrixWorld).applyMatrix4(he)),Array.isArray(Ie)){let He=Ue.groups;for(let qe=0,ut=He.length;qe<ut;qe++){let pt=He[qe],ze=Ie[pt.materialIndex];ze&&ze.visible&&v.push(T,Ue,ze,ee,Te.z,pt,B)}}else Ie.visible&&v.push(T,Ue,Ie,ee,Te.z,null,B)}}let Le=T.children;for(let Ue=0,Ie=Le.length;Ue<Ie;Ue++)wu(Le[Ue],B,ee,K)}function Lp(T,B,ee,K){let{opaque:Y,transmissive:Le,transparent:Ue}=T;S.setupLightsView(ee),J===!0&&Ne.setGlobalState(C.clippingPlanes,ee),K&&E.viewport(ie.copy(K)),Y.length>0&&Il(Y,B,ee),Le.length>0&&Il(Le,B,ee),Ue.length>0&&Il(Ue,B,ee),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function Np(T,B,ee,K){if((ee.isScene===!0?ee.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[K.id]===void 0){let ze=rt.has("EXT_color_buffer_half_float")||rt.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[K.id]=new qt(1,1,{generateMipmaps:!0,type:ze?Qt:In,minFilter:wi,samples:Math.max(4,I.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ht.workingColorSpace})}let Le=S.state.transmissionRenderTarget[K.id],Ue=K.viewport||ie;Le.setSize(Ue.z*C.transmissionResolutionScale,Ue.w*C.transmissionResolutionScale);let Ie=C.getRenderTarget(),He=C.getActiveCubeFace(),qe=C.getActiveMipmapLevel();C.setRenderTarget(Le),C.getClearColor(Je),We=C.getClearAlpha(),We<1&&C.setClearColor(16777215,.5),C.clear(),je&&Ze.render(ee);let ut=C.toneMapping;C.toneMapping=Ei;let pt=K.viewport;if(K.viewport!==void 0&&(K.viewport=void 0),S.setupLightsView(K),J===!0&&Ne.setGlobalState(C.clippingPlanes,K),Il(T,ee,K),ne.updateMultisampleRenderTarget(Le),ne.updateRenderTargetMipmap(Le),rt.has("WEBGL_multisampled_render_to_texture")===!1){let ze=!1;for(let Ct=0,on=B.length;Ct<on;Ct++){let Wt=B[Ct],{object:Ot,geometry:wn,material:Fe,group:Nn}=Wt;if(Fe.side===Pn&&Ot.layers.test(K.layers)){let yt=Fe.side;Fe.side=On,Fe.needsUpdate=!0,Fp(Ot,ee,K,wn,Fe,Nn),Fe.side=yt,Fe.needsUpdate=!0,ze=!0}}ze===!0&&(ne.updateMultisampleRenderTarget(Le),ne.updateRenderTargetMipmap(Le))}C.setRenderTarget(Ie,He,qe),C.setClearColor(Je,We),pt!==void 0&&(K.viewport=pt),C.toneMapping=ut}function Il(T,B,ee){let K=B.isScene===!0?B.overrideMaterial:null;for(let Y=0,Le=T.length;Y<Le;Y++){let Ue=T[Y],{object:Ie,geometry:He,group:qe}=Ue,ut=Ue.material;ut.allowOverride===!0&&K!==null&&(ut=K),Ie.layers.test(ee.layers)&&Fp(Ie,B,ee,He,ut,qe)}}function Fp(T,B,ee,K,Y,Le){F!==null&&Y.isNodeMaterial&&F.setObject(T,Y),T.onBeforeRender(C,B,ee,K,Y,Le),T.modelViewMatrix.multiplyMatrices(ee.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),Y.onBeforeRender(C,B,ee,K,T,Le),Y.transparent===!0&&Y.side===Pn&&Y.forceSinglePass===!1?(Y.side=On,Y.needsUpdate=!0,C.renderBufferDirect(ee,B,K,Y,T,Le),Y.side=Xi,Y.needsUpdate=!0,C.renderBufferDirect(ee,B,K,Y,T,Le),Y.side=Pn):C.renderBufferDirect(ee,B,K,Y,T,Le),T.onAfterRender(C,B,ee,K,Y,Le)}function Dl(T,B,ee){B.isScene!==!0&&(B=Pe);let K=W.get(T),Y=S.state.lights,Le=S.state.shadowsArray,Ue=Y.state.version,Ie=Me.getParameters(T,Y.state,Le,B,ee,S.state.lightProbeGridArray),He=Me.getProgramCacheKey(Ie),qe=K.programs;K.environment=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?B.environment:null,K.fog=B.fog;let ut=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap;K.envMap=pe.get(T.envMap||K.environment,ut),K.envMapRotation=K.environment!==null&&T.envMap===null?B.environmentRotation:T.envMapRotation,qe===void 0&&(T.addEventListener("dispose",$n),qe=new Map,K.programs=qe);let pt=qe.get(He);if(pt!==void 0){if(K.currentProgram===pt&&K.lightsStateVersion===Ue)return kp(T,Ie),pt}else Ie.uniforms=Me.getUniforms(T),F!==null&&T.isNodeMaterial&&F.build(T,ee,Ie),T.onBeforeCompile(Ie,C),pt=Me.acquireProgram(Ie,He),qe.set(He,pt),K.uniforms=Ie.uniforms;let ze=K.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(ze.clippingPlanes=Ne.uniform),kp(T,Ie),K.needsLights=__(T),K.lightsStateVersion=Ue,K.needsLights&&(ze.ambientLightColor.value=Y.state.ambient,ze.lightProbe.value=Y.state.probe,ze.sunLights.value=Y.state.sun,ze.sunLightShadows.value=Y.state.sunShadow,ze.directionalLights.value=Y.state.directional,ze.directionalLightShadows.value=Y.state.directionalShadow,ze.spotLights.value=Y.state.spot,ze.spotLightShadows.value=Y.state.spotShadow,ze.rectAreaLights.value=Y.state.rectArea,ze.ltc_1.value=Y.state.rectAreaLTC1,ze.ltc_2.value=Y.state.rectAreaLTC2,ze.pointLights.value=Y.state.point,ze.pointLightShadows.value=Y.state.pointShadow,ze.hemisphereLights.value=Y.state.hemi,ze.sunShadowMatrix.value=Y.state.sunShadowMatrix,ze.sunShadowCascade.value=Y.state.sunShadowCascade,ze.directionalShadowMatrix.value=Y.state.directionalShadowMatrix,ze.spotLightMatrix.value=Y.state.spotLightMatrix,ze.spotLightMap.value=Y.state.spotLightMap,ze.pointShadowMatrix.value=Y.state.pointShadowMatrix),K.lightProbeGrid=S.state.lightProbeGridArray.length>0,K.currentProgram=pt,K.uniformsList=null,pt}function Up(T){if(T.uniformsList===null){let B=T.currentProgram.getUniforms();T.uniformsList=Ia.seqWithValue(B.seq,T.uniforms)}return T.uniformsList}function kp(T,B){let ee=W.get(T);ee.outputColorSpace=B.outputColorSpace,ee.batching=B.batching,ee.batchingColor=B.batchingColor,ee.instancing=B.instancing,ee.instancingColor=B.instancingColor,ee.instancingMorph=B.instancingMorph,ee.skinning=B.skinning,ee.morphTargets=B.morphTargets,ee.morphNormals=B.morphNormals,ee.morphColors=B.morphColors,ee.morphTargetsCount=B.morphTargetsCount,ee.numClippingPlanes=B.numClippingPlanes,ee.numIntersection=B.numClipIntersection,ee.vertexAlphas=B.vertexAlphas,ee.vertexTangents=B.vertexTangents,ee.toneMapping=B.toneMapping}function m_(T,B){if(T.length===0)return null;if(T.length===1)return T[0].texture!==null?T[0]:null;b.setFromMatrixPosition(B.matrixWorld);for(let ee=0,K=T.length;ee<K;ee++){let Y=T[ee];if(Y.texture!==null&&Y.boundingBox.containsPoint(b))return Y}return null}function g_(T,B,ee,K,Y){B.isScene!==!0&&(B=Pe),ne.resetTextureUnits();let Le=B.fog,Ue=K.isMeshStandardMaterial||K.isMeshLambertMaterial||K.isMeshPhongMaterial?B.environment:null,Ie=te===null?C.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:ht.workingColorSpace,He=K.isMeshStandardMaterial||K.isMeshLambertMaterial&&!K.envMap||K.isMeshPhongMaterial&&!K.envMap,qe=pe.get(K.envMap||Ue,He),ut=K.vertexColors===!0&&!!ee.attributes.color&&ee.attributes.color.itemSize===4,pt=!!ee.attributes.tangent&&(!!K.normalMap||K.anisotropy>0),ze=!!ee.morphAttributes.position,Ct=!!ee.morphAttributes.normal,on=!!ee.morphAttributes.color,Wt=Ei;K.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(Wt=C.toneMapping);let Ot=ee.morphAttributes.position||ee.morphAttributes.normal||ee.morphAttributes.color,wn=Ot!==void 0?Ot.length:0,Fe=W.get(K),Nn=S.state.lights;if(J===!0&&(ce===!0||T!==Z)){let Gt=T===Z&&K.id===N;Ne.setState(K,T,Gt)}let yt=!1;K.version===Fe.__version?(Fe.needsLights&&Fe.lightsStateVersion!==Nn.state.version||Fe.outputColorSpace!==Ie||Y.isBatchedMesh&&Fe.batching===!1||!Y.isBatchedMesh&&Fe.batching===!0||Y.isBatchedMesh&&Fe.batchingColor===!0&&Y._colorsTexture===null||Y.isBatchedMesh&&Fe.batchingColor===!1&&Y._colorsTexture!==null||Y.isInstancedMesh&&Fe.instancing===!1||!Y.isInstancedMesh&&Fe.instancing===!0||Y.isSkinnedMesh&&Fe.skinning===!1||!Y.isSkinnedMesh&&Fe.skinning===!0||Y.isInstancedMesh&&Fe.instancingColor===!0&&Y.instanceColor===null||Y.isInstancedMesh&&Fe.instancingColor===!1&&Y.instanceColor!==null||Y.isInstancedMesh&&Fe.instancingMorph===!0&&Y.morphTexture===null||Y.isInstancedMesh&&Fe.instancingMorph===!1&&Y.morphTexture!==null||Fe.envMap!==qe||K.fog===!0&&Fe.fog!==Le||Fe.numClippingPlanes!==void 0&&(Fe.numClippingPlanes!==Ne.numPlanes||Fe.numIntersection!==Ne.numIntersection)||Fe.vertexAlphas!==ut||Fe.vertexTangents!==pt||Fe.morphTargets!==ze||Fe.morphNormals!==Ct||Fe.morphColors!==on||Fe.toneMapping!==Wt||Fe.morphTargetsCount!==wn||!!Fe.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(yt=!0):(yt=!0,Fe.__version=K.version);let ri=Fe.currentProgram;yt===!0&&(ri=Dl(K,B,Y),F&&K.isNodeMaterial&&F.onUpdateProgram(K,ri,Fe));let Di=!1,As=!1,Br=!1,Ut=ri.getUniforms(),en=Fe.uniforms;if(E.useProgram(ri.program)&&(Di=!0,As=!0,Br=!0),K.id!==N&&(N=K.id,As=!0),Fe.needsLights){let Gt=m_(S.state.lightProbeGridArray,Y);Fe.lightProbeGrid!==Gt&&(Fe.lightProbeGrid=Gt,As=!0)}if(Di||Z!==T){E.buffers.depth.getReversed()&&T.reversedDepth!==!0&&(T._reversedDepth=!0,T.updateProjectionMatrix()),Ut.setValue(U,"projectionMatrix",T.projectionMatrix),Ut.setValue(U,"viewMatrix",T.matrixWorldInverse);let Cs=Ut.map.cameraPosition;Cs!==void 0&&Cs.setValue(U,de.setFromMatrixPosition(T.matrixWorld)),I.logarithmicDepthBuffer&&Ut.setValue(U,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(K.isMeshPhongMaterial||K.isMeshToonMaterial||K.isMeshLambertMaterial||K.isMeshBasicMaterial||K.isMeshStandardMaterial||K.isShaderMaterial)&&Ut.setValue(U,"isOrthographic",T.isOrthographicCamera===!0),Z!==T&&(Z=T,As=!0,Br=!0)}if(Fe.needsLights&&(Nn.state.sunShadowMap.length>0&&Ut.setValue(U,"sunShadowMap",Nn.state.sunShadowMap,ne),Nn.state.directionalShadowMap.length>0&&Ut.setValue(U,"directionalShadowMap",Nn.state.directionalShadowMap,ne),Nn.state.spotShadowMap.length>0&&Ut.setValue(U,"spotShadowMap",Nn.state.spotShadowMap,ne),Nn.state.pointShadowMap.length>0&&Ut.setValue(U,"pointShadowMap",Nn.state.pointShadowMap,ne)),Y.isSkinnedMesh){Ut.setOptional(U,Y,"bindMatrix"),Ut.setOptional(U,Y,"bindMatrixInverse");let Gt=Y.skeleton;Gt&&(Gt.boneTexture===null&&Gt.computeBoneTexture(),Ut.setValue(U,"boneTexture",Gt.boneTexture,ne))}Y.isBatchedMesh&&(Ut.setOptional(U,Y,"batchingTexture"),Ut.setValue(U,"batchingTexture",Y._matricesTexture,ne),Ut.setOptional(U,Y,"batchingIdTexture"),Ut.setValue(U,"batchingIdTexture",Y._indirectTexture,ne),Ut.setOptional(U,Y,"batchingColorTexture"),Y._colorsTexture!==null&&Ut.setValue(U,"batchingColorTexture",Y._colorsTexture,ne));let Rs=ee.morphAttributes;if((Rs.position!==void 0||Rs.normal!==void 0||Rs.color!==void 0)&&H.update(Y,ee,ri),(As||Fe.receiveShadow!==Y.receiveShadow)&&(Fe.receiveShadow=Y.receiveShadow,Ut.setValue(U,"receiveShadow",Y.receiveShadow)),(K.isMeshStandardMaterial||K.isMeshLambertMaterial||K.isMeshPhongMaterial)&&K.envMap===null&&B.environment!==null&&(en.envMapIntensity.value=B.environmentIntensity),en.dfgLUT!==void 0&&(en.dfgLUT.value=zS()),As){if(Ut.setValue(U,"toneMappingExposure",C.toneMappingExposure),Fe.needsLights&&b_(en,Br),Le&&K.fog===!0&&Be.refreshFogUniforms(en,Le),Be.refreshMaterialUniforms(en,K,j,q,S.state.transmissionRenderTarget[T.id]),Fe.needsLights&&Fe.lightProbeGrid){let Gt=Fe.lightProbeGrid;en.probesSH.value=Gt.texture,en.probesMin.value.copy(Gt.boundingBox.min),en.probesMax.value.copy(Gt.boundingBox.max),en.probesResolution.value.copy(Gt.resolution)}Ia.upload(U,Up(Fe),en,ne)}if(K.isShaderMaterial&&K.uniformsNeedUpdate===!0&&(Ia.upload(U,Up(Fe),en,ne),K.uniformsNeedUpdate=!1),K.isSpriteMaterial&&Ut.setValue(U,"center",Y.center),Ut.setValue(U,"modelViewMatrix",Y.modelViewMatrix),Ut.setValue(U,"normalMatrix",Y.normalMatrix),Ut.setValue(U,"modelMatrix",Y.matrixWorld),K.uniformsGroups!==void 0){let Gt=K.uniformsGroups;for(let Cs=0,Hr=Gt.length;Cs<Hr;Cs++){let Bp=Gt[Cs];ue.update(Bp,ri),ue.bind(Bp,ri)}}return ri}function b_(T,B){T.ambientLightColor.needsUpdate=B,T.lightProbe.needsUpdate=B,T.sunLights.needsUpdate=B,T.sunLightShadows.needsUpdate=B,T.directionalLights.needsUpdate=B,T.directionalLightShadows.needsUpdate=B,T.pointLights.needsUpdate=B,T.pointLightShadows.needsUpdate=B,T.spotLights.needsUpdate=B,T.spotLightShadows.needsUpdate=B,T.rectAreaLights.needsUpdate=B,T.hemisphereLights.needsUpdate=B}function __(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return te},this.setRenderTargetTextures=function(T,B,ee){let K=W.get(T);K.__autoAllocateDepthBuffer=T.resolveDepthBuffer===!1,K.__autoAllocateDepthBuffer===!1&&(K.__useRenderToTexture=!1),W.get(T.texture).__webglTexture=B,W.get(T.depthTexture).__webglTexture=K.__autoAllocateDepthBuffer?void 0:ee,K.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(T,B){let ee=W.get(T);ee.__webglFramebuffer=B,ee.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(T,B=0,ee=0){te=T,G=B,V=ee;let K=null,Y=!1,Le=!1;if(T){let Ie=W.get(T);if(Ie.__useDefaultFramebuffer!==void 0){E.bindFramebuffer(U.FRAMEBUFFER,Ie.__webglFramebuffer),ie.copy(T.viewport),be.copy(T.scissor),me=T.scissorTest,E.viewport(ie),E.scissor(be),E.setScissorTest(me),N=-1;return}else if(Ie.__webglFramebuffer===void 0)ne.setupRenderTarget(T);else if(Ie.__hasExternalTextures)ne.rebindTextures(T,W.get(T.texture).__webglTexture,W.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){let ut=T.depthTexture;if(Ie.__boundDepthTexture!==ut){if(ut!==null&&W.has(ut)&&(T.width!==ut.image.width||T.height!==ut.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ne.setupDepthRenderbuffer(T)}}let He=T.texture;(He.isData3DTexture||He.isDataArrayTexture||He.isCompressedArrayTexture)&&(Le=!0);let qe=W.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(qe[B])?K=qe[B][ee]:K=qe[B],Y=!0):T.samples>0&&ne.useMultisampledRTT(T)===!1?K=W.get(T).__webglMultisampledFramebuffer:Array.isArray(qe)?K=qe[ee]:K=qe,ie.copy(T.viewport),be.copy(T.scissor),me=T.scissorTest}else ie.copy(ae).multiplyScalar(j).floor(),be.copy(ge).multiplyScalar(j).floor(),me=et;if(ee!==0&&(K=O),E.bindFramebuffer(U.FRAMEBUFFER,K)&&E.drawBuffers(T,K),E.viewport(ie),E.scissor(be),E.setScissorTest(me),Y){let Ie=W.get(T.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+B,Ie.__webglTexture,ee)}else if(Le){let Ie=B;for(let He=0;He<T.textures.length;He++){let qe=W.get(T.textures[He]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+He,qe.__webglTexture,ee,Ie)}}else if(T!==null&&ee!==0){let Ie=W.get(T.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Ie.__webglTexture,ee)}N=-1};function Op(T){let B=W.get(T);return(B.__readFormat!==T.format||B.__readType!==T.type)&&(B.__readFormat=T.format,B.__readType=T.type,B.__formatReadable=I.textureFormatReadable(T.format),B.__typeReadable=I.textureTypeReadable(T.type)),B}this.readRenderTargetPixels=function(T,B,ee,K,Y,Le,Ue,Ie=0){if(!(T&&T.isWebGLRenderTarget)){Qe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let He=W.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Ue!==void 0&&(He=He[Ue]),He){E.bindFramebuffer(U.FRAMEBUFFER,He);try{let qe=T.textures[Ie],ut=qe.format,pt=qe.type;T.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+Ie);let ze=Op(qe);if(ze.__formatReadable===!1){Qe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(ze.__typeReadable===!1){Qe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=T.width-K&&ee>=0&&ee<=T.height-Y&&U.readPixels(B,ee,K,Y,Ee.convert(ut),Ee.convert(pt),Le)}finally{let qe=te!==null?W.get(te).__webglFramebuffer:null;E.bindFramebuffer(U.FRAMEBUFFER,qe)}}},this.readRenderTargetPixelsAsync=async function(T,B,ee,K,Y,Le,Ue,Ie=0){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let He=W.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Ue!==void 0&&(He=He[Ue]),He)if(B>=0&&B<=T.width-K&&ee>=0&&ee<=T.height-Y){E.bindFramebuffer(U.FRAMEBUFFER,He);let qe=T.textures[Ie],ut=qe.format,pt=qe.type;T.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+Ie);let ze=Op(qe);if(ze.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(ze.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ct=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Ct),U.bufferData(U.PIXEL_PACK_BUFFER,Le.byteLength,U.STREAM_READ),U.readPixels(B,ee,K,Y,Ee.convert(ut),Ee.convert(pt),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let on=te!==null?W.get(te).__webglFramebuffer:null;E.bindFramebuffer(U.FRAMEBUFFER,on);let Wt=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await d0(U,Wt,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Ct),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,Le),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Ct),U.deleteSync(Wt),Le}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(T,B=null,ee=0){let K=Math.pow(2,-ee),Y=Math.floor(T.image.width*K),Le=Math.floor(T.image.height*K),Ue=B!==null?B.x:0,Ie=B!==null?B.y:0;ne.setTexture2D(T,0),U.copyTexSubImage2D(U.TEXTURE_2D,ee,0,0,Ue,Ie,Y,Le),E.unbindTexture()},this.copyTextureToTexture=function(T,B,ee=null,K=null,Y=0,Le=0){let Ue,Ie,He,qe,ut,pt,ze,Ct,on,Wt=T.isCompressedTexture?T.mipmaps[Le]:T.image;if(ee!==null)Ue=ee.max.x-ee.min.x,Ie=ee.max.y-ee.min.y,He=ee.isBox3?ee.max.z-ee.min.z:1,qe=ee.min.x,ut=ee.min.y,pt=ee.isBox3?ee.min.z:0;else{let en=Math.pow(2,-Y);Ue=Math.floor(Wt.width*en),Ie=Math.floor(Wt.height*en),T.isDataArrayTexture?He=Wt.depth:T.isData3DTexture?He=Math.floor(Wt.depth*en):He=1,qe=0,ut=0,pt=0}K!==null?(ze=K.x,Ct=K.y,on=K.z):(ze=0,Ct=0,on=0);let Ot=Ee.convert(B.format),wn=Ee.convert(B.type),Fe;B.isData3DTexture?(ne.setTexture3D(B,0),Fe=U.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(ne.setTexture2DArray(B,0),Fe=U.TEXTURE_2D_ARRAY):(ne.setTexture2D(B,0),Fe=U.TEXTURE_2D),E.activeTexture(U.TEXTURE0),E.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,B.flipY),E.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),E.pixelStorei(U.UNPACK_ALIGNMENT,B.unpackAlignment);let Nn=E.getParameter(U.UNPACK_ROW_LENGTH),yt=E.getParameter(U.UNPACK_IMAGE_HEIGHT),ri=E.getParameter(U.UNPACK_SKIP_PIXELS),Di=E.getParameter(U.UNPACK_SKIP_ROWS),As=E.getParameter(U.UNPACK_SKIP_IMAGES);E.pixelStorei(U.UNPACK_ROW_LENGTH,Wt.width),E.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Wt.height),E.pixelStorei(U.UNPACK_SKIP_PIXELS,qe),E.pixelStorei(U.UNPACK_SKIP_ROWS,ut),E.pixelStorei(U.UNPACK_SKIP_IMAGES,pt);let Br=T.isDataArrayTexture||T.isData3DTexture,Ut=B.isDataArrayTexture||B.isData3DTexture;if(T.isDepthTexture){let en=W.get(T),Rs=W.get(B),Gt=W.get(en.__renderTarget),Cs=W.get(Rs.__renderTarget);E.bindFramebuffer(U.READ_FRAMEBUFFER,Gt.__webglFramebuffer),E.bindFramebuffer(U.DRAW_FRAMEBUFFER,Cs.__webglFramebuffer);for(let Hr=0;Hr<He;Hr++)Br&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,W.get(T).__webglTexture,Y,pt+Hr),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,W.get(B).__webglTexture,Le,on+Hr)),U.blitFramebuffer(qe,ut,Ue,Ie,ze,Ct,Ue,Ie,U.DEPTH_BUFFER_BIT,U.NEAREST);E.bindFramebuffer(U.READ_FRAMEBUFFER,null),E.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(Y!==0||T.isRenderTargetTexture||W.has(T)){let en=W.get(T),Rs=W.get(B);E.bindFramebuffer(U.READ_FRAMEBUFFER,L),E.bindFramebuffer(U.DRAW_FRAMEBUFFER,k);for(let Gt=0;Gt<He;Gt++)Br?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,en.__webglTexture,Y,pt+Gt):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,en.__webglTexture,Y),Ut?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Rs.__webglTexture,Le,on+Gt):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Rs.__webglTexture,Le),Y!==0?U.blitFramebuffer(qe,ut,Ue,Ie,ze,Ct,Ue,Ie,U.COLOR_BUFFER_BIT,U.NEAREST):Ut?U.copyTexSubImage3D(Fe,Le,ze,Ct,on+Gt,qe,ut,Ue,Ie):U.copyTexSubImage2D(Fe,Le,ze,Ct,qe,ut,Ue,Ie);E.bindFramebuffer(U.READ_FRAMEBUFFER,null),E.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else Ut?T.isDataTexture||T.isData3DTexture?U.texSubImage3D(Fe,Le,ze,Ct,on,Ue,Ie,He,Ot,wn,Wt.data):B.isCompressedArrayTexture?U.compressedTexSubImage3D(Fe,Le,ze,Ct,on,Ue,Ie,He,Ot,Wt.data):U.texSubImage3D(Fe,Le,ze,Ct,on,Ue,Ie,He,Ot,wn,Wt):T.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,Le,ze,Ct,Ue,Ie,Ot,wn,Wt.data):T.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,Le,ze,Ct,Wt.width,Wt.height,Ot,Wt.data):U.texSubImage2D(U.TEXTURE_2D,Le,ze,Ct,Ue,Ie,Ot,wn,Wt);E.pixelStorei(U.UNPACK_ROW_LENGTH,Nn),E.pixelStorei(U.UNPACK_IMAGE_HEIGHT,yt),E.pixelStorei(U.UNPACK_SKIP_PIXELS,ri),E.pixelStorei(U.UNPACK_SKIP_ROWS,Di),E.pixelStorei(U.UNPACK_SKIP_IMAGES,As),Le===0&&B.generateMipmaps&&U.generateMipmap(Fe),E.unbindTexture()},this.initRenderTarget=function(T){W.get(T).__webglFramebuffer===void 0&&ne.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?ne.setTextureCube(T,0):T.isData3DTexture?ne.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?ne.setTexture2DArray(T,0):ne.setTexture2D(T,0),E.unbindTexture()},this.resetState=function(){G=0,V=0,te=null,E.reset(),Ae.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return yi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ht._getDrawingBufferColorSpace(e),t.unpackColorSpace=ht._getUnpackColorSpace()}}});function Fa(i){let e=new Map,t=new Map,n=i.clone();return tg(i,n,function(s,r){e.set(r,s),t.set(s,r)}),n.traverse(function(s){if(!s.isSkinnedMesh)return;let r=s,a=e.get(s),o=a.skeleton.bones;r.skeleton=a.skeleton.clone(),r.bindMatrix.copy(a.bindMatrix),r.skeleton.bones=o.map(function(l){return t.get(l)}),r.bind(r.skeleton,r.bindMatrix)}),n}function tg(i,e,t){t(i,e);for(let n=0;n<i.children.length;n++)tg(i.children[n],e.children[n],t)}var Kh=Vt(()=>{});function Yh(i,e=!1){let t=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,l=new ot,c=0;for(let h=0;h<i.length;++h){let u=i[h],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in u.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[f]===void 0&&(a[f]=[]),a[f].push(u.morphAttributes[f])}if(e){let f;if(t)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(t){let h=0,u=[];for(let d=0;d<i.length;++d){let f=i[d].index;for(let p=0;p<f.count;++p)u.push(f.getX(p)+h);h+=i[d].attributes.position.count}l.setIndex(u)}for(let h in r){let u=ig(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(let h in a){let u=a[h][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){let f=[];for(let _=0;_<a[h].length;++_)f.push(a[h][_][d]);let p=ig(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(p)}}}return l}function ig(i){let e,t,n,s=-1,r=0;for(let c=0;c<i.length;++c){let h=i[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}let a=new e(r),o=new $e(a,t,n),l=0;for(let c=0;c<i.length;++c){let h=i[c];if(h.isInterleavedBufferAttribute){let u=l/t;for(let d=0,f=h.count;d<f;d++)for(let p=0;p<t;p++){let _=h.getComponent(d,p);o.setComponent(d+u,p,_)}}else a.set(h.array,l);l+=h.count*t}return s!==void 0&&(o.gpuType=s),o}function nf(i,e){if(e===Ad)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(e===Ra||e===sl){let t=i.getIndex();if(t===null){let r=[],a=i.getAttribute("position");if(a!==void 0){for(let o=0;o<a.count;o++)r.push(o);i.setIndex(r),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}let n=t.count-2,s=[];if(e===Ra)for(let r=1;r<=n;r++)s.push(t.getX(0)),s.push(t.getX(r)),s.push(t.getX(r+1));else for(let r=0;r<n;r++)r%2===0?(s.push(t.getX(r)),s.push(t.getX(r+1)),s.push(t.getX(r+2))):(s.push(t.getX(r+2)),s.push(t.getX(r+1)),s.push(t.getX(r)));return s.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),i.setIndex(s),i.clearGroups(),i}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),i}var Jh=Vt(()=>{St()});function rE(){let i={};return{get:function(e){return i[e]},add:function(e,t){i[e]=t},remove:function(e){delete i[e]},removeAll:function(){i={}}}}function sn(i,e,t){let n=i.json.materials[e];return n.extensions&&n.extensions[t]?n.extensions[t]:null}function lE(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new Ht({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Xi})),i.DefaultMaterial}function Pr(i,e,t){for(let n in t.extensions)i[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Qi(i,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(i.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function cE(i,e,t){let n=!1,s=!1,r=!1;for(let c=0,h=e.length;c<h;c++){let u=e[c];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(s=!0),u.COLOR_0!==void 0&&(r=!0),n&&s&&r)break}if(!n&&!s&&!r)return Promise.resolve(i);let a=[],o=[],l=[];for(let c=0,h=e.length;c<h;c++){let u=e[c];if(n){let d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):i.attributes.position;a.push(d)}if(s){let d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):i.attributes.normal;o.push(d)}if(r){let d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):i.attributes.color;l.push(d)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){let h=c[0],u=c[1],d=c[2];return n&&(i.morphAttributes.position=h),s&&(i.morphAttributes.normal=u),r&&(i.morphAttributes.color=d),i.morphTargetsRelative=!0,i})}function hE(i,e){if(i.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)i.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let n=0,s=t.length;n<s;n++)i.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function uE(i){let e,t=i.extensions&&i.extensions[ft.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+af(t.attributes):e=i.indices+":"+af(i.attributes)+":"+i.mode,i.targets!==void 0)for(let n=0,s=i.targets.length;n<s;n++)e+=":"+af(i.targets[n]);return e}function af(i){let e="",t=Object.keys(i).sort();for(let n=0,s=t.length;n<s;n++)e+=t[n]+":"+i[t[n]]+";";return e}function Pf(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function dE(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":i.search(/\.ktx2($|\?)/i)>0||i.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}function pE(i,e,t){let n=e.attributes,s=new yn;if(n.POSITION!==void 0){let o=t.json.accessors[n.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(s.set(new w(l[0],l[1],l[2]),new w(c[0],c[1],c[2])),o.normalized){let h=Pf(Ua[o.componentType]);s.min.multiplyScalar(h),s.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let o=new w,l=new w;for(let c=0,h=r.length;c<h;c++){let u=r[c];if(u.POSITION!==void 0){let d=t.json.accessors[u.POSITION],f=d.min,p=d.max;if(f!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),d.normalized){let _=Pf(Ua[d.componentType]);l.multiplyScalar(_)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(o)}i.boundingBox=s;let a=new Rn;s.getCenter(a.center),a.radius=s.min.distanceTo(s.max)/2,i.boundingSphere=a}function og(i,e,t){let n=e.attributes,s=[];function r(a,o){return t.getDependency("accessor",a).then(function(l){i.setAttribute(o,l)})}for(let a in n){let o=Cf[a]||a.toLowerCase();o in i.attributes||s.push(r(n[a],o))}if(e.indices!==void 0&&!i.index){let a=t.getDependency("accessor",e.indices).then(function(o){i.setIndex(o)});s.push(a)}return ht.workingColorSpace!==kn&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ht.workingColorSpace}" not supported.`),Qi(i,e),pE(i,e,t),Promise.all(s).then(function(){return e.targets!==void 0?cE(i,e.targets,t):i})}var Zh,ft,of,lf,cf,hf,uf,df,ff,pf,mf,gf,bf,_f,xf,vf,yf,Mf,$h,Sf,lg,ml,sg,Ef,wf,Tf,Af,Qh,aE,Rf,pi,Ua,rg,ag,sf,Cf,Ks,oE,rf,fE,If,cg=Vt(()=>{St();Jh();Kh();Zh=class extends Vi{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new hf(t)}),this.register(function(t){return new uf(t)}),this.register(function(t){return new vf(t)}),this.register(function(t){return new yf(t)}),this.register(function(t){return new Mf(t)}),this.register(function(t){return new ff(t)}),this.register(function(t){return new pf(t)}),this.register(function(t){return new mf(t)}),this.register(function(t){return new gf(t)}),this.register(function(t){return new cf(t)}),this.register(function(t){return new bf(t)}),this.register(function(t){return new df(t)}),this.register(function(t){return new xf(t)}),this.register(function(t){return new _f(t)}),this.register(function(t){return new of(t)}),this.register(function(t){return new $h(t,ft.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new $h(t,ft.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new Sf(t)})}load(e,t,n,s){let r=this,a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){let c=ys.extractUrlBase(e);a=ys.resolveURL(c,this.path)}else a=ys.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){s?s(c):console.error(c),r.manager.itemError(e),r.manager.itemEnd(e)},l=new ya(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{r.parse(c,a,function(h){t(h),r.manager.itemEnd(e)},o)}catch(h){o(h)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,s){let r,a={},o={},l=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===lg){try{a[ft.KHR_BINARY_GLTF]=new Ef(e)}catch(u){s&&s(u);return}r=JSON.parse(a[ft.KHR_BINARY_GLTF].content)}else r=JSON.parse(l.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new If(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){let u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case ft.KHR_MATERIALS_UNLIT:a[u]=new lf;break;case ft.KHR_DRACO_MESH_COMPRESSION:a[u]=new wf(r,this.dracoLoader);break;case ft.KHR_TEXTURE_TRANSFORM:a[u]=new Tf;break;case ft.KHR_MESH_QUANTIZATION:a[u]=new Af;break;default:d.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(n,s)}parseAsync(e,t){let n=this;return new Promise(function(s,r){n.parse(e,t,s,r)})}};ft={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},of=class{constructor(e){this.parser=e,this.name=ft.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,s=t.length;n<s;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,s=t.cache.get(n);if(s)return s;let r=t.json,l=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],c,h=new ye(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],kn);let u=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new vn(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new yr(h),c.distance=u;break;case"spot":c=new vr(h),c.distance=u,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),Qi(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),s=Promise.resolve(c),t.cache.add(n,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(l){return n._getNodeRef(t.cache,o,l)})}},lf=class{constructor(){this.name=ft.KHR_MATERIALS_UNLIT}getMaterialType(){return $t}extendParams(e,t,n){let s=[];e.color=new ye(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let a=r.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],kn),e.opacity=a[3]}r.baseColorTexture!==void 0&&s.push(n.assignTexture(e,"map",r.baseColorTexture,Tt))}return Promise.all(s)}},cf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);return n===null||n.emissiveStrength!==void 0&&(t.emissiveIntensity=n.emissiveStrength),Promise.resolve()}},hf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];if(n.clearcoatFactor!==void 0&&(t.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&s.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&s.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(s.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){let r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new $(r,r)}return Promise.all(s)}},uf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_DISPERSION}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);return n===null||(t.dispersion=n.dispersion!==void 0?n.dispersion:0),Promise.resolve()}},df=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return n.iridescenceFactor!==void 0&&(t.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&s.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture)),n.iridescenceIor!==void 0&&(t.iridescenceIOR=n.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),n.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&s.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture)),Promise.all(s)}},ff=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_SHEEN}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];if(t.sheenColor=new ye(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){let r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],kn)}return n.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&s.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,Tt)),n.sheenRoughnessTexture!==void 0&&s.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture)),Promise.all(s)}},pf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return n.transmissionFactor!==void 0&&(t.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&s.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture)),Promise.all(s)}},mf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_VOLUME}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0&&s.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture)),t.attenuationDistance=n.attenuationDistance||1/0;let r=n.attenuationColor||[1,1,1];return t.attenuationColor=new ye().setRGB(r[0],r[1],r[2],kn),Promise.all(s)}},gf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_IOR}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);return n===null||(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}},bf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_SPECULAR}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0&&s.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));let r=n.specularColorFactor||[1,1,1];return t.specularColor=new ye().setRGB(r[0],r[1],r[2],kn),n.specularColorTexture!==void 0&&s.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,Tt)),Promise.all(s)}},_f=class{constructor(e){this.parser=e,this.name=ft.EXT_MATERIALS_BUMP}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0&&s.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture)),Promise.all(s)}},xf=class{constructor(e){this.parser=e,this.name=ft.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return sn(this.parser,e,this.name)!==null?qn:null}extendMaterialParams(e,t){let n=sn(this.parser,e,this.name);if(n===null)return Promise.resolve();let s=[];return n.anisotropyStrength!==void 0&&(t.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(t.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&s.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture)),Promise.all(s)}},vf=class{constructor(e){this.parser=e,this.name=ft.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,s=n.textures[e];if(!s.extensions||!s.extensions[this.name])return null;let r=s.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,a)}},yf=class{constructor(e){this.parser=e,this.name=ft.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let a=r.extensions[t],o=s.images[a.source],l=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return n.loadTextureImage(e,a.source,l)}},Mf=class{constructor(e){this.parser=e,this.name=ft.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let a=r.extensions[t],o=s.images[a.source],l=n.textureLoader;if(o.uri){let c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return n.loadTextureImage(e,a.source,l)}},$h=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let s=n.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(o){let l=s.byteOffset||0,c=s.byteLength||0,h=s.count,u=s.byteStride,d=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(h,u,d,s.mode,s.filter).then(function(f){return f.buffer}):a.ready.then(function(){let f=new ArrayBuffer(h*u);return a.decodeGltfBuffer(new Uint8Array(f),h,u,d,s.mode,s.filter),f})})}else return null}},Sf=class{constructor(e){this.name=ft.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let s=t.meshes[n.mesh];for(let c of s.primitives)if(c.mode!==pi.TRIANGLES&&c.mode!==pi.TRIANGLE_STRIP&&c.mode!==pi.TRIANGLE_FAN&&c.mode!==void 0)return null;let a=n.extensions[this.name].attributes,o=[],l={};for(let c in a)o.push(this.parser.getDependency("accessor",a[c]).then(h=>(l[c]=h,l[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{let h=c.pop(),u=h.isGroup?h.children:[h],d=c[0].count,f=[];for(let p of u){let _=new De,g=new w,m=new Ke,x=new w(1,1,1),M=new Mo(p.geometry,p.material,d);for(let v=0;v<d;v++)l.TRANSLATION&&g.fromBufferAttribute(l.TRANSLATION,v),l.ROTATION&&m.fromBufferAttribute(l.ROTATION,v),l.SCALE&&x.fromBufferAttribute(l.SCALE,v),M.setMatrixAt(v,_.compose(g,m,x));let b=null;for(let v in l)if(v==="_COLOR_0"){let S=l[v];M.instanceColor=new ps(S.array,S.itemSize,S.normalized)}else if(v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"){if(b===null){let R=M.geometry;b=new ot,b.name=R.name;for(let y in R.attributes)b.setAttribute(y,R.attributes[y]);for(let y in R.morphAttributes)b.morphAttributes[y]=R.morphAttributes[y];R.index!==null&&b.setIndex(R.index),b.morphTargetsRelative=R.morphTargetsRelative;for(let y of R.groups)b.addGroup(y.start,y.count,y.materialIndex);R.boundingBox!==null&&(b.boundingBox=R.boundingBox.clone()),R.boundingSphere!==null&&(b.boundingSphere=R.boundingSphere.clone()),b.drawRange.start=R.drawRange.start,b.drawRange.count=R.drawRange.count,b.userData=Object.assign({},R.userData),M.geometry=b}let S=l[v];b.setAttribute(v,new ps(S.array,S.itemSize,S.normalized))}Xt.prototype.copy.call(M,p),this.parser.assignFinalMaterial(M),f.push(M)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},lg="glTF",ml=12,sg={JSON:1313821514,BIN:5130562},Ef=class{constructor(e){this.name=ft.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,ml),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==lg)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let s=this.header.length-ml,r=new DataView(e,ml),a=0;for(;a<s;){let o=r.getUint32(a,!0);a+=4;let l=r.getUint32(a,!0);if(a+=4,l===sg.JSON){let c=new Uint8Array(e,ml+a,o);this.content=n.decode(c)}else if(l===sg.BIN){let c=ml+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},wf=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ft.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(let h in a){let u=Cf[h]||h.toLowerCase();o[u]=a[h]}for(let h in e.attributes){let u=Cf[h]||h.toLowerCase();if(a[h]!==void 0){let d=n.accessors[e.attributes[h]],f=Ua[d.componentType];c[u]=f.name,l[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){s.decodeDracoFile(h,function(f){for(let p in f.attributes){let _=f.attributes[p],g=l[p];g!==void 0&&(_.normalized=g)}u(f)},o,c,kn,d)})})}},Tf=class{constructor(){this.name=ft.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){let n=Math.cos(e.rotation),s=Math.sin(e.rotation);e.matrix.set(e.repeat.x*n,e.repeat.y*s,e.offset.x,-e.repeat.x*s,e.repeat.y*n,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}},Af=class{constructor(){this.name=ft.KHR_MESH_QUANTIZATION}},Qh=class extends Gi{constructor(e,t,n,s){super(e,t,n,s)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let a=0;a!==s;a++)t[a]=n[r+a];return t}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,h=s-t,u=(n-t)/h,d=u*u,f=d*u,p=e*c,_=p-c,g=-2*f+3*d,m=f-d,x=1-g,M=m-d+u;for(let b=0;b!==o;b++){let v=a[_+b+o],S=a[_+b+l]*h,R=a[p+b+o],y=a[p+b]*h;r[b]=x*v+M*S+g*R+m*y}return r}},aE=new Ke,Rf=class extends Qh{interpolate_(e,t,n,s){let r=super.interpolate_(e,t,n,s);return aE.fromArray(r).normalize().toArray(r),r}},pi={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Ua={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},rg={9728:jt,9729:tn,9984:qc,9985:Ta,9986:Tr,9987:wi},ag={33071:oi,33648:oa,10497:xn},sf={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Cf={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Ks={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},oE={CUBICSPLINE:void 0,LINEAR:dr,STEP:ur},rf={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};fE=new De,If=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new rE,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,s=-1,r=!1,a=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;let l=o.match(/Version\/(\d+)/);s=n&&l?parseInt(l[1],10):-1,r=o.indexOf("Firefox")>-1,a=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&s<17||r&&a<98?this.textureLoader=new Wi(this.options.manager):this.textureLoader=new Ho(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new ya(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){let o={scene:a[0][s.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:s.asset,parser:n,userData:{}};return Pr(r,o,s),Qi(o,s),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(let l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){let a=t[s].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let s=0,r=e.length;s<r;s++){let a=e[s];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let s=n.clone(),r=(a,o)=>{let l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(let[c,h]of a.children.entries())r(h,o.children[c])};return r(n,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let s=e(t[n]);if(s)return s}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let s=0;s<t.length;s++){let r=e(t[s]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,s=this.cache.get(n);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(n,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ft.KHR_BINARY_GLTF].body);let s=this.options;return new Promise(function(r,a){n.load(ys.resolveURL(t.uri,s.path),r,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let s=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+s)})}loadAccessor(e){let t=this,n=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){let a=sf[s.type],o=Ua[s.componentType],l=s.normalized===!0,c=new o(s.count*a);return Promise.resolve(new $e(c,a,l))}let r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(a){let o=a[0],l=sf[s.type],c=Ua[s.componentType],h=c.BYTES_PER_ELEMENT,u=h*l,d=s.byteOffset||0,f=s.bufferView!==void 0?n.bufferViews[s.bufferView].byteStride:void 0,p=s.normalized===!0,_,g;if(f&&f!==u){let m=Math.floor(d/f),x="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+m+":"+s.count,M=t.cache.get(x);M||(_=new c(o,m*f,s.count*f/h),M=new pr(_,f/h),t.cache.add(x,M)),g=new ks(M,l,d%f/h,p)}else o===null?_=new c(s.count*l):_=new c(o,d,s.count*l),g=new $e(_,l,p);if(s.sparse!==void 0){let m=sf.SCALAR,x=Ua[s.sparse.indices.componentType],M=s.sparse.indices.byteOffset||0,b=s.sparse.values.byteOffset||0,v=new x(a[1],M,s.sparse.count*m),S=new c(a[2],b,s.sparse.count*l);o!==null&&(g=new $e(g.array.slice(),g.itemSize,g.normalized)),g.normalized=!1;for(let R=0,y=v.length;R<y;R++){let A=v[R];if(g.setX(A,S[R*l]),l>=2&&g.setY(A,S[R*l+1]),l>=3&&g.setZ(A,S[R*l+2]),l>=4&&g.setW(A,S[R*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}g.normalized=p}return g})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,a=t.images[r],o=this.textureLoader;if(a.uri){let l=n.manager.getHandler(a.uri);l!==null&&(o=l)}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){let s=this,r=this.json,a=r.textures[e],o=r.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=a.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);let d=(r.samplers||{})[a.sampler]||{};return h.magFilter=rg[d.magFilter]||tn,h.minFilter=rg[d.minFilter]||wi,h.wrapS=ag[d.wrapS]||xn,h.wrapT=ag[d.wrapT]||xn,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==jt&&h.minFilter!==tn,s.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let n=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let a=s.images[e],o=self.URL||self.webkitURL,l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=n.getDependency("bufferView",a.bufferView).then(function(u){c=!0;let d=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(d),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(l).then(function(u){return new Promise(function(d,f){let p=d;t.isImageBitmapLoader===!0&&(p=function(_){let g=new hn(_);g.needsUpdate=!0,d(g)}),t.load(ys.resolveURL(u,r.path),p,void 0,f)})}).then(function(u){return c===!0&&o.revokeObjectURL(l),Qi(u,a),u.userData.mimeType=a.mimeType||dE(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=h,h}assignTexture(e,t,n,s){let r=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),r.extensions[ft.KHR_TEXTURE_TRANSFORM]){let o=n.extensions!==void 0?n.extensions[ft.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let l=r.associations.get(a);a=r.extensions[ft.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),r.associations.set(a,l)}}return s!==void 0&&(a.colorSpace=s),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,n=e.material,s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+n.uuid,l=this.cache.get(o);l||(l=new ms,Cn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(o,l)),n=l}else if(e.isLine){let o="LineBasicMaterial:"+n.uuid,l=this.cache.get(o);l||(l=new Bs,Cn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(o,l)),n=l}if(s||r||a){let o="ClonedMaterial:"+n.uuid+":";s&&(o+="derivative-tangents:"),r&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=n.clone(),r&&(l.vertexColors=!0),a&&(l.flatShading=!0),s&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return Ht}loadMaterial(e){let t=this,n=this.json,s=this.extensions,r=n.materials[e],a,o={},l=r.extensions||{},c=[];if(l[ft.KHR_MATERIALS_UNLIT]){let u=s[ft.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),c.push(u.extendParams(o,r,t))}else{let u=r.pbrMetallicRoughness||{};if(o.color=new ye(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let d=u.baseColorFactor;o.color.setRGB(d[0],d[1],d[2],kn),o.opacity=d[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,Tt)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,o)})))}r.doubleSided===!0&&(o.side=Pn);let h=r.alphaMode||rf.OPAQUE;if(h===rf.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===rf.MASK&&(o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&a!==$t&&(c.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new $(1,1),r.normalTexture.scale!==void 0)){let u=r.normalTexture.scale;o.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&a!==$t&&(c.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&a!==$t){let u=r.emissiveFactor;o.emissive=new ye().setRGB(u[0],u[1],u[2],kn)}return r.emissiveTexture!==void 0&&a!==$t&&c.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Tt)),Promise.all(c).then(function(){let u=new a(o);return r.name&&(u.name=r.name),Qi(u,r),t.associations.set(u,{materials:e}),r.extensions&&Pr(s,u,r),u})}createUniqueName(e){let t=kt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,s=this.primitiveCache;function r(o){return n[ft.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return og(l,o,t)})}let a=[];for(let o=0,l=e.length;o<l;o++){let c=e[o],h=uE(c),u=s[h];if(u)a.push(u.promise);else{let d;c.extensions&&c.extensions[ft.KHR_DRACO_MESH_COMPRESSION]?d=r(c):d=og(new ot,c,t),c.mode===pi.TRIANGLE_STRIP?d=d.then(f=>nf(f,sl)):c.mode===pi.TRIANGLE_FAN&&(d=d.then(f=>nf(f,Ra))),s[h]={primitive:c,promise:d},a.push(d)}}return Promise.all(a)}loadMesh(e){let t=this,n=this.json,s=this.extensions,r=n.meshes[e],a=r.primitives,o=[];for(let l=0,c=a.length;l<c;l++){let h=a[l].material===void 0?lE(this.cache):this.getDependency("material",a[l].material);o.push(h)}return o.push(t.loadGeometries(a)),Promise.all(o).then(async function(l){let c=l.slice(0,l.length-1),h=l[l.length-1],u=[];for(let f=0,p=h.length;f<p;f++){let _=h[f],g=a[f],m,x=c[f];if(g.mode===pi.TRIANGLES||g.mode===pi.TRIANGLE_STRIP||g.mode===pi.TRIANGLE_FAN||g.mode===void 0){let M=r.isSkinnedMesh===!0,b=_.hasAttribute("skinIndex")&&_.hasAttribute("skinWeight");M&&b===!1&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),m=M&&b?new ds(_,x):new at(_,x),m.isSkinnedMesh===!0&&m.normalizeSkinWeights()}else if(g.mode===pi.LINES)m=new br(_,x);else if(g.mode===pi.LINE_STRIP)m=new gr(_,x);else if(g.mode===pi.LINE_LOOP)m=new So(_,x);else if(g.mode===pi.POINTS)m=new Hs(_,x);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+g.mode);Object.keys(m.geometry.morphAttributes).length>0&&hE(m,r),m.name=t.createUniqueName(r.name||"mesh_"+e),Qi(m,r),g.extensions&&Pr(s,m,g),t.assignFinalMaterial(m),u.push(m)}for(let f=0,p=u.length;f<p;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return r.extensions&&Pr(s,u[0],r),u[0];let d=new mt;r.extensions&&Pr(s,d,r),t.associations.set(d,{meshes:e});for(let f=0,p=u.length;f<p;f++)d.add(u[f]);return d})}loadCamera(e){let t,n=this.json.cameras[e],s=n[n.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new Yt(Pt.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):n.type==="orthographic"&&(t=new qi(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Qi(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let s=0,r=t.joints.length;s<r;s++)n.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(s){let r=s.pop(),a=s,o=[],l=[];for(let c=0,h=a.length;c<h;c++){let u=a[c];if(u){o.push(u);let d=new De;r!==null&&d.fromArray(r.array,c*16),l.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new fs(o,l)})}loadAnimation(e){let t=this.json,n=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,a=[],o=[],l=[],c=[],h=[];for(let u=0,d=s.channels.length;u<d;u++){let f=s.channels[u],p=s.samplers[f.sampler],_=f.target,g=_.node,m=s.parameters!==void 0?s.parameters[p.input]:p.input,x=s.parameters!==void 0?s.parameters[p.output]:p.output;_.node!==void 0&&(a.push(this.getDependency("node",g)),o.push(this.getDependency("accessor",m)),l.push(this.getDependency("accessor",x)),c.push(p),h.push(_))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(u){let d=u[0],f=u[1],p=u[2],_=u[3],g=u[4],m=[];for(let M=0,b=d.length;M<b;M++){let v=d[M],S=f[M],R=p[M],y=_[M],A=g[M];if(v===void 0)continue;v.updateMatrix&&v.updateMatrix();let C=n._createAnimationTracks(v,S,R,y,A);if(C)for(let D=0;D<C.length;D++)m.push(C[D])}let x=new jn(r,void 0,m);return Qi(x,s),x})}createNodeMesh(e){let t=this.json,n=this,s=t.nodes[e];return s.mesh===void 0?null:n.getDependency("mesh",s.mesh).then(function(r){let a=n._getNodeRef(n.meshCache,s.mesh,r);return s.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=s.weights.length;l<c;l++)o.morphTargetInfluences[l]=s.weights[l]}),a})}loadNode(e){let t=this.json,n=this,s=t.nodes[e],r=n._loadNodeShallow(e),a=[],o=s.children||[];for(let c=0,h=o.length;c<h;c++)a.push(n.getDependency("node",o[c]));let l=s.skin===void 0?Promise.resolve(null):n.getDependency("skin",s.skin);return Promise.all([r,Promise.all(a),l]).then(function(c){let h=c[0],u=c[1],d=c[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,fE)});for(let f=0,p=u.length;f<p;f++)h.add(u[f]);if(h.userData.pivot!==void 0&&u.length>0){let f=h.userData.pivot,p=u[0];h.pivot=new w().fromArray(f),h.position.x-=f[0],h.position.y-=f[1],h.position.z-=f[2],p.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){let t=this.json,n=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],a=r.name?s.createUniqueName(r.name):"",o=[],l=s._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),r.camera!==void 0&&o.push(s.getDependency("camera",r.camera).then(function(c){return s._getNodeRef(s.cameraCache,r.camera,c)})),s._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(r.isBone===!0?h=new Os:c.length>1?h=new mt:c.length===1?h=c[0]:h=new Xt,h!==c[0])for(let u=0,d=c.length;u<d;u++)h.add(c[u]);if(r.name&&(h.userData.name=r.name,h.name=a),Qi(h,r),r.extensions&&Pr(n,h,r),r.matrix!==void 0){let u=new De;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!s.associations.has(h))s.associations.set(h,{});else if(r.mesh!==void 0&&s.meshCache.refs[r.mesh]>1){let u=s.associations.get(h);s.associations.set(h,{...u})}return s.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],s=this,r=new mt;n.name&&(r.name=s.createUniqueName(n.name)),Qi(r,n),n.extensions&&Pr(t,r,n);let a=n.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(s.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let h=0,u=l.length;h<u;h++){let d=l[h];d.parent!==null?r.add(Fa(d)):r.add(d)}let c=h=>{let u=new Map;for(let[d,f]of s.associations)(d instanceof Cn||d instanceof hn)&&u.set(d,f);return h.traverse(d=>{let f=s.associations.get(d);f!=null&&u.set(d,f)}),u};return s.associations=c(r),r})}_createAnimationTracks(e,t,n,s,r){let a=[],o=e.name?e.name:e.uuid,l=[];function c(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}Ks[r.path]===Ks.weights?(c(e),e.isGroup&&e.children.forEach(c)):l.push(o);let h;switch(Ks[r.path]){case Ks.weights:h=_s;break;case Ks.rotation:h=ni;break;case Ks.translation:case Ks.scale:h=ui;break;default:n.itemSize===1?h=_s:h=ui;break}let u=s.interpolation!==void 0?oE[s.interpolation]:dr,d=this._getArrayFromAccessor(n);for(let f=0,p=l.length;f<p;f++){let _=new h(l[f]+"."+Ks[r.path],t.array,d,u);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(_),a.push(_)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=Pf(t.constructor),s=new Float32Array(t.length);for(let r=0,a=t.length;r<a;r++)s[r]=t[r]*n;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let s=this instanceof ni?Rf:Qh;return new s(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}});var hg,ug=Vt(()=>{hg=(function(){var i="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuixkbeeeddddillviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WboY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbrl79IV9Rbwq:VZkdbk:XYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz:jjjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbh5dnawTmbaxa8Acd4fRbbh5kcbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz:jjjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:kjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q:G:cjbfcj:G:cjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bwar9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfcbaicdfa8J9c8N1:NfghRbbag9cjjjjjw:dg8J9qE86bbarcVfcbaha8J9c8M1:NfghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fcbaha8J9c8N1:NfgiRbbag9cjjjjjw:dg8J9qE86bbarc96fcbaia8J9c8M1:NfgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbw83bwarai8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbaocl4h8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E94aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z:jjjjb8AazazcjdfaAcufad2fadz:jjjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:ysezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:kjjjb8Aav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk:4ioiue99dud99dud99dnaeTmbcbhiabhlindndnal8Uebgv:YgoJ:ji:1Salcof8UebgrciVgw:Y:vgDNJbbbZJbbb:;avcu9kEMgq:lJbbb9p9DTmbaq:Ohkxekcjjjj94hkkalclf8Uebhvalcdf8UebhxalarcefciGcetfak87ebdndnax:YgqaDNJbbbZJbbb:;axcu9kEMgm:lJbbb9p9DTmbam:Ohxxekcjjjj94hxkabaiarciGgkfcd7cetfax87ebdndnav:YgmaDNJbbbZJbbb:;avcu9kEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkalarcufciGcetfav87ebdndnawaw2:ZgPaPMaoaoN:taqaqN:tamamN:tgoJbbbbaoJbbbb9GE:raDNJbbbZMgD:lJbbb9p9DTmbaD:Ohrxekcjjjj94hrkalakcetfar87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk:Tvirud99eudndnadcl9hmbaeTmeindndnabRbbgiabcefgl8Sbbgvabcdfgo8Sbbgrf9R:YJbbuJabcifgwRbbgdce4adVgDcd4aDVgDcl4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax86bbdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao86bbdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai86bbdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad86bbabclfhbaecufgembxdkkaeTmbindndnab8Vebgiabcdfgl8Uebgvabclfgo8Uebgrf9R:YJbFu9habcofgw8Vebgdce4adVgDcd4aDVgDcl4aDVgDcw4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax87ebdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao87ebdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai87ebdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad87ebabcwfhbaecufgembkkk9teiucbcbyd:K:G:cjbgeabcifc98GfgbBd:K:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk83dbcj:Gdk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:K:Gdkl8W:qbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuixkbbebeeddddilve9Weeeviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WbwY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbDl79IV9Rbqq:W9Dklbzik94evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaeai86b:q:W:cjbaecitab8Piw83i:q:G:cjbaecefgecjd9hmbkk:JBl8Aud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaialfgxar9RhodnadTgmmbavaoad;8qbbkaicefhPcj;abad9Uc;WFbGcjdadca0EhsdndndnadTmbaoadfhzcbhHinaeaH9nmdaxaP9RaD6miabaHad2fhOaPaDfhAasaeaH9RaHasfae6EgCcsfgocl4cifcd4hXavcj;cbfaoc9WGgQcetfhLavcj;cbfaQci2fhKavcj;cbfaQfhYcbh8Aaoc;ab6hEincbh3dnawTmbaPa8Acd4fRbbh3kcbh5avcj;cbfh8Eindndndndna3a5cet4ciGgoc9:fPdebdkaxaA9RaQ6mwdnaQTmbavcj;cbfa5aQ2faAaQ;8qbbkaAaCfhAxdkaQTmeavcj;cbfa5aQ2fcbaQ;8kbxekaxaA9RaX6moaoclVcbawEhraAaXfhocbhidnaEmbaxao9Rc;Gb6mbcbhlina8EalfhidndndndndndnaAalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaoclffagRb:q:W:cjbfhoxikaiaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaocwffagRb:q:W:cjbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbahaocdffagRb:q:W:cjbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaoclffagRb:q:W:cjbfhoxikaiczfaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaocwffagRb:q:W:cjbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbahaocdffagRb:q:W:cjbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaoclffagRb:q:W:cjbfhoxikaicafaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbahaocwffagRb:q:W:cjbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbahaocdffagRb:q:W:cjbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbaiaoclffaqRb:q:W:cjbfhoxikaic8Wfaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spklbaiaocwffaqRb:q:W:cjbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitpbi:q:G:cjbaiRb:q:W:cjbgipsaoRbegqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqRb:q:W:cjbfhokalc;abfhialcjefaQ0meaihlaxao9Rc;Fb0mbkkdnaiaQ9pmbaici4hlinaxao9RcK6mwa8EaifhqdndndndndndnaAaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLg8Fcdp:mea8FpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogapxiiiiiiiiiiiiiiiip8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spkbbahaoclffagRb:q:W:cjbfhoxikaqaopbbwaopbbbg8Fclp:mea8FpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogapxssssssssssssssssp8Jg8Fp5b9cjF;8;4;W;G;ab9:9cU1:Nghcitpbi:q:G:cjbahRb:q:W:cjbghpsa8Fp5e9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPaaa8Fp9spkbbahaocwffagRb:q:W:cjbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbghcitpbi:q:G:cjbahRb:q:W:cjbghpsaoRbeggcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpkbbahaocdffagRb:q:W:cjbfhokalcdfhlaiczfgiaQ6mbkkaohAaoTmoka8EaQfh8Ea5cefg5cl9hmbkdndndndnawTmbaza8Acd4fRbbglciGPlbedwbkaQTmdavcjdfa8Afhlava8Afpbdbh8Jcbhoinalavcj;cbfaofpblbg8KaYaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaLaofpblbg8NaKaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLg8Fcep9Ta8Fpxeeeeeeeeeeeeeeeegap9op9Hp9rg8Fa8Jp9Ug8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9Abbbaladfgla8Ja8Ma8PpmwDKYqk8AExm35Ps8E8Fg8Fcep9Ta8Faap9op9Hp9rg8Fp9Ug8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9Abbbaladfgla8Ja8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLg8Fcep9Ta8Faap9op9Hp9rg8Fp9Ug8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp9Ug8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9Abbbaladfgla8Ja8Ka8LpmwDKYqk8AExm35Ps8E8Fg8Fcep9Ta8Faap9op9Hp9rg8Fp9Ugap9Abbbaladfglaaa8Fa8Fpmlvorlvorlvorlvorp9Ugap9Abbbaladfglaaa8Fa8FpmwDqkwDqkwDqkwDqkp9Ugap9Abbbaladfglaaa8Fa8FpmxmPsxmPsxmPsxmPsp9Ug8Jp9AbbbaladfhlaoczfgoaQ6mbxikkaQTmeavcjdfa8Afhlava8Afpbdbh8Jcbhoinalavcj;cbfaofpblbg8KaYaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaLaofpblbg8NaKaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLg8Fcep:nea8Fpxebebebebebebebebgap9op:bep9rg8Fa8Jp:oeg8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9Abbbaladfgla8Ja8Ma8PpmwDKYqk8AExm35Ps8E8Fg8Fcep:nea8Faap9op:bep9rg8Fp:oeg8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9Abbbaladfgla8Ja8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLg8Fcep:nea8Faap9op:bep9rg8Fp:oeg8Jp9Abbbaladfgla8Ja8Fa8Fpmlvorlvorlvorlvorp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmwDqkwDqkwDqkwDqkp:oeg8Jp9Abbbaladfgla8Ja8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9Abbbaladfgla8Ja8Ka8LpmwDKYqk8AExm35Ps8E8Fg8Fcep:nea8Faap9op:bep9rg8Fp:oegap9Abbbaladfglaaa8Fa8Fpmlvorlvorlvorlvorp:oegap9Abbbaladfglaaa8Fa8FpmwDqkwDqkwDqkwDqkp:oegap9Abbbaladfglaaa8Fa8FpmxmPsxmPsxmPsxmPsp:oeg8Jp9AbbbaladfhlaoczfgoaQ6mbxdkkaQTmbcbhocbalcl4gl9Rc8FGhiavcjdfa8Afhrava8Afpbdbhainaravcj;cbfaofpblbg8JaYaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaLaofpblbg8MaKaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Faip:Rea8Falp:Tep9qg8Faap9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9Abbbaradfgraaa8LaypmwDKYqk8AExm35Ps8E8Fg8Faip:Rea8Falp:Tep9qg8Fp9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9Abbbaradfgraaa8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Faip:Rea8Falp:Tep9qg8Fp9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9Abbbaradfgraaa8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Faip:Rea8Falp:Tep9qg8Fp9rgap9Abbbaradfgraaa8Fa8Fpmlvorlvorlvorlvorp9rgap9Abbbaradfgraaa8Fa8FpmwDqkwDqkwDqkwDqkp9rgap9Abbbaradfgraaa8Fa8FpmxmPsxmPsxmPsxmPsp9rgap9AbbbaradfhraoczfgoaQ6mbkka8Aclfg8Aad6mbkdnaCad2goTmbaOavcjdfao;8qbbkdnammbavavcjdfaCcufad2fad;8qbbkaCaHfhHc9:hoaAhPaAmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdasaeao9Raoasfae6Eaofgoae6mbkaial9RhPkcbc99axaP9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbkNsezu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbavaiaqaDcsGfRbbgscl4gP9RcsGcdtfydbaxcefgOaPEhDavaias9RcsGcdtfydbaOaPTgzfgOascsGgPEhsaPThPdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiazfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaPfhiaOaPfhxxekaxcbalRbbgsEgHaDc;:eSgDfhOascsGhAdndnascl4gCmbaOcefhzxekaOhzavaiaC9RcsGcdtfydbhOkdndnaAmbazcefhxxekazhxavaias9RcsGcdtfydbhzkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhHascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaHhDxekaDcefhDkasce4cbasceG9R7amfgmhHkdndnaCcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhOaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkaOhsxekascefhskaPce4cbaPceG9R7amfgmhOkdndnaAcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhzaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkazhlxekalcefhlkaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabarcetfgDaH87ebaDclfaz87ebaDcdfaO87ebxekabarcdtfgDaHBdbaDcwfazBdbaDclfaOBdbkavc;abfaocitfgDaOBdbaDaHBdlavaicdtfaHBdbavc;abfaocefcsGcitfgDazBdbaDaOBdlavaicefgicsGcdtfaOBdbavc;abfaocdfcsGcitfgDaHBdbaDazBdlavaiaCTaCcsSVfgicsGcdtfazBdbaiaATaAcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk;Toio97eue97aec98Ghedndnadcl9hmbaeTmecbhdinababpbbbgicKp:RecKp:Sep;6eglaicwp:RecKp:Sep;6ealp;Geaiczp:RecKp:Sep;6egvp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgwp9op9rp;Keglpxbb;:9cbb;:9cbb;:9cbb;:9calalp;Meaoaop;Meavaravawp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFbbbFbbbFbbbFbbbp9oaipxbbbFbbbFbbbFbbbFp9op9qalavp;Mearp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaoavp;Mearp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgDaDpbbbgipxbbbbbbFFbbbbbbFFgwp9oabpbbbgoaipmbediwDqkzHOAKY8AEgvczp:Reczp:Sep;6eglaoaipmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eavczp:Sep;6egvp;Gealp;Gep;Kep;Legipxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgqp9op9rp;Keglpxb;:FSb;:FSb;:FSb;:FSalalp;Meaiaip;Meavaravaqp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbp9oaiavp;Mearp;Keczp:Rep9qgialavp;Mearp;KepxFFbbFFbbFFbbFFbbp9oglpmwDKYqk8AExm35Ps8E8Fp9qpkbbabaoawp9oaialpmbezHdiOAlvCXorQLp9qpkbbabcafhbadclfgdae6mbkkk;2ileue97euo97dnaec98GgiTmbcbheinabcKfpx:ji:1S:ji:1S:ji:1S:ji:1SabpbbbglabczfgvpbbbgopmlvorxmPsCXQL358E8Fgrczp:Segwpxibbbibbbibbbibbbp9qp;6egDp;NegqaDaDp;MegDaDp;KealaopmbediwDqkzHOAKY8AEgDczp:Reczp:Sep;6eglalp;MeaDczp:Sep;6egoaop;Mearczp:Reczp:Sep;6egrarp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jep;Mepxbbn0bbn0bbn0bbn0gDp;KepxFFbbFFbbFFbbFFbbgkp9oaqaop;MeaDp;Keczp:Rep9qgoaqalp;MeaDp;Keakp9oaqarp;MeaDp;Keczp:Rep9qgDpmwDKYqk8AExm35Ps8E8Fglp5eawclp:RegqpEi:T:j83ibavalp5baqpEd:T:j83ibabcwfaoaDpmbezHdiOAlvCXorQLgDp5eaqpEe:T:j83ibabaDp5baqpEb:T:j83ibabcafhbaeclfgeai6mbkkkuee97dnadcd4ae2c98GgeTmbcbhdinababpbbbgicwp:Recwp:Sep;6eaicep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbabczfhbadclfgdae6mbkkk:Sodw97euaec98Ghedndnadcl9hmbaeTmecbhdinabpxbbuJbbuJbbuJbbuJabpbbbgicKp:TeglaicYp:Tep9qgvcdp:Teavp9qgvclp:Teavp9qgop;6ep;Negvaicwp:RecKp:SegraipxFbbbFbbbFbbbFbbbgwp9ogDp:Uep;6ep;Mepxbbn0bbn0bbn0bbn0gqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9oavaDarp:Xeaiczp:RecKp:Segip:Uep;6ep;Meaqp;Keawp9op9qavaDaraip:Uep:Xep;6ep;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qavaoalcep:Rep9oalpxebbbebbbebbbebbbp9op9qp;6ep;Meaqp;KecKp:Rep9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgkpxbFu9hbFu9hbFu9hbFu9habpbbbglakpbbbgrpmlvorxmPsCXQL358E8Fgvczp:TegqavcHp:Tep9qgicdp:Teaip9qgiclp:Teaip9qgicwp:Teaip9qgop;6ep;NegialarpmbediwDqkzHOAKY8AEgDpxFFbbFFbbFFbbFFbbglp9ograDczp:Segwp:Ueavczp:Reczp:SegDp:Xep;6ep;Mepxbbn0bbn0bbn0bbn0gvp;Kealp9oaiarawaDp:Uep:Xep;6ep;Meavp;Keczp:Rep9qgwaiaoaqcep:Rep9oaqpxebbbebbbebbbebbbp9op9qp;6ep;Meavp;Keczp:ReaiaDarp:Uep;6ep;Meavp;Kealp9op9qgipmwDKYqk8AExm35Ps8E8FpkbbabawaipmbezHdiOAlvCXorQLpkbbabcafhbadclfgdae6mbkkk9teiucbcbydj:G:cjbgeabcifc98GfgbBdj:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkxebcj:Gdklz:zbb",t=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),n=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var s=WebAssembly.validate(t)?o(e):o(i),r,a=WebAssembly.instantiate(s,{}).then(function(m){r=m.instance,r.exports.__wasm_call_ctors()});function o(m){for(var x=new Uint8Array(m.length),M=0;M<m.length;++M){var b=m.charCodeAt(M);x[M]=b>96?b-97:b>64?b-39:b+4}for(var v=0,M=0;M<m.length;++M)x[v++]=x[M]<60?n[x[M]]:(x[M]-60)*64+x[++M];return x.buffer.slice(0,v)}function l(m,x,M,b,v,S,R){var y=m.exports.sbrk,A=b+3&-4,C=y(A*v),D=y(S.length),F=new Uint8Array(m.exports.memory.buffer);F.set(S,D);var O=x(C,b,v,D,S.length);if(O==0&&R&&R(C,A,v),M.set(F.subarray(C,C+b*v)),y(C-y(0)),O!=0)throw new Error("Malformed buffer data: "+O)}var c={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp",COLOR:"meshopt_decodeFilterColor"},h={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},u=[],d=0;function f(m){var x={object:new Worker(m),pending:0,requests:{}};return x.object.onmessage=function(M){var b=M.data;x.pending-=b.count,x.requests[b.id][b.action](b.value),delete x.requests[b.id]},x}function p(m){for(var x="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(s)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+g.name+";"+l.toString()+g.toString(),M=new Blob([x],{type:"text/javascript"}),b=URL.createObjectURL(M),v=u.length;v<m;++v)u[v]=f(b);for(var v=m;v<u.length;++v)u[v].object.postMessage({});u.length=m,URL.revokeObjectURL(b)}function _(m,x,M,b,v){for(var S=u[0],R=1;R<u.length;++R)u[R].pending<S.pending&&(S=u[R]);return new Promise(function(y,A){var C=new Uint8Array(M),D=++d;S.pending+=m,S.requests[D]={resolve:y,reject:A},S.object.postMessage({id:D,count:m,size:x,source:C,mode:b,filter:v},[C.buffer])})}function g(m){var x=m.data;self.ready.then(function(M){if(!x.id)return self.close();try{var b=new Uint8Array(x.count*x.size);l(M,M.exports[x.mode],b,x.count,x.size,x.source,M.exports[x.filter]),self.postMessage({id:x.id,count:x.count,action:"resolve",value:b},[b.buffer])}catch(v){self.postMessage({id:x.id,count:x.count,action:"reject",value:v})}})}return{ready:a,supported:!0,useWorkers:function(m){p(m)},decodeVertexBuffer:function(m,x,M,b,v){l(r,r.exports.meshopt_decodeVertexBuffer,m,x,M,b,r.exports[c[v]])},decodeIndexBuffer:function(m,x,M,b){l(r,r.exports.meshopt_decodeIndexBuffer,m,x,M,b)},decodeIndexSequence:function(m,x,M,b){l(r,r.exports.meshopt_decodeIndexSequence,m,x,M,b)},decodeGltfBuffer:function(m,x,M,b,v,S){l(r,r.exports[h[v]],m,x,M,b,r.exports[c[S]])},decodeGltfBufferAsync:function(m,x,M,b,v){return u.length>0?_(m,x,M,h[b],c[v]):a.then(function(){var S=new Uint8Array(m*x);return l(r,r.exports[h[b]],S,m,x,M,r.exports[c[v]]),S})}}})()});function mE(i){let e=i.slice(i.indexOf(",")+1);if(Uint8Array.fromBase64)return Uint8Array.fromBase64(e).buffer;let t=atob(e),n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n.buffer}function pg(i){fg=i}function Ys(i){return Df.has(i)||Df.set(i,dg.loadAsync(i)),Df.get(i)}function gt(i){return bE(`props/${i}`)}async function bE(i){let t=(await Ys(`assets/${i}.json`)).scene.clone(!0);return t.traverse(n=>{n.isMesh&&(n.castShadow=!0,n.receiveShadow=!0)}),t}function _E(i,e){if(!Lf.has(i)){let t=gE.load(i);t.wrapS=t.wrapT=xn,t.colorSpace=e?Tt:si,t.anisotropy=fg,Lf.set(i,t)}return Lf.get(i)}function mn(i,{repeat:e=[1,1],tint:t=16777215,normalScale:n=1,roughness:s=1,ao:r=!0,rotation:a=0}={}){let o=(c,h)=>{let u=_E(`assets/tex/${i}_${c}.webp`,h).clone();return u.repeat.set(e[0],e[1]),u.rotation=a,u.center.set(.5,.5),u.needsUpdate=!0,u},l=new Ht({map:o("diff",!0),normalMap:o("nor",!1),roughnessMap:o("rough",!1),roughness:s,color:t,metalness:0});return l.normalScale.set(n,n),r&&(l.aoMap=o("ao",!1),l.aoMapIntensity=.9),l}var Ai,dg,gE,Df,Lf,fg,ka=Vt(()=>{St();cg();ug();Ai=new va,dg=new Zh(Ai).setMeshoptDecoder(hg);dg.register(i=>{let e=i.loadBuffer.bind(i);return i.loadBuffer=t=>{let n=i.json.buffers[t];return n.uri&&n.uri.startsWith("data:")?Promise.resolve(mE(n.uri)):e(t)},i.textureLoader=new Wi(i.options.manager),i.textureLoader.setCrossOrigin(i.options.crossOrigin),{name:"mdg_recursos_embebidos"}});gE=new Wi(Ai),Df=new Map,Lf=new Map,fg=4});var Hf,Cg,eu,EE,Ba,zf,Gf,Pg,Ig,tu=Vt(()=>{Hf=new Set(["idle","idle_combat","idle_alt","walk","run","sprint","walk_back","crouch_idle","crouch_walk","talk","sit","sit_talk","sit_floor","prone","kneel","down_idle","sneak","crouch","downed","dance","torch","push","eat","blocking","casting","aim","swim","sleep","fly","inactive"]),Cg={idle_combat:"idle",idle_alt:"idle",sprint:"run",run:"walk",walk_back:"walk",crouch_walk:"walk",crouch_idle:"idle",attack_2h:"attack_melee",attack_unarmed:"attack_melee",attack_ranged:"attack_melee",attack_thrown:"attack_ranged",attack_bite:"attack_melee",cast:"attack_ranged",cast_buff:"cast",cast_long:"cast",cast_summon:"cast_buff",casting:"idle_combat",block:"hit",blocking:"idle_combat",dodge:"hit",taunt:"cheer",cheer:"idle",dance:"cheer",down:"die",prone:"down_idle",kneel:"prone",down_idle:"idle",revive:"idle",awaken:"idle",interact:"idle",pickup:"interact",use:"interact",talk:"idle",sit:"idle",sit_talk:"sit",sit_floor:"sit",sit_down:"sit",stand_up:"idle",torch:"idle",sneak:"crouch_walk",crouch:"crouch_idle",downed:"prone",attack:"attack_melee",shoot:"attack_ranged",spell:"cast",push:"idle",jump:"idle",roll:"dodge",eat:"idle_alt",aim:"idle_combat",sleep:"prone",inactive:"idle"},eu={Idle_Loop:"idle",Sword_Idle:"idle_combat",Spell_Simple_Idle_Loop:"idle_combat",Walk_Loop:"walk",Jog_Fwd_Loop:"run",Sprint_Loop:"sprint",Sword_Attack:"attack_melee",Punch_Jab:"attack_thrown",Spell_Simple_Shoot:"cast",Pistol_Shoot:"attack_ranged",Hit_Chest:"hit",Hit_Head:"hit",Death01:"die",Crouch_Idle_Loop:"crouch_idle",Crouch_Fwd_Loop:"crouch_walk",Roll:"dodge",Interact:"interact",Idle_Talking_Loop:"talk",Sitting_Idle_Loop:"sit",Sitting_Talking_Loop:"sit_talk",Dance_Loop:"dance",Idle_Torch_Loop:"torch"},EE=["K_1H_Melee_Attack_Chop","K_1H_Melee_Attack_Slice_Diagonal","K_1H_Melee_Attack_Stab","Sword_Attack"],Ba={idle:["Idle_Loop"],idle_combat:["Sword_Idle"],idle_alt:["K_Idle_B"],walk:["Walk_Loop"],run:["Jog_Fwd_Loop"],sprint:["Sprint_Loop"],walk_back:["K_Walking_Backwards"],attack_melee:EE,attack_2h:["K_2H_Melee_Attack_Chop","K_2H_Melee_Attack_Slice","K_2H_Melee_Attack_Stab"],attack_unarmed:["K_Unarmed_Melee_Attack_Punch_A","Punch_Cross","K_Unarmed_Melee_Attack_Kick"],attack_ranged:["K_1H_Ranged_Shoot"],attack_thrown:["K_Throw"],aim:["K_1H_Ranged_Aiming"],cast:["K_Spellcast_Shoot","Spell_Simple_Shoot"],cast_buff:["K_Spellcast_Raise"],cast_long:["K_Spellcast_Long"],cast_summon:["K_Spellcast_Summon"],casting:["K_Spellcasting"],hit:["Hit_Chest","K_Hit_A","Hit_Head","K_Hit_B"],block:["K_Block_Hit"],blocking:["K_Blocking"],dodge:["K_Dodge_Backward","K_Dodge_Left","K_Dodge_Right"],roll:["Roll"],die:["K_Death_A","K_Death_B","Death01"],down:["K_Lie_Down"],prone:["K_Lie_Idle"],down_idle:["K_Lie_Idle"],kneel:["Fixing_Kneeling"],revive:["K_Lie_StandUp"],crouch_idle:["Crouch_Idle_Loop"],crouch_walk:["Crouch_Fwd_Loop"],interact:["Interact","K_Interact"],pickup:["K_PickUp","PickUp_Table"],use:["K_Use_Item"],talk:["Idle_Talking_Loop"],cheer:["K_Cheer"],taunt:["K_Taunt"],dance:["Dance_Loop"],sit:["Sitting_Idle_Loop"],sit_talk:["Sitting_Talking_Loop"],sit_down:["Sitting_Enter"],stand_up:["Sitting_Exit"],sit_floor:["K_Sit_Floor_Idle"],sit_floor_down:["K_Sit_Floor_Down"],sit_floor_up:["K_Sit_Floor_StandUp"],torch:["Idle_Torch_Loop"],push:["Push_Loop"],jump:["Jump_Start"],awaken:["K_Skeletons_Awaken_Standing"]},zf={unarmed:{idle_combat:["K_Unarmed_Idle"],attack_melee:["K_Unarmed_Melee_Attack_Punch_A","Punch_Cross","K_Unarmed_Melee_Attack_Kick","Punch_Jab"]},"1h":{},shield:{block:["K_Block_Hit"]},"2h":{idle_combat:["K_2H_Melee_Idle"],attack_melee:["K_2H_Melee_Attack_Chop","K_2H_Melee_Attack_Slice","K_2H_Melee_Attack_Stab"]},polearm:{idle_combat:["K_2H_Melee_Idle"],attack_melee:["K_2H_Melee_Attack_Stab","K_2H_Melee_Attack_Chop"]},dual:{attack_melee:["K_Dualwield_Melee_Attack_Chop","K_Dualwield_Melee_Attack_Stab","K_1H_Melee_Attack_Slice_Diagonal"]},bow:{attack_ranged:["P_Bow_Shoot"],aim:["P_Bow_Aim"],idle_combat:["P_Bow_Ready"]},crossbow:{attack_ranged:["K_2H_Ranged_Shoot"],aim:["K_2H_Ranged_Aiming"]},staff:{idle_combat:["Spell_Simple_Idle_Loop"],attack_melee:["K_2H_Melee_Attack_Chop","K_1H_Melee_Attack_Chop"]},caster:{idle_combat:["Spell_Simple_Idle_Loop"],attack_melee:["K_1H_Melee_Attack_Chop","K_1H_Melee_Attack_Stab"]}},Gf={skeleton:{walk:["K_Walking_D_Skeletons"],run:["Jog_Fwd_Loop"],die:["K_Death_B","K_Death_A"],revive:["K_Lie_StandUp"],awaken:["K_Skeletons_Awaken_Standing"],inactive:["K_Lie_Idle"],cheer:["K_Taunt"]},zombie:{idle:["K_Idle_B"],idle_combat:["K_Unarmed_Idle"],walk:["K_Walking_D_Skeletons"],run:["K_Walking_D_Skeletons"],attack_melee:["Punch_Cross","K_Unarmed_Melee_Attack_Punch_A"],die:["K_Death_B","Death01"],cheer:["K_Taunt"]},goblin:{idle:["Idle_Loop","K_Idle_B"],walk:["K_Walking_C","Walk_Loop"],cheer:["K_Cheer","K_Taunt"]}},Pg={idle:["Idle","Idle_2"],idle_combat:["Idle_2","Idle"],idle_alt:["Idle_2_HeadLow","Idle_Headlow","Idle_2"],eat:["Eating"],walk:["Walk"],run:["Gallop"],sprint:["Gallop"],attack_melee:["Attack","Attack_Headbutt","Attack_Kick"],attack_bite:["Attack"],hit:["Idle_HitReact1","Idle_HitReact2"],dodge:["Idle_HitReact2"],die:["Death"],jump:["Gallop_Jump","Jump_toIdle"],cheer:["Idle_2"],taunt:["Idle_2"],sleep:["Death"]},Ig={idle:["Idle","Armature|Idle"],walk:["Walk","Armature|Walk","Idle","Armature|Idle"],eat:["Eating","Idle","Armature|Idle"]}});var Vf,Dg=Vt(()=>{Vf={Death01:[.04898,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.01,.023,.036,.047,.058,.06,.062,.066,.074,.081,.086,.089,.089,.088,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087,.087]],Fixing_Kneeling:[.05,[0,0,0,0,0,0,0,0,0,0,.01,.023,.037,.052,.065,.068,.067,.065,.063,.062,.062,.062,.062,.062,.062,.061,.061,.061,.061,.061,.061,.061,.061,.062,.062,.062,.063,.063,.063,.064,.064,.064,.065,.065,.065,.065,.065,.066,.066,.066,.066,.066,.066,.066,.065,.065,.065,.065,.064,.063,.063,.063,.062,.062,.062,.062,.062,.062,.062,.062,.062,.062,.062,.062,.062,.062,.063,.063,.063,.063,.062,.061,.059,.058,.056,.052,.048,.036,.025,.011,.002,-.005,-.005,-.005,0,0,0,0,0,0,0,0,0,0,0]],Jump_Loop:[.05,[.148,.149,.15,.151,.152,.152,.152,.152,.151,.15,.148,.146,.143,.14,.137,.134,.131,.127,.124,.12,.117,.113,.11,.107,.105,.102,.101,.099,.098,.098,.098,.098,.099,.1,.102,.104,.106,.109,.112,.115,.118,.121,.124,.127,.13,.133,.136,.139,.141,.143,.144]],Jump_Start:[.04938,[.037,.069,.073,.073,.058,.033,-.01,-.035,-.036,-.029,-.018,-.007,-.001,0,0,0,.009,.023,.043,.066,.091,.109,.123,.132,.139,.143,.144,.146]],Roll:[.04889,[0,0,-.018,-.096,-.206,-.26,-.26,-.242,-.164,-.054,0,0,.018,.018,.018,.018,.018,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],K_Dualwield_Melee_Attack_Stab:[.04848,[0,.008,.013,.02,.028,.035,.029,.022,.015,.007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],K_Spellcast_Summon:[.04943,[.013,.023,.028,.036,.036,.028,.018,.008,0,.007,.015,.023,.032,.041,.043,.044,.044,.044,.044,.044,.043,.042,.033,.024,.016,.007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.006,.014,.022,.03,.039,.042,.044,.045,.045,.046,.046,.046,.046,.046,.046,.046,.045,.043,.04,.03,.022,.013,.006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],K_Hit_B:[.04815,[.01,.02,.025,.032,.04,.044,.044,.046,.049,.05,.047,.037,.026,.016,.007,0,0,0,0]],K_Death_A:[.04706,[.011,-.001,-.055,-.149,-.255,-.346,-.382,-.337,-.226,-.099,.007,.073,.103,.109,.11,.11,.11,.11]],K_Death_B:[.04969,[0,.008,.014,.027,.049,.079,.113,.153,.192,.223,.242,.248,.241,.224,.202,.179,.158,.142,.132,.128,.127,.128,.13,.131,.134,.136,.137,.137,.133,.116,.088,.044,-.006,-.056,-.092,-.119,-.129,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132,-.132]],K_Skeletons_Awaken_Standing:[.05,[.034,.026,.021,.013,.006,-.112,-.297,-.496,-.69,-.804,-.706,-.521,-.323,-.128,-.015,0,0,0,0,0,0]],K_Taunt:[.04921,[0,0,0,0,-.062,-.187,-.357,-.543,-.742,-.863,-.835,-.669,-.483,-.284,-.101,-.004,0,0,0,0,0,0]],K_Throw:[.04881,[0,0,0,0,0,0,0,0,0,0,0,.011,.026,.026,.026,.026,.015,0,0,0,0,0,0,0,0,0,0,0,0]],K_Lie_Down:[.05,[0,-.007,-.014,-.027,-.041,-.054,-.058,-.049,-.029,.004,.042,.079,.109,.129,.139,.14,.133,.117,.089,.061,.025,-.016,-.059,-.098,-.147,-.193,-.238,-.279,-.316,-.349,-.377,-.398,-.413,-.424,-.43,-.435,-.441,-.447,-.452,-.457,-.46,-.462,-.463,-.464,-.464,-.464,-.464,-.464,-.464,-.464,-.464,-.464,-.464,-.464,-.465,-.465,-.465,-.465,-.465,-.465,-.465]],K_Lie_Idle:[.04938,[-.465,-.465,-.465,-.466,-.466,-.466,-.466,-.466,-.466,-.466,-.466,-.466,-.467,-.468,-.468,-.469,-.47,-.471,-.472,-.473,-.474,-.475,-.476,-.477,-.478,-.479,-.48,-.481,-.482,-.482,-.483,-.484,-.484,-.484,-.484,-.484,-.483,-.483,-.482,-.481,-.48,-.478,-.477,-.476,-.475,-.473,-.472,-.471,-.47,-.469,-.468,-.467,-.466,-.466,-.466]],K_Lie_StandUp:[.04965,[-.463,-.461,-.459,-.452,-.441,-.426,-.407,-.384,-.361,-.337,-.316,-.295,-.27,-.241,-.207,-.169,-.128,-.086,-.053,-.019,.014,.044,.068,.095,.115,.129,.137,.139,.133,.117,.088,.054,.018,-.016,-.041,-.053,-.056,-.053,-.046,-.037,-.026,-.017,-.01,-.004,0,0,0,0]],K_Sit_Floor_Down:[.05,[-.008,-.017,-.028,-.039,-.039,-.02,.015,.057,.098,.127,.141,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145]],K_Sit_Floor_Idle:[.05,[.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.145,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.144,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.143,.144,.144,.144,.144,.145,.145,.145]],K_Sit_Floor_StandUp:[.04928,[.136,.125,.109,.08,.045,.012,-.015,-.033,-.041,-.041,-.039,-.036,-.032,-.028,-.021,-.014,-.009,-.004,0,0,0,0,0,0]],K_Running_A:[.04706,[-.027,-.02,-.016,0,-.005,-.013,-.025,-.034,-.034,-.03,-.013,0,.009,0,-.008,-.033,-.041,-.055]]}});function Lg(){return Wf||(Wf=Ys("assets/chars/humanos.json").then(i=>{i.scene.traverse(n=>{n.userData&&n.userData.n&&(n.name=n.userData.n)}),i.scene.updateMatrixWorld(!0);let e=new Map;i.scene.traverse(n=>{if(!n.isSkinnedMesh)return;let s=n;for(;s&&!/^(m|f|pelo)_/.test(s.name);)s=s.parent;let r=s?s.name:n.name;e.has(r)||e.set(r,[]),e.get(r).push(n)});let t=n=>i.scene.getObjectByName(`humano_${n}`).children.find(r=>r.isBone||r.name==="root");return{gltf:i,parts:e,rootBone:{m:t("m"),f:t("f")}}})),Wf}function Ng(){return qf||(qf=Ys("assets/chars/anims.json").then(i=>{let e=new Map,t=i.animations.find(r=>r.name==="Idle_Loop")?.tracks.find(r=>r.name==="pelvis.position"),n=t?Array.from(t.values.slice(0,3)):[0,0,jf],s=[0,1,2].reduce((r,a)=>Math.abs(n[a])>Math.abs(n[r])?a:r,0);for(let r of i.animations){let a=r.tracks.filter(l=>l.name.endsWith(".scale")?!1:l.name.endsWith(".position")?l.name.startsWith("pelvis."):!l.name.startsWith("Armature.")),o=a.find(l=>l.name==="pelvis.position");if(o){wE(r.name,o,n,s);let l=Vf[r.name]&&!globalThis.__mdgSinSuelo?TE(o,Vf[r.name],s):null;l&&(a[a.indexOf(o)]=o=l)}e.set(r.name,new jn(r.name,r.duration,a))}return e})),qf}function wE(i,e,t,n){let s=e.values,r=e.times,a=r.length;if(a<2)return;let[o,l]=[0,1,2].filter(p=>p!==n),c=t[o],h=t[l];if(/Awaken_Standing/.test(i)){let p=s[o]-c,_=s[l]-h,g=r[a-1]-r[0]||1;for(let m=0;m<a;m++){let x=1-(r[m]-r[0])/g;s[m*3+o]-=p*x,s[m*3+l]-=_*x}}let u=0;for(let p=0;p<a;p++)u=Math.max(u,Math.hypot(s[p*3+o]-c,s[p*3+l]-h));let d=/Dodge/.test(i)?.35:/Skeletons/.test(i)?.6:1.1;if(u<=d)return;let f=d/u;for(let p=0;p<a;p++)s[p*3+o]=c+(s[p*3+o]-c)*f,s[p*3+l]=h+(s[p*3+l]-h)*f}function TE(i,[e,t],n){let s=t.length,r=new Float32Array(s),a=new Float32Array(s*3),o=i.createInterpolant();for(let l=0;l<s;l++){r[l]=l*e;let c=o.evaluate(r[l]);a.set(c,l*3),a[l*3+n]+=t[l]}return new ui(i.name,r,a)}function Kf(i,e){let t=`${i.uuid}|${e.join(",")}`;if(Xf.has(t))return Xf.get(t);let n=i.geometry,s=n.attributes.skinIndex,r=n.attributes.skinWeight,a=i.skeleton.bones.map(u=>u.name),o=e.map(u=>AE[u]),l=new Uint8Array(s.count);for(let u=0;u<s.count;u++){let d=0,f=0;for(let p=0;p<4;p++){let _=r.getComponent(u,p);_>d&&(d=_,f=s.getComponent(u,p))}l[u]=o.some(p=>p.test(a[f]))?1:0}let c=n.index,h=[];for(let u=0;u<c.count;u+=3){let d=c.getX(u),f=c.getX(u+1),p=c.getX(u+2);l[d]&&l[f]&&l[p]&&h.push(d,f,p)}return Xf.set(t,h),h}function Fg(i){let e=i.clone(!0),t=[],n=new Map;return e.traverse(s=>{s.isBone&&(t.push(s),n.set(s.name,s))}),{root:e,bones:t,byName:n}}function Ug(i,e){let t=new w(1,1,1);i.root.traverse(n=>{if(!n.isBone)return;let s=e.get(n.name)||t;for(let r of n.children)r.isBone&&r.position.multiply(s)})}function Yf(i,e,t,n,s,r=null){n.updateMatrixWorld(!0);let a=new De().copy(n.matrixWorld).invert(),o=new Map(i.bones.map((C,D)=>[C.name,D])),l=r?r.Wnew:i.bones.map(C=>a.clone().multiply(C.matrixWorld)),c=new w(1,1,1),h=new Map,u=new w,d=new w,f=new w,p=new w,_=new w,g=new w,m=new w,x=new Map,M=(C,D)=>{let F=C;if(D===void 0&&x.has(F))return x.get(F);let O=o.has(C)?o.get(C):0,L=t.get(C)||c,k=D||s.get(C)?.matrixWorld||l[O],G=l[O].clone().multiply(new De().makeScale(L.x,L.y,L.z)).multiply(k.clone().invert()),V=[G,new it().getNormalMatrix(G),O];return D===void 0&&x.set(F,V),V},b=s.get("Head"),v=b?new w().setFromMatrixPosition(b.matrixWorld):new w;for(let C of e){let D;if(C.mesh?D=S(C):D=R(C),!D)continue;let F=C.material;h.has(F)||h.set(F,[]),h.get(F).push(D)}function S(C){let D=C.mesh,F=D.skeleton,O=[],L=[],k=[],G=[],V=-1;for(let J=0;J<F.bones.length;J++){let ce=F.bones[J].name;ce==="Head"&&(V=J);let he=F.bones[J].matrixWorld,de=he.clone().multiply(F.boneInverses[J]).multiply(D.bindMatrix);O.push(de),L.push(new it().getNormalMatrix(de));let Te=M(ce,he);k.push(Te),G.push(Te[2])}let te=V>=0?new w().setFromMatrixPosition(F.bones[V].matrixWorld):v,N=D.geometry,Z=N.attributes.position,ie=N.attributes.normal,be=N.attributes.uv,me=N.attributes.skinIndex,Je=N.attributes.skinWeight,We=C.index||(N.index?Array.from(N.index.array):[...Array(Z.count).keys()]),we=new Int32Array(Z.count).fill(-1),q=[];for(let J of We)we[J]<0&&(we[J]=q.length,q.push(J));let j=q.length,Q=new Float32Array(j*3),fe=new Float32Array(j*3),ae=new Float32Array(j*2),ge=new Uint16Array(j*4),et=new Float32Array(j*4);for(let J=0;J<j;J++){let ce=q[J];_.fromBufferAttribute(Z,ce),g.fromBufferAttribute(ie,ce),u.set(0,0,0),d.set(0,0,0);let he=0;for(let de=0;de<4;de++){let Te=Je.getComponent(ce,de);if(Te===0)continue;let Pe=me.getComponent(ce,de);Pe===V&&(he+=Te),u.addScaledVector(m.copy(_).applyMatrix4(O[Pe]),Te),d.addScaledVector(m.copy(g).applyMatrix3(L[Pe]),Te)}d.normalize(),C.deform&&C.deform(u,d,he,te,C),f.set(0,0,0),p.set(0,0,0);for(let de=0;de<4;de++){let Te=Je.getComponent(ce,de),Pe=me.getComponent(ce,de);ge[J*4+de]=G[Pe],et[J*4+de]=Te,Te!==0&&(f.addScaledVector(m.copy(u).applyMatrix4(k[Pe][0]),Te),p.addScaledVector(m.copy(d).applyMatrix3(k[Pe][1]),Te))}p.normalize(),Q[J*3]=f.x,Q[J*3+1]=f.y,Q[J*3+2]=f.z,fe[J*3]=p.x,fe[J*3+1]=p.y,fe[J*3+2]=p.z,be&&(ae[J*2]=be.getX(ce),ae[J*2+1]=be.getY(ce))}let X=new ot;return X.setAttribute("position",new $e(Q,3)),X.setAttribute("normal",new $e(fe,3)),X.setAttribute("uv",new $e(ae,2)),X.setAttribute("gcol",new $e(new Float32Array(j*3).fill(1),3)),X.setAttribute("gpar",new $e(new Float32Array(j*3),3)),X.setAttribute("skinIndex",new $e(ge,4)),X.setAttribute("skinWeight",new $e(et,4)),X.setIndex(We.map(J=>we[J])),X}function R(C){let D=C.geometry;if(!D)return null;D.index&&(D=D.toNonIndexed());let F=D.attributes.position,O=D.attributes.normal,L=F.count,k=new Float32Array(L*3),G=new Float32Array(L*3),V=new Uint16Array(L*4),te=new Float32Array(L*4);for(let we=0;we<L;we++){u.fromBufferAttribute(F,we),d.fromBufferAttribute(O,we);let q=C.weights?C.weights(u):[[C.bone,1]];C.deform&&C.deform(u,d,1,v,C),f.set(0,0,0),p.set(0,0,0);let j=0,Q=0;for(let[fe,ae]of q){if(Q>=4||!(ae>0))continue;let ge=M(fe);V[we*4+Q]=ge[2],te[we*4+Q]=ae,f.addScaledVector(m.copy(u).applyMatrix4(ge[0]),ae),p.addScaledVector(m.copy(d).applyMatrix3(ge[1]),ae),j+=ae,Q++}if(j){f.multiplyScalar(1/j);for(let fe=0;fe<4;fe++)te[we*4+fe]/=j;p.normalize(),k.set([f.x,f.y,f.z],we*3),G.set([p.x,p.y,p.z],we*3)}}let N=new ot;N.setAttribute("position",new $e(k,3)),N.setAttribute("normal",new $e(G,3));let Z=D.attributes.uv,ie=D.attributes.color,be=D.attributes.metal,me=new Float32Array(L*2),Je=new Float32Array(L*3).fill(1),We=new Float32Array(L*3);for(let we=0;we<L;we++)Z&&(me[we*2]=Z.getX(we),me[we*2+1]=Z.getY(we)),ie&&(Je[we*3]=ie.getX(we),Je[we*3+1]=ie.getY(we),Je[we*3+2]=ie.getZ(we),We[we*3]=be?be.getX(we):0,We[we*3+1]=be?be.getY(we):0,We[we*3+2]=1);return N.setAttribute("uv",new $e(me,2)),N.setAttribute("gcol",new $e(Je,3)),N.setAttribute("gpar",new $e(We,3)),N.setAttribute("skinIndex",new $e(V,4)),N.setAttribute("skinWeight",new $e(te,4)),N}let y=r?.skeleton||new fs(i.bones,l.map(C=>C.clone().invert())),A=[];for(let[C,D]of h){let O=D.some(G=>G.index)?D.map(G=>G.index?G:RE(G)):D,L=O.length>1?Yh(O,!1):O[0];if(!L){console.warn("[personajes] no se pudieron fundir las piezas de",C.name||C.type);continue}for(let G of O)G!==L&&G.dispose();L.computeBoundingSphere();let k=new ds(L,C);k.bind(y,new De),k.castShadow=!0,k.receiveShadow=!0,k.boundingSphere=new Rn(new w(0,.9,0),1.6),k.frustumCulled=!0,A.push(k)}return{meshes:A,skeleton:y,Wnew:l,boneIndex:o}}function RE(i){let e=i.attributes.position.count,t=new(e>65535?Uint32Array:Uint16Array)(e);for(let n=0;n<e;n++)t[n]=n;return i.setIndex(new $e(t,1)),i}var Wf,qf,jf,AE,Xf,kg=Vt(()=>{St();Dg();Jh();ka();Wf=null;qf=null;jf=.917,AE={cabeza:/^(Head|neck_01)$/,torso:/^(spine_0[123]|clavicle_[lr])$/,cadera:/^pelvis$/,brazos:/^(upperarm|lowerarm)_[lr]$/,manos:/^(hand_[lr]|(index|middle|ring|pinky|thumb)_\d\d(_leaf)?_[lr])$/,piernas:/^(thigh|calf)_[lr]$/,pantorrillas:/^calf_[lr]$/,pies:/^(foot|ball)(_leaf)?_[lr]$/},Xf=new Map});function Og(i=.22,e=null){Ss.uRim.value=i,e&&Ss.uRimColor.value.set(e)}function Bg(i){let e=i.onBeforeCompile;i.onBeforeCompile=(n,s)=>{e?.call(i,n,s),Object.assign(n.uniforms,Ss),n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
${Zf}`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
${$f}`)};let t=i.customProgramCacheKey?.call(i)||"";return i.customProgramCacheKey=()=>`${t}|rim`,i}function PE(){try{let i=new URLSearchParams(location.search).get("calidad");return i?{baja:0,media:1,alta:2}[i]??1:Math.min(innerWidth,innerHeight)<700||/Android|iPhone|iPad/i.test(navigator.userAgent)?0:1}catch{return 1}}function zg(i){Hg=i}function Jf(i,e=!0){let t=`${i}|${e}`;if(!nu.has(t)){let n,s=new Promise(o=>n=o),r=()=>{let o=a.image;if(Hg>0||typeof createImageBitmap!="function"||!o?.width)return n();createImageBitmap(o,{resizeWidth:o.width>>1,resizeHeight:o.height>>1,resizeQuality:"high",premultiplyAlpha:"none",colorSpaceConversion:"none"}).then(l=>{a.image=l,a.needsUpdate=!0}).catch(()=>{}).finally(n)},a=CE.load(`assets/chars/tex/${i}.webp`,r,void 0,()=>n());a.flipY=!1,a.colorSpace=e?Tt:si,a.anisotropy=4,a.userData.ready=s,nu.set(t,a)}return nu.get(t)}function za(){return Promise.all([...nu.values()].map(i=>i.userData.ready))}function Gg(){if(Ha)return Ha;let i=(t,n,s=null)=>{let r=document.createElement("canvas");r.width=r.height=32;let a=r.getContext("2d"),o=a.createLinearGradient(0,0,0,32);return o.addColorStop(0,t),s&&o.addColorStop(.5,s),o.addColorStop(1,n),a.fillStyle=o,a.fillRect(0,0,32,32),r},e=i("#c9c4bc","#2a2420","#8a8078");return Ha=new _r([e,e,i("#e8e2d6","#e8e2d6"),i("#1e1a16","#1e1a16"),e,e]),Ha.colorSpace=Tt,Ha.needsUpdate=!0,Ha}function Vg(i,e,t={}){let n=new Ht({map:Jf(`atlas_${i}`),normalMap:Jf(`atlas_${i}_n`,!1),roughness:.82,metalness:0,envMap:Gg(),envMapIntensity:.6,side:Pn});n.normalScale.set(.8,.8);let s={uMask:{value:Jf(`mascara_${i}`,!1)},uC1:{value:Zs(e.cloth1||"#3f5f9a")},uC2:{value:Zs(e.cloth2||"#c9b48a")},uMetal:{value:Zs(e.metal||"#b8bec6")},uSkin:{value:Zs(e.skin||"#e0ac83")},uLeather:{value:Zs(e.leather||"#ffffff")},uHair:{value:Zs(e.hair||"#3b2a1e")},uEyes:{value:Zs(e.eyes||"#5a3a1e")},uGlow:{value:t.glowEyes||0},uPattern:{value:t.pattern||0},uPatternColor:{value:Zs(t.patternColor||"#303030")},uMail:{value:t.mail||0},uFlash:{value:new ye(0,0,0)}};return n.userData.u=s,n.onBeforeCompile=r=>{Object.assign(r.uniforms,s,Ss),r.vertexShader=r.vertexShader.replace("#include <common>",`#include <common>
attribute vec3 gcol; attribute vec3 gpar; varying vec3 vObj; varying vec3 vGcol; varying vec3 vGpar;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vObj = position; vGcol = gcol; vGpar = gpar;`),r.fragmentShader=r.fragmentShader.replace("#include <common>",`#include <common>
uniform sampler2D uMask; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uMetal; uniform vec3 uSkin; uniform vec3 uLeather;
uniform vec3 uHair; uniform vec3 uEyes; uniform float uGlow;
uniform float uPattern; uniform vec3 uPatternColor; uniform float uMail; uniform vec3 uFlash;
${Zf}
varying vec3 vObj; varying vec3 vGcol; varying vec3 vGpar;
float mdgMetal = 0.0; float mdgSkin = 0.0; float mdgRough = -1.0; vec3 mdgEmit = vec3(0.0);
${IE}`).replace("#include <map_fragment>",`
  vec4 texel = texture2D( map, vMapUv );
  vec3 col;
  if ( vGpar.z > 0.5 ) {
    // equipo hecho por c\xF3digo: color y metal por v\xE9rtice
    col = vGcol;
    mdgMetal = vGpar.x;
    mdgRough = mix( 0.78, 0.3, vGpar.x );
    mdgEmit = vGcol * vGpar.y * 2.5;
  } else if ( vMapUv.y > 0.8 ) {
    if ( vMapUv.x < 0.5 ) {
      col = texel.rgb * uHair / 0.214;
      mdgRough = 0.62;
    } else {
      float iris = texture2D( map, vMapUv + vec2( 0.25, 0.0 ) ).r;
      col = mix( texel.rgb, texel.rgb * uEyes / 0.214, iris );
      mdgRough = 0.22;
      mdgEmit = uEyes * iris * uGlow * 3.0;
    }
  } else {
    vec4 mk = texture2D( uMask, vMapUv );
    mk.a = clamp( ( mk.a - 0.5 ) * 2.0, 0.0, 1.0 );
    float tsum = min( 1.0, mk.r + mk.g + mk.b + mk.a );
    vec3 tint = ( uC1 * mk.r + uC2 * mk.g + uMetal * mk.b + uSkin * mk.a ) / max( tsum, 1e-3 );
    // los texels te\xF1ibles est\xE1n en gris con media 0,5 (sRGB) = 0,214 lineal
    col = texel.rgb * mix( uLeather, tint / 0.214, tsum );
    mdgMetal = mk.b;
    mdgSkin = mk.a;
    // cota de malla o de escamas sobre la ropa principal
    if ( uMail > 0.5 && mk.r > 0.01 ) {
      vec3 p = vObj * 70.0;
      float fw = clamp( length( fwidth( p ) ) * 0.6, 0.0, 1.0 );
      float ring;
      if ( uMail < 1.5 ) {
        vec2 q = vec2( p.x + p.z, p.y );
        q.x += step( 1.0, mod( q.y, 2.0 ) ) * 0.5;
        vec2 c = fract( q ) - 0.5;
        float d = length( c * vec2( 1.0, 1.3 ) );
        ring = smoothstep( 0.18, 0.28, d ) * ( 1.0 - smoothstep( 0.38, 0.5, d ) );
      } else {
        vec2 q = vec2( p.x + p.z, p.y * 1.3 ) * 0.7;
        q.x += step( 1.0, mod( q.y, 2.0 ) ) * 0.5;
        vec2 c = fract( q ) - vec2( 0.5, 0.0 );
        ring = 1.0 - smoothstep( 0.35, 0.5, length( c * vec2( 1.0, 0.9 ) ) );
        ring = 0.45 + ring * 0.75;
      }
      ring = mix( ring, 0.62, fw );
      float k = mk.r;
      col = mix( col, uMetal * ( 0.25 + ring * 0.95 ) * ( 0.75 + texel.r * 0.6 ), k );
      mdgMetal = max( mdgMetal, k * ( 0.35 + ring * 0.55 ) );
    }
    // patrones de piel (escamas, marcas de goliat, podredumbre)
    if ( uPattern > 0.5 && mk.a > 0.01 ) {
      vec3 p = vObj;
      float pat = 0.0;
      if ( uPattern < 1.5 ) {
        vec3 q = p * 95.0;
        vec2 sc = vec2( q.x + q.z * 0.7, q.y );
        sc.x += step( 1.0, mod( sc.y, 2.0 ) ) * 0.5;
        vec2 c = fract( sc ) - 0.5;
        float d = length( c * vec2( 1.0, 1.4 ) );
        pat = smoothstep( 0.3, 0.5, d ) * 0.55;
        pat = mix( pat, 0.2, clamp( length( fwidth( q ) ) * 0.5, 0.0, 1.0 ) );
        col *= 1.0 - pat * mk.a;
      } else if ( uPattern < 2.5 ) {
        // l\xEDneas de goliat: vetas finas y a trozos, como grietas de piedra (antes, manchas de vaca)
        float n = mdgNoise( p * vec3( 9.0, 3.0, 9.0 ) ) + 0.5 * mdgNoise( p * 27.0 );
        float band = abs( sin( p.y * 26.0 + n * 4.0 ) );
        pat = smoothstep( 0.9, 0.97, band ) * smoothstep( 0.35, 0.6, n );
        col = mix( col, uPatternColor * texel.rgb / 0.214, pat * 0.7 * mk.a );
      } else if ( uPattern < 3.5 ) {
        // manchas de goliat: sueltas y no muy contrastadas (antes parec\xEDa una vaca)
        float n = mdgNoise( p * 22.0 ) * 0.7 + mdgNoise( p * 55.0 ) * 0.3;
        pat = smoothstep( 0.63, 0.72, n );
        col = mix( col, uPatternColor * texel.rgb / 0.214, pat * 0.55 * mk.a );
      } else if ( uPattern < 4.5 ) {
        float n = mdgNoise( p * 9.0 );
        vec2 gg = fract( vec2( p.x + p.z, p.y ) * 26.0 );
        float lines = step( 0.86, max( gg.x, gg.y ) ) * step( 0.55, n );
        col = mix( col, uPatternColor * 1.6, lines * mk.a );
      } else {
        // podredumbre: manchas m\xE1s peque\xF1as y sueltas (antes parec\xEDa camuflaje)
        float n = mdgNoise( p * 17.0 ) * 0.6 + mdgNoise( p * 52.0 ) * 0.4;
        pat = smoothstep( 0.55, 0.78, n ) * 0.8;
        col = mix( col, uPatternColor * texel.rgb / 0.214 * 0.8, pat * mk.a );
      }
    }
  }
  diffuseColor.rgb *= col;
`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
if ( vGpar.z > 0.5 ) normal = nonPerturbedNormal;`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = mix( roughnessFactor, 0.36, mdgMetal ); roughnessFactor = mix( roughnessFactor, 0.6, mdgSkin ); if ( mdgRough >= 0.0 ) roughnessFactor = mdgRough;`).replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
metalnessFactor = mdgMetal * 0.9;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += uFlash + mdgEmit;
${$f}`)},n.customProgramCacheKey=()=>"mdgPersonaje",n}function Wg(){let i=new Ht({vertexColors:!0,roughness:.75,metalness:0,envMap:Gg(),envMapIntensity:.9}),e={uFlash:{value:new ye(0,0,0)}};return i.userData.u=e,i.onBeforeCompile=t=>{Object.assign(t.uniforms,e,Ss),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
attribute vec2 metal; varying vec2 vMetal;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vMetal = metal;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 vMetal; uniform vec3 uFlash; ${Zf}`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = mix(0.78, 0.3, vMetal.x);`).replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
metalnessFactor = vMetal.x * 0.92;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
totalEmissiveRadiance += uFlash + diffuseColor.rgb * vMetal.y * 2.5;
${$f}`)},i.customProgramCacheKey=()=>"mdgGear",i}var CE,nu,Ss,Zf,$f,Hg,Ha,Zs,IE,Lr=Vt(()=>{St();CE=new Wi,nu=new Map,Ss={uRim:{value:.22},uRimColor:{value:new ye("#ffe6c8")}};Zf="uniform float uRim; uniform vec3 uRimColor;",$f="totalEmissiveRadiance += uRimColor * ( uRim * pow( 1.0 - clamp( abs( dot( normal, normalize( vViewPosition ) ) ), 0.0, 1.0 ), 3.0 ) );";Hg=PE();Ha=null;Zs=i=>new ye(i),IE=`
float mdgHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mdgNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(mdgHash(i+vec3(0,0,0)), mdgHash(i+vec3(1,0,0)), f.x), mix(mdgHash(i+vec3(0,1,0)), mdgHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(mdgHash(i+vec3(0,0,1)), mdgHash(i+vec3(1,0,1)), f.x), mix(mdgHash(i+vec3(0,1,1)), mdgHash(i+vec3(1,1,1)), f.x), f.y), f.z); }
`});function re(i,{color:e=8947848,metal:t=0,glow:n=0,matrix:s=null,vary:r=0}={}){let a=i.index?i.toNonIndexed():i;s&&a.applyMatrix4(s),a.attributes.normal||a.computeVertexNormals();for(let u of Object.keys(a.attributes))["position","normal"].includes(u)||a.deleteAttribute(u);let o=a.attributes.position.count,l=new ye(e),c=new Float32Array(o*3),h=new Float32Array(o*2);for(let u=0;u<o;u++){let d=r?1+Math.sin(u*12.9898)*43758.5453%1*r:1;c.set([l.r*d,l.g*d,l.b*d],u*3),h.set([t,n],u*2)}return a.setAttribute("color",new $e(c,3)),a.setAttribute("metal",new $e(h,2)),a}function st(i){let e=i.filter(Boolean);return e.length?e.length===1?e[0]:Yh(e,!1):null}function ep(i){let e=new ye(i.metalColor||"#b8bec6");return{metal:e,metalDark:e.clone().multiplyScalar(.55),gold:new ye("#d4a63a"),wood:new ye("#6b4a2e"),woodDark:new ye("#3e2a1a"),leather:new ye("#4a3020"),leatherDark:new ye("#2a1c14"),cloth1:new ye(i.colors?.cloth1||"#3f5f9a"),cloth2:new ye(i.colors?.cloth2||"#c9b48a"),bone:new ye("#d8ccb0"),string:new ye("#d8d0b8")}}function Ga(i,e,{curve:t=0,thick:n=.012,point:s=.18,taper:r=.35}={}){let a=new Wn,o=8,l=e/2,c=[];for(let d=0;d<=o;d++){let f=d/o,p=f*i*(1-s),_=l*(1-f*r);c.push([p,_])}let h=d=>t*(d/i)*(d/i)*i;a.moveTo(-l+h(0),0);for(let[d,f]of c)a.lineTo(-f+h(d),d);a.lineTo(h(i)+(t?l*.4:0),i);for(let d=c.length-1;d>=0;d--)a.lineTo(c[d][1]+h(c[d][0]),c[d][0]);let u=new Si(a,{depth:n,bevelEnabled:!0,bevelThickness:n*.45,bevelSize:Math.min(e*.18,.008),bevelSegments:1,curveSegments:4});return u.translate(0,0,-n/2),u}function rn(i,e,t,n=8){return new Mt(i,e,t,n,1)}function iu(i,e){let t=e,n=(c=.12,h=.016)=>re(rn(h,h*1.05,c,8),{color:t.leatherDark}),s=(c,h=.024)=>re(new bt(h,8,6),{color:t.metal,metal:1,matrix:P.T(0,c,0)}),r=(c,h,u=.025)=>re(new At(c,u,.03),{color:t.metal,metal:1,matrix:P.T(0,h,0)}),a=(c,h=.017,u=-.15)=>re(rn(h*.9,h,c,8),{color:t.wood,matrix:P.T(0,u+c/2,0)}),o=(c,h)=>re(c,{color:t.metal,metal:1,matrix:h}),l=(c,h=.34)=>c.translate(0,-h,0);switch(i){case"longsword":case"shortsword":case"greatsword":case"dagger":{let c={longsword:.82,shortsword:.55,greatsword:1.15,dagger:.24}[i],h={longsword:.05,shortsword:.048,greatsword:.065,dagger:.034}[i],u=i==="greatsword"?.26:i==="dagger"?.09:.13;return st([o(Ga(c,h,{point:.14}),P.T(0,u/2+.02,0)),r(i==="dagger"?.07:h*3.6,u/2+.012),re(rn(.016,.017,u,8),{color:t.leatherDark}),s(-u/2-.012,i==="dagger"?.016:.022)])}case"rapier":return st([o(Ga(.9,.022,{point:.08,taper:.5,thick:.008}),P.T(0,.08,0)),o(new bt(.05,10,6,0,Math.PI*2,0,Math.PI/2.2),P.T(0,.075,0)),o(new _t(.045,.005,4,12,Math.PI),P.mul(P.T(0,.02,0),P.R(0,90,180))),n(.11,.014),s(-.065,.018)]);case"scimitar":return st([o(Ga(.72,.055,{curve:.12,point:.1,taper:.1}),P.T(0,.08,0)),r(.12,.068,.02),n(.12),s(-.07,.02)]);case"sickle":return st([a(.3,.015,-.12),o(new _t(.13,.012,3,14,Math.PI*1.1),P.mul(P.T(.12,.2,0),P.R(0,0,10),P.S(1,1,.4)))]);case"handaxe":case"battleaxe":case"greataxe":case"war_pick":{let c={handaxe:.45,battleaxe:.75,greataxe:1.15,war_pick:.7}[i],h=c-.2,u=new Wn;if(i==="war_pick")u.moveTo(-.03,-.03),u.lineTo(.22,-.01),u.lineTo(.24,0),u.lineTo(.22,.012),u.lineTo(-.03,.03);else{let _=i==="greataxe"?.2:i==="battleaxe"?.15:.1;u.moveTo(-.02,-.035),u.lineTo(_*.55,-.05),u.quadraticCurveTo(_*1.1,-_*.9,_*1.15,-_),u.quadraticCurveTo(_*1.35,0,_*1.15,_),u.quadraticCurveTo(_*1.1,_*.9,_*.55,.05),u.lineTo(-.02,.035)}let d=new Si(u,{depth:.018,bevelEnabled:!0,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:6});d.translate(0,0,-.009);let f=i==="greataxe"?d.clone():null,p=[a(c,i==="greataxe"?.02:.017),o(d,P.T(.015,h,0))];return f&&p.push(o(f,P.mul(P.T(-.015,h,0),P.R(0,180,0)))),p.push(o(rn(.022,.022,.07,8),P.T(0,h,0))),st(p)}case"mace":case"morningstar":case"light_hammer":case"warhammer":case"maul":case"club":case"greatclub":{let c={mace:.6,morningstar:.65,light_hammer:.42,warhammer:.72,maul:1.15,club:.55,greatclub:.95}[i];if(i==="club"||i==="greatclub"){let d=i==="club"?.04:.065;return re(rn(d,d*.45,c,7),{color:t.wood,matrix:P.T(0,c/2-.12,0),vary:.1})}let h=c-.17,u=[a(c,.016)];if(i==="mace"){u.push(o(new bt(.045,8,6),P.T(0,h,0)));for(let d=0;d<6;d++)u.push(o(new At(.075,.09,.012),P.mul(P.T(0,h,0),P.R(0,d*30,0))))}else if(i==="morningstar"){u.push(o(new bt(.06,10,8),P.T(0,h,0)));let d=[[1,0,0],[-1,0,0],[0,1,0],[0,0,1],[0,0,-1],[.7,.7,0],[-.7,.7,0],[0,.7,.7],[0,.7,-.7]];for(let f of d){let p=new w(...f).normalize(),_=new Ke().setFromUnitVectors(new w(0,1,0),p);u.push(o(new Nt(.014,.05,5),new De().compose(p.clone().multiplyScalar(.075).add(new w(0,h,0)),_,new w(1,1,1))))}}else{let d=i==="maul",f=d?.24:i==="warhammer"?.16:.12,p=d?.1:.06;u.push(o(new At(f,p,p),P.T(0,h,0))),i==="warhammer"&&u.push(o(new Nt(.025,.1,4),P.mul(P.T(-.12,h,0),P.R(0,0,90))))}return st(u)}case"flail":return st([a(.45,.016),...[0,1,2,3].map(c=>o(new _t(.014,.004,4,8),P.mul(P.T(.02*c,.32+.025*c,0),P.R(0,c%2?90:0,30)))),o(new bt(.05,8,6),P.T(.1,.42,0))]);case"quarterstaff":return l(st([re(rn(.02,.022,1.7,8),{color:t.wood,matrix:P.T(0,.35,0),vary:.08}),o(rn(.025,.025,.06,8),P.T(0,1.18,0)),o(rn(.025,.025,.06,8),P.T(0,-.48,0))]));case"spear":case"javelin":case"glaive":case"halberd":{let c={spear:1.9,javelin:1.35,glaive:2,halberd:2.05}[i],h=[re(rn(.016,.018,c,8),{color:t.wood,matrix:P.T(0,c/2-.45,0)})],u=c-.45;if((i==="spear"||i==="javelin")&&h.push(o(Ga(i==="spear"?.26:.18,.05,{point:.5,taper:.2}),P.T(0,u,0))),i==="glaive"&&h.push(o(Ga(.5,.07,{curve:.08,point:.25,taper:.1}),P.T(0,u-.05,0))),i==="halberd"){h.push(o(Ga(.3,.035,{point:.4}),P.T(0,u,0)));let d=new Wn;d.moveTo(0,-.07),d.quadraticCurveTo(.18,-.12,.2,-.14),d.quadraticCurveTo(.26,0,.2,.14),d.quadraticCurveTo(.18,.08,0,.07);let f=new Si(d,{depth:.014,bevelEnabled:!1,curveSegments:6});f.translate(0,0,-.007),h.push(o(f,P.T(.01,u-.08,0))),h.push(o(new Nt(.02,.1,4),P.mul(P.T(-.06,u-.08,0),P.R(0,0,90))))}return st(h)}case"shortbow":case"longbow":return DE(i==="longbow"?1.55:1.05,t);case"light_crossbow":case"heavy_crossbow":case"hand_crossbow":return LE(i==="heavy_crossbow"?1.25:i==="hand_crossbow"?.55:.95,t);case"dart":return st([re(rn(.004,.006,.18,5),{color:t.wood,matrix:P.T(0,.05,0)}),o(new Nt(.007,.05,5),P.T(0,.16,0))]);case"sling":return re(new _t(.06,.006,4,10),{color:t.leather,matrix:P.mul(P.T(0,-.05,0),P.S(.5,1,1))});case"wand":return st([re(rn(.008,.012,.3,6),{color:t.woodDark,matrix:P.T(0,.08,0)}),re(new gs(.018),{color:"#9fd8ff",glow:1,matrix:P.T(0,.24,0)})]);case"arcane_staff":return l(st([re(rn(.018,.024,1.75,7),{color:t.woodDark,matrix:P.T(0,.38,0),vary:.1}),...[0,1,2].map(c=>re(new Nt(.014,.16,4),{color:t.woodDark,matrix:P.mul(P.T(0,1.27,0),P.R(0,c*120,25),P.T(0,.06,0))})),re(new gs(.045),{color:"#8fd0ff",glow:1,matrix:P.mul(P.T(0,1.33,0),P.S(.8,1.3,.8))})]));case"druid_staff":return l(st([re(rn(.02,.026,1.7,7),{color:"#5a4630",matrix:P.T(0,.37,0),vary:.12}),re(new _t(.07,.016,5,10,Math.PI*1.4),{color:"#5a4630",matrix:P.mul(P.T(0,1.27,0),P.R(0,0,120))}),...[0,1,2,3,4].map(c=>re(new bt(.03,5,4),{color:c%2?"#4f7a32":"#6a9a3a",matrix:P.mul(P.T(Math.cos(c*1.3)*.06,1.25+c%3*.04,Math.sin(c*1.3)*.05),P.S(1,.5,1.6))}))]));case"mug":return st([re(rn(.045,.04,.12,10),{color:t.wood,matrix:P.T(.02,0,0),vary:.08}),re(new _t(.046,.006,4,10),{color:t.metalDark,metal:1,matrix:P.mul(P.T(.02,.04,0),P.R(90,0,0))}),re(new _t(.03,.008,4,8,Math.PI),{color:t.wood,matrix:P.mul(P.T(-.03,0,0),P.R(0,0,90))}),re(new hi(.04,10),{color:"#e8dcb0",matrix:P.mul(P.T(.02,.058,0),P.R(-90,0,0))})]);case"crook":return l(st([re(rn(.016,.02,1.55,7),{color:"#6a5034",matrix:P.T(0,.45,0),vary:.1}),re(new _t(.08,.016,5,12,Math.PI*1.2),{color:"#6a5034",matrix:P.mul(P.T(.08,1.22,0),P.R(0,0,-10))})]),.28);case"holy_symbol":return st([re(new hi(.05,12),{color:t.gold,metal:1}),re(new _t(.05,.008,4,12),{color:t.gold,metal:1})]);default:return null}}function DE(i,e){let t=i/2,n=new zi([new w(0,-t,-.12),new w(0,-t*.55,-.02),new w(0,0,.04),new w(0,t*.55,-.02),new w(0,t,-.12)]),s=new _a(n,16,.012,5,!1),r=new ot().setFromPoints([new w(0,-t,-.12),new w(0,t,-.12)]);return st([re(s,{color:e.wood}),re(rn(.0022,.0022,i*.98,3),{color:e.string,matrix:P.T(0,0,-.12)}),re(rn(.017,.017,.12,6),{color:e.leatherDark,matrix:P.T(0,0,.04)})])}function LE(i,e){let t=i/.95;return st([re(new At(.045*t,.05*t,.7*t),{color:e.wood,matrix:P.T(0,0,.22*t)}),re(new _t(.3*t,.012*t,4,12,Math.PI*.8),{color:e.metalDark,metal:1,matrix:P.mul(P.T(0,.02,.55*t),P.R(90,0,0),P.R(0,0,18))}),re(rn(.002,.002,.5*t,3),{color:e.string,matrix:P.mul(P.T(0,.03,.42*t),P.R(0,0,90))}),re(new At(.03*t,.07*t,.05*t),{color:e.metalDark,metal:1,matrix:P.T(0,-.04,.05*t)})])}function tp(i,e){if(i==="redondo"||i==="tosco"){let a=i==="tosco"?.24:.3,o=re(rn(a,a,.025,16),{color:i==="tosco"?"#5a4a36":e.cloth1,matrix:P.R(90,0,0),vary:.08});return st([o,re(new _t(a,.012,4,20),{color:i==="tosco"?e.woodDark:e.metal,metal:i==="tosco"?0:1}),re(new bt(.06,8,5,0,Math.PI*2,0,Math.PI/2),{color:e.metal,metal:1,matrix:P.R(90,0,0)})])}let t=new Wn;t.moveTo(0,.36),t.quadraticCurveTo(.24,.36,.25,.2),t.quadraticCurveTo(.25,-.12,0,-.42),t.quadraticCurveTo(-.25,-.12,-.25,.2),t.quadraticCurveTo(-.24,.36,0,.36);let n=new Si(t,{depth:.02,bevelEnabled:!0,bevelThickness:.012,bevelSize:.018,bevelSegments:1,curveSegments:8}),s=[re(n,{color:i==="sol"?"#e8dcc0":e.cloth1})],r=new Si(t,{depth:.012,bevelEnabled:!1,curveSegments:8});if(s.push(re(r,{color:e.metal,metal:1,matrix:P.mul(P.T(0,0,-.008),P.S(1.06,1.05,1))})),i==="sol"){s.push(re(new hi(.08,14),{color:e.gold,metal:1,matrix:P.T(0,.04,.034)}));for(let a=0;a<12;a++)s.push(re(new Nt(.018,.08,3),{color:e.gold,metal:1,matrix:P.mul(P.T(0,.04,.034),P.R(0,0,a*30),P.T(0,.12,0))}))}else s.push(re(new At(.05,.6,.01),{color:e.cloth2,matrix:P.T(0,-.02,.034)})),s.push(re(new At(.4,.05,.01),{color:e.cloth2,matrix:P.T(0,.12,.034)}));return st(s)}function Xg(i){let e=[re(rn(.05,.045,.5,8),{color:i.leather,matrix:P.T(0,.25,0)})];for(let t=0;t<6;t++){let n=Math.cos(t*2.1)*.025,s=Math.sin(t*2.1)*.025;e.push(re(rn(.004,.004,.2,3),{color:i.wood,matrix:P.T(n,.58,s)})),e.push(re(new At(.003,.05,.02),{color:t%2?"#e8e0d0":"#a03020",matrix:P.T(n,.66,s)}))}return st(e)}function jg(i){return st([re(new bt(.15,10,8),{color:"#8a5a2a",matrix:P.mul(P.T(0,0,0),P.S(1,1.25,.5))}),re(new At(.045,.38,.025),{color:i.woodDark,matrix:P.T(0,.33,.02)}),re(new At(.06,.1,.02),{color:i.woodDark,matrix:P.mul(P.T(0,.55,0),P.R(-25,0,0))}),re(new hi(.035,10),{color:"#1e140c",matrix:P.T(0,.04,.077)})])}function Kg(i){return st([re(new At(.3,.42,.2),{color:i.leather,vary:.06}),re(new Mt(.08,.08,.34,8),{color:"#8a7a5a",matrix:P.mul(P.T(0,.26,0),P.R(0,0,90))}),re(new Mt(.06,.05,.05,8),{color:i.metalDark,metal:1,matrix:P.T(.17,-.05,.02)}),re(new At(.22,.12,.05),{color:i.leatherDark,matrix:P.T(0,-.08,-.12)})])}function Yg(i,e){let{x:t,y:n,z:s}=i;return st([re(new _t(.017,.0025,4,12),{color:e.gold,metal:1,matrix:P.T(t+.031,n,s)}),re(new _t(.017,.0025,4,12),{color:e.gold,metal:1,matrix:P.T(t-.031,n,s)}),re(new At(.03,.004,.004),{color:e.gold,metal:1,matrix:P.T(t,n+.004,s)})])}function Jg(i){return st([re(new At(.16,.2,.05),{color:"#5a2a3a"}),re(new At(.15,.185,.052),{color:"#e8dcc0",matrix:P.T(.008,0,0)}),re(new At(.03,.04,.056),{color:i.gold,metal:1,matrix:P.T(-.06,0,0)})])}function Zg(i){return re(new bt(.06,7,5),{color:i.leather,matrix:P.S(1,1.1,.6)})}function $g(i,e,t,{size:n=1,color:s}={}){let r=s||t.metal,a=[];for(let o=0;o<3;o++){let l=(.11-o*.012)*n,c=new bt(l,10,5,0,Math.PI*2,0,Math.PI*.42);a.push(re(c,{color:o===0?r:r.clone().multiplyScalar(.85),metal:1,matrix:P.mul(P.T(e.x+i*o*.035*n,e.y+.03-o*.035*n,e.z),P.R(0,0,-i*(28+o*14)),P.S(1,.75,1.05))}))}return a.push(re(new _t(.107*n,.007,4,14,Math.PI),{color:t.gold,metal:1,matrix:P.mul(P.T(e.x,e.y+.03,e.z),P.R(0,0,-i*28),P.T(0,.02*n,0),P.S(1,1,1.05),P.R(0,i*90,0),P.R(90,0,0))})),st(a)}function Qg(i,e,{color:t,plate:n=!0}={}){let s=t||e.metal,r=new bt(1,14,8,-Math.PI/2,Math.PI,Math.PI*.18,Math.PI*.6),a=new bt(1,14,8,Math.PI/2,Math.PI,Math.PI*.18,Math.PI*.6),o=[re(r,{color:s,metal:1,matrix:P.mul(P.T(0,i.y,i.cz),P.S(i.w,i.h,i.front))}),re(a,{color:s.clone().multiplyScalar(.9),metal:1,matrix:P.mul(P.T(0,i.y,i.cz),P.S(i.w,i.h,i.back))})];if(n)for(let l=0;l<3;l++){let c=i.y-i.h*.62-l*.045;o.push(re(new Mt(i.w*(.92+l*.05),i.w*(.95+l*.06),.05,14,1,!0),{color:s.clone().multiplyScalar(.9-l*.05),metal:1,matrix:P.mul(P.T(0,c,i.cz),P.S(1,1,i.front/i.w))}))}return st(o)}function np(i,e,t,n,s,{color:r,metal:a=1}={}){let o=new w().subVectors(e,i),l=o.length(),c=new Mt(n,t,l,10,1,!0),h=new Ke().setFromUnitVectors(new w(0,1,0),o.normalize()),u=new De().compose(i.clone().add(e).multiplyScalar(.5),h,new w(1,1,1));return re(c,{color:r||s.metal,metal:a,matrix:u})}function eb(i,e,t,{color:n}={}){let s=n||t.metal,{x:r,y:a,z:o,r:l}=e,c=[];if(i==="casco"||i==="yelmo")c.push(re(new bt(l*1.12,14,8,0,Math.PI*2,0,Math.PI*.55),{color:s,metal:1,matrix:P.mul(P.T(r,a-l*.05,o-l*.05),P.S(1,1.05,1.1))})),c.push(re(new _t(l*1.12,l*.08,4,18),{color:s.clone().multiplyScalar(.8),metal:1,matrix:P.mul(P.T(r,a-l*.18,o-l*.05),P.R(90,0,0),P.S(1,1.1,1))})),i==="casco"?c.push(re(new At(l*.16,l*.75,l*.1),{color:s,metal:1,matrix:P.T(r,a-l*.5,o+l*1.12)})):(c.push(re(new Mt(l*1.1,l*1.08,l*1.15,14,1,!0),{color:s,metal:1,matrix:P.mul(P.T(r,a-l*.75,o-l*.03),P.S(1,1,1.12))})),c.push(re(new At(l*1.1,l*.08,l*.08),{color:"#101010",matrix:P.T(r,a-l*.5,o+l*1.2)})),c.push(re(new At(l*.08,l*.6,l*.08),{color:s,metal:1,matrix:P.T(r,a-l*.75,o+l*1.22)})));else if(i==="corona"){c.push(re(new Mt(l*1.05,l*1.02,l*.28,14,1,!0),{color:t.gold,metal:1,matrix:P.T(r,a+l*.15,o-l*.05)}));for(let h=0;h<8;h++)c.push(re(new Nt(l*.12,l*.38,4),{color:t.gold,metal:1,matrix:P.mul(P.T(r,a+l*.42,o-l*.05),P.R(0,h*45,0),P.T(0,0,l*1.02))}))}else if(i==="mago"){let h=a+l*.78,u=[];u.push(re(new Mt(l*1.85,l*1.85,l*.06,18),{color:t.cloth1,matrix:P.T(r,h,o-l*.05)}));let d=new Nt(l*1.05,l*3.2,14,4,!0),f=d.attributes.position;for(let _=0;_<f.count;_++){let g=f.getY(_)/(l*3.2)+.5;f.setX(_,f.getX(_)-g*g*l*.9)}u.push(re(d,{color:t.cloth1,matrix:P.T(r,h+l*1.6,o-l*.05)})),u.push(re(new Mt(l*1.06,l*1.06,l*.18,14,1,!0),{color:t.cloth2,matrix:P.T(r,h+l*.1,o-l*.05)}));let p=st(u);p.applyMatrix4(P.mul(P.T(r,a,o),P.R(-12,0,0),P.T(-r,-a,-o))),c.push(p)}else if(i==="chambergo"){c.push(re(new Mt(l*1.9,l*1.9,l*.05,16),{color:t.cloth1,matrix:P.mul(P.T(r,a+l*.45,o-l*.05),P.R(-8,0,6))})),c.push(re(new bt(l*1.08,12,6,0,Math.PI*2,0,Math.PI/2),{color:t.cloth1,matrix:P.mul(P.T(r,a+l*.45,o-l*.05),P.S(1,.7,1))}));let h=new bt(l*.25,6,4);c.push(re(h,{color:"#c03030",matrix:P.mul(P.T(r+l*.7,a+l*1,o-l*.4),P.R(0,0,-30),P.S(.5,3,.25))}))}else if(i==="diadema"){let h=st([re(new _t(l*1.03,l*.05,4,18),{color:t.gold,metal:1,matrix:P.mul(P.T(r,a+l*.42,o),P.R(90,0,0))}),re(new gs(l*.12),{color:"#e8c050",glow:.6,matrix:P.T(r,a+l*.47,o+l*1.05)})]);h.applyMatrix4(P.mul(P.T(r,a,o),P.R(-14,0,0),P.T(-r,-a,-o))),c.push(h)}else if(i==="astas"){for(let h of[-1,1]){let u=new zi([new w(r+h*l*.6,a+l*.4,o),new w(r+h*l*1.1,a+l*1.1,o-l*.2),new w(r+h*l*1.3,a+l*1.8,o-l*.1)]);c.push(re(new _a(u,6,l*.07,4),{color:"#8a7050"})),c.push(re(new Nt(l*.06,l*.5,4),{color:"#8a7050",matrix:P.mul(P.T(r+h*l*1.15,a+l*1.2,o-l*.1),P.R(0,0,-h*50))}))}c.push(re(new _t(l*1.02,l*.05,4,18),{color:"#5a4630",matrix:P.mul(P.T(r,a+l*.2,o),P.R(90,0,0))}))}return st(c)}function tb({yTop:i,yBottom:e,rTop:t,rBottom:n,cz:s=-.01,depth:r=.85,open:a=0,color:o,segs:l=18,rings:c=6}){let h=new Mt(t,n,i-e,l,c,!0,a*Math.PI,Math.PI*2*(1-a));h.rotateY(Math.PI/2+a*Math.PI),h.translate(0,(i+e)/2,s),h.scale(1,1,r);let u=h.attributes.position;for(let d=0;d<u.count;d++){let f=(i-u.getY(d))/(i-e),p=Math.atan2(u.getZ(d),u.getX(d)),_=1+Math.sin(p*7)*.035*f;u.setX(d,u.getX(d)*_),u.setZ(d,u.getZ(d)*_)}return h.computeVertexNormals(),re(h,{color:o,vary:.04})}function nb({y0:i,y1:e,w0:t,w1:n,z:s,bulge:r=.02,color:a,segs:o=6,rings:l=8,back:c=!1}){let h=new Mn(1,1,o,l),u=h.attributes.position;for(let f=0;f<u.count;f++){let p=u.getX(f)+.5,_=u.getY(f)+.5,g=n+(t-n)*_,m=(p-.5)*g,x=e+(i-e)*_,M=s+(c?-1:1)*(Math.sin(p*Math.PI)*r+(1-_)*r*.6);u.setXYZ(f,m,x,M)}c&&h.rotateY(0),h.computeVertexNormals();let d=re(h,{color:a,vary:.03});if(c){let f=d.attributes.position;for(let p=0;p<f.count;p+=3)for(let _ of["position","normal","color","metal"]){let g=d.attributes[_],m=g.itemSize;for(let x=0;x<m;x++){let M=g.array[(p+1)*m+x];g.array[(p+1)*m+x]=g.array[(p+2)*m+x],g.array[(p+2)*m+x]=M}}d.computeVertexNormals()}return d}function ib({y:i,rx:e,rz:t,cz:n=-.01,color:s,thick:r=.06,leaves:a=!1}){let o=new _t(1,.38,6,22);o.rotateX(Math.PI/2);let l=o.attributes.position;for(let c=0;c<l.count;c++){let h=l.getX(c),u=l.getY(c),d=l.getZ(c),f=Math.atan2(d,h),p=1+Math.sin(f*9+u*5)*.12+Math.sin(f*23)*.06;l.setXYZ(c,h*e*p,i+u*r*(d<0?1.3:.9)-(d<0?.03:0),d*t*p+n)}return o.computeVertexNormals(),re(o,{color:s,vary:a?.35:.18})}function sb({y:i,rx:e,rz:t,cz:n,P:s,color:r}){let a=new Mt(1,1,.045,18,1,!0);return a.scale(e,1,t),a.translate(0,i,n),st([re(a,{color:r||s.leatherDark}),re(new At(.05,.05,.012),{color:s.gold,metal:1,matrix:P.T(0,i,n+t+.004)})])}function NE(i,e,t){let n=i.y,s=i[t];if(e<=n[0])return s[0];for(let r=0;r<n.length-1;r++)if(e<=n[r+1])return s[r]+(s[r+1]-s[r])*(e-n[r])/(n[r+1]-n[r]);return s[s.length-1]}function ip({g:i="m",top:e,hip:t,bottom:n,w0:s=.27,w1:r=.32,out:a=.022,color:o,front:l=!0,back:c=!0,split:h=!0}){let u=qg[i]||qg.m,d=[],f=12,p=6,_=[];l&&_.push("front"),c&&_.push("back");for(let g of _){let m=g==="front"?1:-1,x=h?[[-1,-.012],[1,.012]]:[[0,0]];for(let[M,b]of x){let v=[],S=[];for(let A=0;A<=f;A++){let C=A/f,D=e+(n-e)*C,F=s+(r-s)*Math.max(0,D<t?(t-D)/(t-n):0),O=NE(u,Math.min(D,t+.02),g),L=Math.max(0,t-D),k=O+m*(a+L*.12);for(let G=0;G<=p;G++){let V=G/p,te;M===0||D>t?te=(V-.5)*F:te=M<0?-F/2+V*(F/2-Math.abs(b)):Math.abs(b)+V*(F/2-Math.abs(b));let N=Math.abs(te)/(F/2),Z=k-m*N*N*.035;v.push(te,D,Z)}}for(let A=0;A<f;A++)for(let C=0;C<p;C++){let D=A*(p+1)+C,F=D+1,O=D+p+1,L=O+1;m>0?S.push(D,O,F,F,O,L):S.push(D,F,O,F,L,O)}let R=new ot;R.setAttribute("position",new Ye(v,3)),R.setIndex(S),R.computeVertexNormals();let y=A=>{if(A.y>e-.12)return[["spine_03",1]];if(A.y>t+.12)return[["spine_02",.5],["spine_01",.5]];if(A.y>t-.04)return[["pelvis",1]];let C=Math.min(1,(t-.04-A.y)/.35);if(!h)return[["pelvis",1-C*.5],["thigh_l",C*.25],["thigh_r",C*.25]];let D=A.x>0?"thigh_l":"thigh_r";return[["pelvis",1-C*.75],[D,C*.75]]};d.push({geometry:re(R,{color:o,vary:.03}),weights:y})}}return d}var Qf,P,qg,gl=Vt(()=>{St();Jh();Qf=Pt.degToRad,P={T:(i,e,t)=>new De().makeTranslation(i,e,t),R:(i,e,t)=>new De().makeRotationFromEuler(new Mi(Qf(i),Qf(e),Qf(t))),S:(i,e=i,t=i)=>new De().makeScale(i,e,t),mul:(...i)=>i.reduce((e,t)=>e.multiply(t),new De)};qg={m:{y:[.9,1,1.1,1.2,1.3,1.4,1.5],front:[.126,.107,.1,.105,.131,.112,.05],back:[-.2,-.143,-.116,-.122,-.136,-.147,-.14]},f:{y:[.9,1,1.1,1.2,1.3,1.4,1.48],front:[.113,.108,.108,.16,.16,.096,.03],back:[-.18,-.154,-.09,-.101,-.134,-.141,-.11]}}});function rb(i){let e=[],t=i.ears;if(t&&t.len>0){let r=new w(...t.dir).normalize();e.push((a,o)=>{if(o.hair)return;let l=Math.abs(a.x),c=an(.071,.088,l)*Yn(a.y,.045,.135,.02)*Yn(a.z,-.06,.035,.015);if(!c)return;let h=an(t.from??.065,.13,a.y),u=c*(.25+.75*h)*t.len;a.x+=Math.sign(a.x)*r.x*u,a.y+=r.y*u,a.z+=r.z*u})}let n=i.face||0;if(n===1?e.push(r=>{let a=Yn(r.x,-.022,.022,.01)*Yn(r.y,.015,.085)*an(.08,.11,r.z);r.z+=a*.012,r.y-=a*.004,r.y<.04&&r.z>0&&(r.x*=1-.06*an(.04,-.03,r.y))}):n===2?e.push(r=>{let a=an(.04,-.02,r.y)*an(-.02,.04,r.z);r.x*=1+a*.09,r.z+=a*an(.06,.1,r.z)*.01}):n===3&&e.push(r=>{let a=Yn(Math.abs(r.x),.035,.075)*Yn(r.y,.04,.085)*an(.02,.06,r.z);r.x*=1+a*.07;let o=Yn(r.x,-.02,.02,.01)*Yn(r.y,.015,.075)*an(.09,.12,r.z);r.z-=o*.008}),i.nose){let{len:r=0,wide:a=0,drop:o=0}=i.nose;e.push(l=>{let c=Yn(l.x,-.026,.026,.012)*Yn(l.y,.01,.085,.012)*an(.075,.115,l.z);if(!c)return;let h=an(.1,.13,l.z);l.z+=c*r*(.4+.6*h),l.y-=c*o*h,l.x*=1+c*a})}if(i.jaw){let{wide:r=0,fwd:a=0,brow:o=0}=i.jaw;e.push(l=>{let c=an(.045,-.02,l.y)*an(-.03,.03,l.z);l.x*=1+c*r,l.z+=c*a*an(0,.08,l.z);let h=Yn(l.y,.105,.14,.012)*an(.04,.085,l.z);l.z+=h*o})}if(i.snout){let r=i.snout;e.push((a,o)=>{let l=an(0,.085,a.z)*Yn(a.y,-.07,.085,.03)*(1-an(.045,.085,Math.abs(a.x))*.6);a.z+=l*r,a.y-=l*r*.12,a.x*=1-l*.22;let c=Yn(a.y,.105,.14,.012)*an(.04,.085,a.z);if(a.z+=c*.012,a.y>.15&&(a.y=.15+(a.y-.15)*.85),!o.hair){let h=an(.07,.09,Math.abs(a.x))*Yn(a.y,.04,.14);a.x-=Math.sign(a.x)*h*.012}})}if(i.skullScale){let r=i.skullScale;e.push(a=>{a.x*=r[0],a.y*=r[1],a.z*=r[2]})}if(!e.length)return null;let s=new w;return(r,a,o,l,c)=>{if(o<=.001)return;s.copy(r).sub(l);let h=s.clone();for(let u of e)u(s,c);r.addScaledVector(s.sub(h),o)}}function Es(i,e,t,{radial:n=7,segs:s=14,closed:r=!0,flat:a=1}={}){let o=new zi(i),l=o.computeFrenetFrames(s,!1),c=[],h=[];for(let d=0;d<=s;d++){let f=d/s,p=o.getPointAt(f),_=e+(t-e)*f,g=l.normals[d],m=l.binormals[d];for(let x=0;x<n;x++){let M=x/n*Math.PI*2,b=p.clone().addScaledVector(g,Math.cos(M)*_).addScaledVector(m,Math.sin(M)*_*a);c.push(b.x,b.y,b.z)}}for(let d=0;d<s;d++)for(let f=0;f<n;f++){let p=d*n+f,_=d*n+(f+1)%n,g=(d+1)*n+f,m=(d+1)*n+(f+1)%n;h.push(p,g,_,_,g,m)}if(r){let d=o.getPointAt(1),f=c.length/3;c.push(d.x,d.y,d.z);for(let p=0;p<n;p++)h.push(s*n+p,f,s*n+(p+1)%n)}let u=new ot;return u.setAttribute("position",new Ye(c,3)),u.setIndex(h),u.computeVertexNormals(),u}function ab(i,e,t=1){let n=[];for(let s of[-1,1]){let r,a=.018;i==="carnero"?(r=[xt(s*.05,.16,.04),xt(s*.09,.19,-.02),xt(s*.12,.14,-.07),xt(s*.115,.07,-.03),xt(s*.1,.07,.03),xt(s*.12,.11,.05)],a=.024):i==="rectos"?r=[xt(s*.04,.17,.05),xt(s*.05,.23,.06),xt(s*.055,.29,.05),xt(s*.05,.33,.03)]:i==="toro"?(r=[xt(s*.09,.16,0),xt(s*.17,.17,.02),xt(s*.23,.21,.07),xt(s*.24,.28,.12)],a=.026):i==="atras"?(r=[xt(s*.045,.17,.05),xt(s*.06,.2,-.02),xt(s*.065,.2,-.1),xt(s*.06,.17,-.17)],a=.02):r=[xt(s*.04,.17,.05),xt(s*.08,.22,.03),xt(s*.11,.25,-.03),xt(s*.1,.29,-.07)];let o=Es(r.map(l=>l.multiplyScalar(1)),a*t,.002,{radial:7,segs:12});if(t!==1){let l=r[0];o.translate(-l.x,-l.y,-l.z),o.scale(t,t,t),o.translate(l.x,l.y,l.z)}n.push(re(o,{color:e,vary:.08}));for(let l=1;l<3;l++){let c=l/4,h=new zi(r).getPointAt(c)}}return st(n)}function ob(i){let e=i==="grandes",t=[];for(let n of[-1,1]){let s=new Nt(e?.0075:.005,e?.032:.02,6);t.push(re(s,{color:"#efe6cc",matrix:P.mul(P.T(n*.024,e?.008:.004,.096),P.R(-12,0,n*-12))}))}return st(t)}function lb(i,e){let t=[];if(i==="cresta")for(let n=0;n<6;n++){let s=.4+n*.28,r=.08+Math.sin(s)*.13,a=Math.cos(s)*.1-.02,o=.05-n*.004;t.push(re(new Nt(.012,o,4),{color:e,matrix:P.mul(P.T(0,r,a),P.R(-Math.cos(s)*60-40,0,0),P.T(0,o/2,0),P.S(.5,1,1.6))}))}else if(i==="gola")for(let n of[-1,1])for(let s=0;s<4;s++)t.push(re(new Nt(.01,.07-s*.008,4),{color:e,matrix:P.mul(P.T(n*.07,.03+s*.03,-.04),P.R(0,0,n*-(70+s*8)),P.R(-25,0,0),P.T(0,.03,0),P.S(.4,1,1.4))}));return st(t)}function cb(i,e,{length:t=1,tip:n=!0}={}){let s=i,r=t,a=[xt(s.x,s.y-.02,s.z-.11),xt(s.x,s.y-.18*r,s.z-.26*r),xt(s.x+.1*r,s.y-.5*r,s.z-.36*r),xt(s.x+.04,s.y-.78*r,s.z-.32*r),xt(s.x-.08*r,s.y-.86*r,s.z-.2*r)],o=[re(Es(a,.03,.008,{radial:7,segs:18,closed:!1}),{color:e})];if(n){let l=a[a.length-1],c=new Wn;c.moveTo(0,-.01),c.lineTo(.035,.03),c.lineTo(0,.08),c.lineTo(-.035,.03);let h=new Si(c,{depth:.008,bevelEnabled:!1});o.push(re(h,{color:e,matrix:P.mul(P.T(l.x,l.y,l.z),P.R(0,60,100))}))}return st(o)}function hb(i){return e=>{let t=Math.min(1,Math.max(0,(i-e.y)/.6));return[["pelvis",1-t*.35],["thigh_l",t*.2],["thigh_r",t*.15]]}}function bl(i,e="y"){let t=i.attributes.position;i.computeBoundingBox();let n=i.boundingBox,s=new Float32Array(t.count*2);for(let r=0;r<t.count;r++){let a=e==="y"?(t.getY(r)-n.min.y)/Math.max(1e-4,n.max.y-n.min.y):(t.getZ(r)-n.min.z)/Math.max(1e-4,n.max.z-n.min.z),o=Math.atan2(t.getX(r),t.getZ(r)+.001)/Math.PI*.5+.5;s[r*2]=.06+o*.36,s[r*2+1]=.08+a*.34}return i.setAttribute("uv",new $e(s,2)),i}function ub(i=1){let e=[xt(0,.15,-.085),xt(0,.13,-.135),xt(0,.06,-.15),xt(0,-.04,-.14),xt(0,-.12*i,-.12)],t=Es(e,.03,.012,{radial:8,segs:14}).toNonIndexed(),n=new _t(.022,.007,5,10).toNonIndexed();return n.rotateX(Math.PI/2-.3),n.translate(0,.125,-.135),sp([bl(t),bl(n)])}function db(i=1){let e=[],t=Math.round(9*i);for(let s=0;s<t;s++){let r=s/(t-1),a=.12-r*.38*i,o=-.1-Math.sin(r*Math.PI*.6)*.06-r*.03,l=.024-r*.008,c=new bt(l,7,5).toNonIndexed();c.scale(1,1.5,.85),c.rotateZ((s%2?1:-1)*.5),c.translate((s%2?1:-1)*.004,a,o),e.push(bl(c))}let n=new _t(.014,.005,5,10).toNonIndexed();return n.rotateX(Math.PI/2),n.translate(0,.12-.36*i,-.1-.06*Math.sin(Math.PI*.6)-.03),e.push(bl(n)),sp(e)}function fb(){let i=[];for(let e=0;e<9;e++){let t=-.2+e*.33,n=.1+Math.cos(t-.6)*.115,s=Math.sin(t-.6)*-.11+.01,r=.06+Math.sin(e/8*Math.PI)*.03,a=new Nt(.018,r,5).toNonIndexed();a.scale(.5,1,1.6);let o=xt(0,n-.06,s).normalize();a.applyQuaternion(new Ke().setFromUnitVectors(xt(0,1,0),o)),a.translate(0,n+o.y*r*.4,s+o.z*r*.4),i.push(bl(a))}return sp(i)}function sp(i){let e=[],t=[],n=[];for(let r of i)r.attributes.normal||r.computeVertexNormals(),e.push(...r.attributes.position.array),t.push(...r.attributes.normal.array),n.push(...r.attributes.uv.array);let s=new ot;return s.setAttribute("position",new Ye(e,3)),s.setAttribute("normal",new Ye(t,3)),s.setAttribute("uv",new Ye(n,2)),s}function pb(i){return e=>{let t=Math.min(1,Math.max(0,(i+.08-e.y)/.3));return[["Head",1-t],["neck_01",t*.4],["spine_03",t*.6]]}}var an,Yn,xt,su=Vt(()=>{St();gl();an=(i,e,t)=>{let n=Math.min(1,Math.max(0,(t-i)/(e-i)));return n*n*(3-2*n)},Yn=(i,e,t,n=.015)=>an(e-n,e,i)*(1-an(t,t+n,i));xt=(i,e,t)=>new w(i,e,t)});function UE(i){let e=i.clone();for(let[t,n]of Object.entries(e.attributes)){if(n.array instanceof Float32Array&&!n.normalized&&!n.isInterleavedBufferAttribute)continue;let s=n.count,r=n.itemSize,a=new Float32Array(s*r),o=[n.getX,n.getY,n.getZ,n.getW];for(let l=0;l<s;l++)for(let c=0;c<r;c++)a[l*r+c]=o[c].call(n,l);e.setAttribute(t,new $e(a,r))}return e}function mb(){return rp||(rp=Ys("assets/monsters/piezas.json").then(i=>{let e=new Map;i.scene.updateMatrixWorld(!0),i.scene.traverse(n=>{if(n.isMesh){let s=UE(n.geometry);s.applyMatrix4(n.matrixWorld),e.set(n.name,s)}});let t=e.get("kk_craneo");return t&&(t.computeBoundingBox(),e.headScale=.17/(t.boundingBox.max.x-t.boundingBox.min.x)),e})),rp}function Va(i,e,{scale:t=1,matrix:n=null,metal:s=0,glow:r=0,tint:a=null}={}){let o=i.get(e);if(!o)return null;let l=o.index?o.toNonIndexed():o.clone();t!==1&&l.scale(t,t,t),n&&l.applyMatrix4(n);let c=l.attributes.position.count;if(l.attributes.color){if(l.attributes.color.itemSize===4){let u=l.attributes.color,d=new Float32Array(c*3);for(let f=0;f<c;f++)d.set([u.getX(f),u.getY(f),u.getZ(f)],f*3);l.setAttribute("color",new $e(d,3))}}else{let u=new Float32Array(c*3).fill(.8);l.setAttribute("color",new $e(u,3))}if(a){let u=new ye(a),d=l.attributes.color;for(let f=0;f<c;f++)d.setXYZ(f,d.getX(f)*u.r,d.getY(f)*u.g,d.getZ(f)*u.b)}let h=new Float32Array(c*2);for(let u=0;u<c;u++)h.set([s,r],u*2);l.setAttribute("metal",new $e(h,2));for(let u of Object.keys(l.attributes))["position","normal","color","metal"].includes(u)||l.deleteAttribute(u);return l}function mi(i,e,t,n,{knob:s=1.7,flat:r=1}={}){let a=i.distanceTo(e);if(t<.0065){let h=new zs([new $(1e-4,0),new $(t*1.4,a*.12),new $(t*.9,a*.5),new $(t*1.4,a*.88),new $(1e-4,a)],4),u=new Ke().setFromUnitVectors(new w(0,1,0),e.clone().sub(i).normalize());return h.applyMatrix4(new De().compose(i,u,new w(1,1,1))),re(h,{color:n,vary:.12})}let o=[new $(1e-4,0),new $(t*s*.9,a*.02),new $(t*s,a*.07),new $(t*1.05,a*.18),new $(t*.85,a*.5),new $(t*1.05,a*.82),new $(t*s,a*.93),new $(t*s*.85,a*.985),new $(1e-4,a)],l=new zs(o,7);l.scale(1,1,r);let c=new Ke().setFromUnitVectors(new w(0,1,0),e.clone().sub(i).normalize());return l.applyMatrix4(new De().compose(i,c,new w(1,1,1))),re(l,{color:n,vary:.12})}function gb(i,e={}){let t=u=>i.get(u).getWorldPosition(new w),n=new ye(e.color||"#d8ccae"),s=n.clone().multiplyScalar(.7),r=[],a=(u,d)=>u&&r.push({geometry:u,bone:d});for(let u of["l","r"]){a(mi(t(`upperarm_${u}`),t(`lowerarm_${u}`),.017,n),`upperarm_${u}`);let d=t(`lowerarm_${u}`),f=t(`hand_${u}`),p=new w(0,0,.011);a(mi(d.clone().add(p),f.clone().add(p),.009,n),`lowerarm_${u}`),a(mi(d.clone().sub(p),f.clone().sub(p).add(new w(0,-.006,0)),.008,s),`lowerarm_${u}`),a(mi(t(`clavicle_${u}`).add(new w(0,0,.02)),t(`upperarm_${u}`).add(new w(0,.01,.02)),.009,n,{knob:1.4}),`clavicle_${u}`);let _=t(`upperarm_${u}`).lerp(t("spine_03"),.45).add(new w(0,-.04,-.09));a(re(new hi(.06,3),{color:s,matrix:P.mul(P.T(_.x,_.y,_.z),P.R(0,180,u==="l"?15:-15))}),"spine_03");for(let M of["index","middle","ring","pinky","thumb"]){let b=[`${M}_01_${u}`,`${M}_02_${u}`,`${M}_03_${u}`,`${M}_04_leaf_${u}`].filter(v=>i.has(v));a(mi(t(`hand_${u}`),t(b[0]),.0045,n,{knob:1.3}),`hand_${u}`);for(let v=0;v+1<b.length;v++)a(mi(t(b[v]),t(b[v+1]),.004,n,{knob:1.3}),b[v])}a(mi(t(`thigh_${u}`),t(`calf_${u}`),.022,n),`thigh_${u}`);let g=t(`calf_${u}`),m=t(`foot_${u}`);a(mi(g,m,.017,n),`calf_${u}`),a(mi(g.clone().add(new w(u==="l"?.02:-.02,-.03,-.01)),m.clone().add(new w(u==="l"?.022:-.022,.02,-.01)),.007,s),`calf_${u}`),a(re(new bt(.022,6,4),{color:n,matrix:P.mul(P.T(g.x,g.y+.01,g.z+.035),P.S(1,1.2,.6))}),`calf_${u}`);let x=t(`ball_${u}`);for(let M of[-.025,-.008,.008,.025])a(mi(m.clone().add(new w(M*.5,-.02,0)),x.clone().add(new w(M,0,0)),.006,n,{knob:1.3}),`foot_${u}`),i.has(`ball_leaf_${u}`)&&a(mi(x.clone().add(new w(M,0,0)),t(`ball_leaf_${u}`).add(new w(M,.003,-.02)),.005,n,{knob:1.2}),`ball_${u}`);a(re(new bt(.03,6,4),{color:n,matrix:P.mul(P.T(m.x,m.y-.04,m.z-.035),P.S(.8,.7,1.1))}),`foot_${u}`)}let o=["pelvis","spine_01","spine_02","spine_03","neck_01","Head"];for(let u=0;u+1<o.length;u++){let d=t(o[u]),f=t(o[u+1]),p=o[u]==="neck_01"?3:4;for(let _=0;_<p;_++){let g=d.clone().lerp(f,(_+.5)/p).add(new w(0,0,-.03)),m=o[u].startsWith("neck")?.014:.019;a(re(new Mt(m,m,.022,7),{color:n,matrix:P.T(g.x,g.y,g.z)}),o[u]),a(re(new Nt(.008,.035,4),{color:s,matrix:P.mul(P.T(g.x,g.y-.008,g.z-.025),P.R(-110,0,0))}),o[u])}}let l=t("pelvis");for(let u of[-1,1])a(re(new bt(.075,8,5,0,Math.PI,0,Math.PI*.75),{color:n,matrix:P.mul(P.T(l.x+u*.075,l.y+.02,l.z-.01),P.R(0,u*90+180,0),P.S(1,.85,.35))}),"pelvis"),a(mi(new w(l.x+u*.03,l.y-.06,l.z+.04),new w(l.x+u*.09,l.y-.03,l.z+0),.012,n,{knob:1.2}),"pelvis");a(re(new Nt(.04,.11,6),{color:s,matrix:P.mul(P.T(l.x,l.y-.03,l.z-.05),P.R(180,0,0))}),"pelvis");let c=t("spine_03"),h=t("spine_02");for(let u=0;u<6;u++){let d=u/5,f=c.y+.1-d*.21,p=.085+Math.sin((d*.75+.15)*Math.PI)*.055,_=.075+Math.sin((d*.8+.1)*Math.PI)*.035,g=c.z-.01,m=f>c.y-.02?"spine_03":"spine_02";for(let x of[-1,1]){let M=[];for(let b=0;b<=6;b++){let v=-Math.PI/2+b/6*Math.PI*.92;M.push(new w(x*Math.cos(v)*p,f-b*.008+(u>3,0),g+Math.sin(v)*_))}M[0].z=g-_*.75,M[0].x=x*.015,a(re(Es(M,.007,.005,{radial:5,segs:8,closed:!1,flat:.6}),{color:n,vary:.1}),m)}}if(a(re(new At(.03,.17,.012),{color:n,matrix:P.T(c.x,c.y-.02,c.z+.1)}),"spine_03"),e.pieces){let u=t("Head"),d=(e.pieces.headScale||.2)*(e.headScale??1),f=e.skull==="mago"?"kk_craneo_mago":"kk_craneo",p=P.mul(P.T(u.x,u.y-.055,u.z+.005),P.S(d));a(Va(e.pieces,f,{matrix:p,tint:e.color?n.clone().multiplyScalar(1.25):null}),"Head"),a(Va(e.pieces,"kk_mandibula",{matrix:p,tint:e.color?n.clone().multiplyScalar(1.25):null}),"Head"),a(Va(e.pieces,"kk_ojos",{matrix:p,glow:1,tint:e.eyes||null}),"Head")}return r}function bb(i,e,{y0:t,y1:n,w:s=.3}={}){let a=(c=>i.get(c).getWorldPosition(new w))("pelvis"),o=new Mt(.14,.2,t-n,12,4,!0);o.translate(0,(t+n)/2,a.z-.01),o.scale(1,1,.8);let l=o.attributes.position;for(let c=0;c<l.count;c++){let h=(t-l.getY(c))/(t-n),u=Math.atan2(l.getZ(c),l.getX(c));l.setY(c,l.getY(c)-Math.max(0,Math.sin(u*5)*.06*h))}return o.computeVertexNormals(),st([re(o,{color:e,vary:.25})])}var rp,_b=Vt(()=>{St();ka();gl();su();rp=null});function kE(i,e,t){let n=new Map;for(let r of t)n.set(r.name,r.quaternion.clone());let s=new w;for(let r of i.tracks){let[a,o]=r.name.split("."),l=r.times,c=0;for(;c<l.length-1&&l[c+1]<=e;)c++;let h=r.getValueSize();o==="quaternion"&&n.has(a)&&n.set(a,new Ke().fromArray(r.values,c*h)),o==="position"&&a==="pelvis"&&s.fromArray(r.values,c*h)}return{q:n,pelvis:s}}function ru(i,e,t,n={}){let s=new Map,r=new Map,a=(l,c)=>{let h=(e.get(l.name)||l.quaternion).clone();n[l.name]&&h.multiply(n[l.name]);let u=c.clone().multiply(h),d=t[l.name];if(d){let f=ap.clone().applyQuaternion(u);u=new Ke().setFromUnitVectors(f,d.clone().normalize()).multiply(u),n[`${l.name}+`]&&u.multiply(n[`${l.name}+`]),h=c.clone().invert().multiply(u)}s.set(l.name,h),r.set(l.name,u);for(let f of l.children)f.isBone&&a(f,u)},o=new Ke;return i.parent?.getWorldQuaternion(o),a(i,o),s}function xb(i,e){let t=[];i.traverse(_=>_.isBone&&t.push(_));let n=e.get("Sword_Idle")||e.get("Idle_Loop");if(!n)return[];let{q:s,pelvis:r}=kE(n,.2,t),a=_=>new Ke().setFromAxisAngle(ap,_),o=new Ke().setFromAxisAngle(ap,Math.PI/2),l={spine_02:a(-.25),spine_03:a(-.3),neck_01:a(.25),Head:a(.3),"lowerarm_l+":o},c=Vn(.12,.1,1),h=ru(i,s,{upperarm_l:Vn(.35,-.55,.8),lowerarm_l:Vn(.2,-.2,1),hand_l:Vn(.2,-.15,1),upperarm_r:Vn(-.3,-.85,.2),lowerarm_r:Vn(-.05,-.5,.8)},l),u=ru(i,s,{upperarm_l:c,lowerarm_l:c,hand_l:c,upperarm_r:Vn(-.62,.08,-.55),lowerarm_r:Vn(.7,.12,.72),hand_r:Vn(.6,.1,.8)},l),d=ru(i,s,{upperarm_l:c,lowerarm_l:c,hand_l:c,upperarm_r:Vn(-.6,.1,-.75),lowerarm_r:Vn(.62,.15,.72),hand_r:Vn(.55,.1,.8)},l),f=ru(i,s,{upperarm_l:c,lowerarm_l:c,hand_l:c,upperarm_r:Vn(-.75,.15,-.6),lowerarm_r:Vn(-.2,.35,-.9),hand_r:Vn(-.3,.2,-.9)},l),p=(_,g)=>{let m=[];for(let x of t){let M=[],b=[];for(let[v,S]of g)M.push(v),b.push(...S.get(x.name).toArray());m.push(new ni(`${x.name}.quaternion`,M,b))}return m.push(new ui("pelvis.position",[0,g[g.length-1][0]],[...r.toArray(),...r.toArray()])),new jn(_,g[g.length-1][0],m)};return[p("P_Bow_Shoot",[[0,h],[.32,u],[.55,d],[.62,f],[.85,f],[1.15,h]]),p("P_Bow_Aim",[[0,d],[1.2,u],[2.4,d]]),p("P_Bow_Ready",[[0,h],[2,h]])]}var ap,Vn,vb=Vt(()=>{St();ap=new w(0,1,0),Vn=(i,e,t)=>new w(i,e,t).normalize()});function WE(i){let e=[];return(i==="elf"||i==="half_elf"||i==="gnome")&&e.push({key:"ears",label:"Orejas",type:"choice",options:Ci([["puntiagudas","Puntiagudas"],["largas","Largas"],["cortas","Cortas"]])}),i==="tiefling"&&(e.push({key:"horns",label:"Cuernos",type:"choice",options:Ci([["curvos","Curvos"],["carnero","De carnero"],["rectos","Rectos"],["atras","Hacia atr\xE1s"],["ninguno","Sin cuernos"]])}),e.push({key:"hornColor",label:"Color de los cuernos",type:"color",options:["#2a2020","#4a3a30","#6a5a4a","#c8b8a0","#3a2a40","#8a2a2a"]}),e.push({key:"tail",label:"Cola",type:"toggle"})),i==="dragonborn"&&(e.push({key:"horns",label:"Cuernos",type:"choice",options:Ci([["atras","Hacia atr\xE1s"],["rectos","Rectos"],["curvos","Curvos"],["ninguno","Sin cuernos"]])}),e.push({key:"hornColor",label:"Color de los cuernos",type:"color",options:["#e8dcc0","#c8b8a0","#5a4a3a","#2a2420","#b0a090"]}),e.push({key:"frill",label:"Cresta",type:"choice",options:Ci([["cresta","Cresta"],["gola","Gola"],["ninguna","Ninguna"]])})),(i==="orc"||i==="half_orc")&&e.push({key:"tusks",label:"Colmillos",type:"choice",options:Ci([["grandes","Grandes"],["pequenos","Peque\xF1os"],["ninguno","Ninguno"]])}),i==="goliath"&&(e.push({key:"marks",label:"Marcas",type:"choice",options:Ci([["lineas","L\xEDneas"],["manchas","Manchas"],["runas","Runas"],["ninguna","Ninguna"]])}),e.push({key:"marksColor",label:"Color de las marcas",type:"color",options:["#4a4a52","#3a3028","#6a7a8a","#2a3a4a","#7a5a3a"]})),e}function hp(i,{lineage:e,ancestry:t}={}){if(i==="dragonborn"){let n=Nr[t]||Nr.red;return[n,...Object.values(Nr).filter(s=>s!==n)]}return i==="elf"&&e==="drow"?op.drow:op[i]||op.human}function up(i,e={}){let t=_l[i]?i:"human",n=t==="tiefling"||t==="dragonborn"||t==="elf"&&e.lineage==="drow",s=[{key:"body",label:"Cuerpo",type:"choice",options:Ci([["m","Masculino"],["f","Femenino"]])},{key:"face",label:"Rostro",type:"choice",options:[0,1,2,3].map(r=>({id:r,label:["I","II","III","IV"][r]}))},{key:"skin",label:t==="dragonborn"?"Escamas":"Piel",type:"color",options:hp(t,e)},{key:"eyes",label:"Ojos",type:"color",options:n?[...BE,...cp]:cp}];return t!=="dragonborn"&&(s.push({key:"hair",label:"Peinado",type:"choice",options:Ci(HE)}),s.push({key:"hairColor",label:"Color del pelo",type:"color",options:n||t==="elf"?[...lp,...OE]:lp}),s.push({key:"beard",label:"Barba",type:"choice",options:Ci(zE)})),s.push({key:"cloth1",label:"Ropa (color principal)",type:"color",options:yb},{key:"cloth2",label:"Ropa (color secundario)",type:"color",options:yb},{key:"metal",label:"Metal",type:"choice",options:Object.entries(Wa).map(([r,a])=>({id:r,label:a.label,swatch:a.color}))},{key:"height",label:"Altura",type:"range",min:.94,max:1.06,step:.01},{key:"build",label:"Complexi\xF3n",type:"choice",options:Ci(GE)},{key:"helmet",label:"Casco (con armadura media o pesada)",type:"toggle"},{key:"hood",label:"Capucha",type:"choice",options:Ci([["auto","Seg\xFAn la clase"],["si","Puesta"],["no","Quitada"]])},...WE(t)),{species:t,name:VE[t],fields:s,defaults:au(t,e)}}function au(i,e={}){let t=_l[i]?i:"human",n=e.body||(e.pronoun==="f"?"f":"m"),s=hp(t,e),r={body:n,face:0,skin:s[t==="human"?1:0],eyes:cp[0],hair:n==="f"?"largo":"raya",hairColor:t==="elf"&&e.lineage==="drow"?"#e8e4dc":lp[1],beard:n==="m"&&t==="dwarf"?"larga":"ninguna",cloth1:"#3f5f9a",cloth2:"#c9b48a",metal:"acero",height:1,build:t==="dwarf"||t==="goliath"||t==="orc"?"robusta":"media",helmet:!1,hood:"auto",...qE[t]||{}};return t==="dragonborn"&&(r.hair="calvo",r.beard="ninguna",r.eyes="#d8a020"),t==="tiefling"&&(r.eyes="#d8a020"),t==="goliath"&&(r.hair="rapado"),r}function Jn(i=1){let e=(typeof i=="string"?[...i].reduce((t,n)=>t*31+n.charCodeAt(0)|0,7):i)>>>0||1;return()=>(e^=e<<13,e^=e>>>17,e^=e<<5,(e>>>0)%1e5/1e5)}function Mb(i,e={},t=Date.now()){let n=Jn(t),s=o=>o[Math.floor(n()*o.length)],r=up(i,e),a={...r.defaults};for(let o of r.fields)o.type==="choice"?a[o.key]=s(o.options).id:o.type==="color"?a[o.key]=s(o.options):o.type==="range"?a[o.key]=Math.round((o.min+n()*(o.max-o.min))/o.step)*o.step:o.type==="toggle"&&(a[o.key]=n()<.7);return e.body&&(a.body=e.body),a.body==="f"&&n()<.9&&(a.beard="ninguna"),i==="dwarf"&&a.body==="m"&&a.beard==="ninguna"&&(a.beard="larga"),i==="dragonborn"&&(a.skin=hp(i,e)[0]),a}function ou(i={},e="human",t={}){let s={...au(e,{...t,body:i.body||t.body})};for(let[r,a]of Object.entries(i||{}))a!=null&&a!==""&&(s[r]=a);return(typeof s.height!="number"||!isFinite(s.height))&&(s.height=1),s.height=Math.min(1.08,Math.max(.92,s.height)),s.face=Math.max(0,Math.min(3,Number(s.face)||0)),s}var op,Nr,lp,OE,cp,BE,yb,Wa,HE,zE,GE,_l,VE,Ci,qE,Fr=Vt(()=>{op={human:["#f1c9a5","#e0ac83","#c68a5c","#a0683f","#7a4a2a","#4f2f1c"],elf:["#f4d8c0","#e8c09a","#c99a72","#a77a58","#8d6a8f","#5d4b6e"],drow:["#5d4b6e","#4a3f5c","#3b3550","#55505e","#2f2a3a","#6a5a7a"],half_elf:["#f3d3b5","#e6bc96","#cf9c72","#a8764f","#7f5538","#5a3c2a"],dwarf:["#f0c8a0","#d9a77d","#b98157","#8f5d3a","#6b4227","#a88a78"],halfling:["#f2cfa8","#e2b48a","#c9925f","#9c6b42","#6e4728"],gnome:["#f3d2b0","#e3b58f","#c48f66","#9a6a46","#7a5a48"],goliath:["#c9b8a6","#a89a8c","#8f8a86","#b7a189","#7d7468","#9aa0a8"],orc:["#7f9a6a","#6b8a5c","#8c9a7a","#5d6e55","#9aa58a","#7a7f6e"],half_orc:["#a9b18f","#93a07c","#c4a98a","#8f8f7a","#7c8a68","#b59a7a"],tiefling:["#b84a4a","#9b3c55","#7d4e8f","#c9826b","#5a3e6e","#d8a0a0","#e0ac83"]},Nr={black:"#2b2b33",blue:"#2f5fb3",brass:"#c79a3c",bronze:"#9c6b2f",copper:"#b8693a",gold:"#d9b13b",green:"#3f8a4a",red:"#b33a2c",silver:"#b9c2cc",white:"#e8eef2"},lp=["#1e1612","#3b2a1e","#5a3a22","#8a5a2e","#b0702e","#9a3a1c","#d8b070","#e8d8a8","#9a948c","#e8e4dc"],OE=["#e8e4dc","#c8d0e0","#3a3a5a","#5a2a4a","#2a4a5a","#8a2a2a"],cp=["#5a3a1e","#3a5a8a","#4a7a4a","#7a6a4a","#5a5a6a","#2a1a12"],BE=["#d8a020","#c03020","#e8e0c0","#8040c0","#20a0a0"],yb=["#3f5f9a","#7a2e2a","#3e6b3a","#5a3f6b","#2e2a28","#8a6a3a","#c9b48a","#e8dcc0","#6b6f78","#2f4f5a","#9a7a2a","#4a2e1e"],Wa={acero:{label:"Acero",color:"#b8bec6"},hierro:{label:"Hierro",color:"#7d8188"},bronce:{label:"Bronce",color:"#b5803e"},laton:{label:"Lat\xF3n",color:"#c9a64a"},oro:{label:"Oro",color:"#e0b84a"},pavonado:{label:"Pavonado",color:"#3c4048"}},HE=[["raya","Con raya"],["largo","Largo"],["mono","Mo\xF1os"],["coleta","Coleta"],["trenza","Trenza"],["rapado","Rapado"],["cresta","Cresta"],["calvo","Calvo"]],zE=[["ninguna","Sin barba"],["barba","Barba"],["perilla","Perilla"],["bigote","Bigote"],["larga","Barba larga"],["trenzada","Barba trenzada"]],GE=[["delgada","Delgada"],["media","Media"],["robusta","Robusta"]],_l={human:{scale:1},elf:{scale:1,width:.94,legs:1.03,neck:1.05},half_elf:{scale:1,width:.97},dwarf:{scale:.8,width:1.18,head:1.12,legs:.82,arms:.95,hands:1.12,neck:.8},halfling:{scale:.57,width:1.04,head:1.16,legs:.92,hands:1},gnome:{scale:.55,width:1,head:1.24,legs:.88,hands:1.05},dragonborn:{scale:1.07,width:1.08,neck:1.12,hands:1.08},goliath:{scale:1.17,width:1.1,hands:1.1,head:.96},orc:{scale:1.05,width:1.1,hands:1.08,neck:.92},half_orc:{scale:1.03,width:1.06,hands:1.04},tiefling:{scale:1,width:.98}},VE={human:"Humano",elf:"Elfo",half_elf:"Semielfo",dwarf:"Enano",halfling:"Mediano",gnome:"Gnomo",dragonborn:"Drac\xF3nido",goliath:"Goliat",orc:"Orco",half_orc:"Semiorco",tiefling:"Tiflin"},Ci=i=>i.map(([e,t])=>({id:e,label:t}));qE={elf:{ears:"largas"},half_elf:{ears:"puntiagudas"},gnome:{ears:"puntiagudas"},tiefling:{horns:"curvos",hornColor:"#2a2020",tail:!0},dragonborn:{horns:"atras",hornColor:"#e8dcc0",frill:"cresta"},orc:{tusks:"grandes"},half_orc:{tusks:"pequenos"},goliath:{marks:"lineas",marksColor:"#4a4a52"}}});var Tb={};Tu(Tb,{heroLook:()=>Pi,sampleSheet:()=>fp,shade:()=>qa,weaponLoadout:()=>hu});function XE(i,e,t){let n={face:e.face||0},s={},r={},a={largas:.075,puntiagudas:.045,cortas:.022};if(i==="elf"||i==="half_elf"||i==="gnome"){let o=a[e.ears]??(i==="elf"?.075:.04);n.ears={len:i==="half_elf"?o*.7:o,dir:[.45,.85,-.6]}}if(i==="gnome"&&(n.nose={len:.012,wide:.18,drop:.004}),i==="dwarf"&&(n.nose={len:.008,wide:.14,drop:.003},n.jaw={wide:.05,brow:.006}),i==="halfling"&&(n.nose={len:.003,wide:.06}),i==="orc"||i==="half_orc"){let o=i==="orc"?1:.55;n.jaw={wide:.11*o,fwd:.014*o,brow:.013*o},n.nose={len:-.004*o,wide:.22*o},n.ears={len:.022*o,dir:[.6,.6,-.5]},e.tusks&&e.tusks!=="ninguno"&&(s.tusks=e.tusks)}if(i==="goliath"){n.jaw={wide:.06,brow:.01};let o={lineas:2,manchas:3,runas:4}[e.marks];o&&Object.assign(r,{pattern:o,patternColor:e.marksColor||"#4a4a52"})}return i==="tiefling"&&(e.horns&&e.horns!=="ninguno"&&(s.horns={kind:e.horns,color:e.hornColor||"#2a2020"}),e.tail!==!1&&(s.tail={color:qa(e.skin,.9),tip:!0}),n.jaw={brow:.004}),i==="dragonborn"&&(n.snout=.068,e.horns&&e.horns!=="ninguno"&&(s.horns={kind:e.horns,color:e.hornColor||"#e8dcc0",scale:1.1}),e.frill&&e.frill!=="ninguna"&&(s.frill={kind:e.frill,color:qa(e.skin,.75)}),Object.assign(r,{pattern:1,patternColor:qa(e.skin,.5)})),{head:n,extras:s,fx:r}}function qa(i,e){let t=parseInt(String(i||"#888888").slice(1),16);return"#"+[t>>16&255,t>>8&255,t&255].map(s=>Math.max(0,Math.min(255,Math.round(s*e)))).map(s=>s.toString(16).padStart(2,"0")).join("")}function hu(i,{prefer:e}={}){let t=i.class||"",n=(i.weapons||[]).filter(h=>h&&h!=="unarmed");(cu.has(t)||t==="druid")&&(n=n.map(h=>h==="quarterstaff"?t==="druid"?"druid_staff":"arcane_staff":h));let s=n.filter(h=>!dp.has(h)&&h!=="javelin"),r=n.filter(h=>dp.has(h)&&h!=="dart"),a=!!i.shield,o={main:null,off:null,shield:null,back:[],sheath:null,style:"1h",grips:[]},l=t==="cleric"||t==="paladin"?t==="cleric"?"sol":"cometa":i.armor&&wb[i.armor]?.cat==="heavy"?"cometa":"redondo";if((e==="ranged"||e!=="melee"&&r.length&&(!s.length||(t==="ranger"||t==="rogue")&&dp.has(n[0])))&&r.length){let h=r[0];h.endsWith("bow")&&!h.includes("crossbow")?(o.off=h,o.grips.push("l"),o.style="bow"):(o.main=h,o.grips.push("r"),o.style="crossbow"),s[0]&&(o.sheath=s[0]),a&&o.back.push(`escudo:${l}`)}else{let h=s[0];if(h&&(o.main=h,o.grips.push("r"),lu.has(h)?(o.style=(h.endsWith("staff")||h==="quarterstaff")&&(cu.has(t)||t==="druid")?"staff":"2h",o.grips.push("l")):Sb.has(h)&&(o.style="polearm",o.grips.push("l"))),a&&!lu.has(h)&&!Sb.has(h)?(o.shield=l,o.style=h?"shield":o.style):h&&Eb.has(h)&&s[1]&&Eb.has(s[1])&&!lu.has(h)&&(o.off=s[1],o.grips.push("l"),o.style="dual"),r[0]){let u=r[0];u.endsWith("bow")&&!u.includes("crossbow")?o.back.push(`arma:${u}`):u!=="sling"&&o.back.push(`arma:${u}`)}!h&&!r.length&&(cu.has(t)?(o.main="wand",o.grips.push("r"),o.style="caster"):o.style="unarmed"),cu.has(t)&&h&&!lu.has(h)&&(o.style="caster")}return r.some(h=>h.endsWith("bow")&&!h.includes("crossbow"))&&o.back.unshift("carcaj"),o}function jE(i,e,t){let n=i.class||"fighter",s=wb[i.armor]||null,r={torso:"ex",brazos:"ex",piernas:"ex",pies:"ex",cintos:!0},a={main:t.main,off:t.off,shield:t.shield,back:t.back.slice(),sheath:t.sheath},o=0,l=s?.look;switch((l==="malla"||l==="anillas"||l==="camisote")&&(o=1),l==="escamas"&&(o=2),(l==="semiplacas"||l==="bandas"||l==="placas")&&(o=1,a.breastplate="placas",a.pauldrons=l==="semiplacas"?!0:"grandes",a.greaves=!0,l!=="semiplacas"&&(a.bracers=!0)),l==="coraza"&&(a.breastplate="coraza"),s&&(s.cat==="medium"||s.cat==="heavy")&&l!=="pieles"&&(r.hombrera=!a.pauldrons),l==="pieles"&&(a.mantle="pieles"),s&&s.cat!=="light"&&(r.brazales=!a.bracers),l==="acolchada"&&(r.torso="ca"),n){case"barbarian":s||(r.torso="piel",r.brazos="piel",a.mantle="pieles",a.bracers="cuero");break;case"bard":r.torso="ca",r.brazos="ca",a.cape="corta",a.hat="chambergo",a.back.push("laud");break;case"cleric":a.tabard="larga",a.emblem=!0,s||(r.torso="ca",r.brazos="ca",a.robe="larga");break;case"druid":r.torso="ca",r.brazos="ca",a.mantle="hojas",a.hat="astas";break;case"fighter":break;case"monk":r.torso="ca",r.brazos="ca",r.piernas="ca",r.pies="ca",r.cintos=!1,a.sash=e.cloth2;break;case"paladin":a.tabard="larga",a.emblem=!0,a.cape="larga";break;case"ranger":r.capucha=!0,r.hombrera=!0;break;case"rogue":r.capucha=!0,a.pouch=!0;break;case"sorcerer":r.torso="ca",r.brazos="ca",a.robe="corta",a.hat="diadema";break;case"warlock":r.torso="ca",r.brazos="ca",r.capucha=!0,a.robe="larga",a.book=!0;break;case"wizard":r.torso="ca",r.brazos="ca",a.robe="larga",a.hat="mago",a.book=!0,a.pouch=!0;break;default:break}return a.robe&&(r.cintos=!1),e.helmet&&(s?.cat==="heavy"||s?.cat==="medium")&&(a.helmet=e.helmet===!0?"casco":e.helmet),(e.hood===!1||e.hood==="no")&&(r.capucha=!1),(e.hood===!0||e.hood==="si")&&(r.capucha=!0),{outfit:r,gear:a,mail:o}}function Pi(i,e={}){let t=_l[i.species]?i.species:"human",n={lineage:i.lineage,ancestry:i.ancestry,pronoun:i.pronoun},s=ou(i.appearance||KE(i),t,n);t==="dragonborn"&&!i.appearance?.skin&&i.ancestry&&(s.skin=Nr[i.ancestry]||s.skin);let r={..._l[t]};i.size==="small"&&(r.scale??1)>.7&&(r.scale=.64,r.head=(r.head??1)*1.12);let a={delgada:{width:.94,thick:.92},media:{},robusta:{width:1.07,thick:1.1}}[s.build]||{},o={...r,width:(r.width??1)*(a.width??1),thick:a.thick??1,height:s.height??1},{head:l,extras:c,fx:h}=XE(t,s,n),u=hu(i,e),{outfit:d,gear:f,mail:p}=jE(i,s,u),_=Wa[s.metal]?.color||s.metal||Wa.acero.color;return{id:i.id||i.name||"",kind:"hero",species:t,body:s.body,hair:t==="dragonborn"?"calvo":s.hair,beard:t==="dragonborn"?"ninguna":s.beard,brows:t!=="dragonborn",colors:{skin:s.skin,hair:s.hairColor,eyes:s.eyes,cloth1:s.cloth1,cloth2:s.cloth2},metalColor:_,skinFx:h,mail:p,glowEyes:t==="tiefling"?.35:t==="dragonborn"?.15:0,prop:o,head:l,extras:c,outfit:d,gear:f,style:u.style,grips:u.grips,appearance:s}}function KE(i){let e=i.visual||{},t={};return e.skin&&(t.skin=e.skin),e.hair&&(t.hairColor=e.hair),e.cloth&&(t.cloth1=e.cloth),i.pronoun==="f"&&(t.body="f"),t}function fp(i,e="m",t="human"){let n={barbarian:{armor:"",weapons:["greataxe","handaxe"],shield:!1,appearance:{cloth1:"#6b3a2a",cloth2:"#8a6a3a",hair:"largo",beard:"barba",hairColor:"#8a5a2e"}},bard:{armor:"leather",weapons:["rapier","dagger"],shield:!1,appearance:{cloth1:"#7a2e5a",cloth2:"#e8dcc0",hair:"raya"}},cleric:{armor:"scale_mail",weapons:["mace"],shield:!0,appearance:{cloth1:"#e8dcc0",cloth2:"#c9a64a",metal:"laton",hair:"mono"}},druid:{armor:"leather",weapons:["quarterstaff","sickle"],shield:!1,appearance:{cloth1:"#3e6b3a",cloth2:"#8a6a3a",hair:"trenza",hairColor:"#b0702e"}},fighter:{armor:"chain_mail",weapons:["longsword","javelin"],shield:!0,appearance:{cloth1:"#7a2e2a",cloth2:"#c9b48a",hair:"rapado",beard:"perilla"}},monk:{armor:"",weapons:["quarterstaff","dart"],shield:!1,appearance:{cloth1:"#c9822a",cloth2:"#7a2e2a",hair:"calvo"}},paladin:{armor:"plate",weapons:["longsword","javelin"],shield:!0,appearance:{cloth1:"#3f5f9a",cloth2:"#e8dcc0",metal:"acero",hair:"raya",hairColor:"#d8b070"}},ranger:{armor:"studded_leather",weapons:["longbow","shortsword","shortsword"],shield:!1,appearance:{cloth1:"#3e6b3a",cloth2:"#6b5a3a"}},rogue:{armor:"leather",weapons:["shortsword","dagger","shortbow"],shield:!1,appearance:{cloth1:"#2e2a28",cloth2:"#4a3a30"}},sorcerer:{armor:"",weapons:["dagger"],shield:!1,appearance:{cloth1:"#7a2e2a",cloth2:"#d8b070",hair:"coleta",hairColor:"#9a3a1c"}},warlock:{armor:"leather",weapons:["dagger"],shield:!1,appearance:{cloth1:"#2a2438",cloth2:"#5a3f6b"}},wizard:{armor:"",weapons:["quarterstaff","dagger"],shield:!1,appearance:{cloth1:"#2f4f8a",cloth2:"#c9a64a",beard:"larga",hairColor:"#9a948c"}}}[i]||{armor:"",weapons:[]},s={body:e,...n.appearance};return e==="f"&&delete s.beard,{class:i,species:t,...n,appearance:s}}var wb,dp,lu,Sb,Eb,cu,xl=Vt(()=>{Fr();wb={padded:{cat:"light",look:"acolchada"},leather:{cat:"light",look:"cuero"},studded_leather:{cat:"light",look:"tachonada"},hide:{cat:"medium",look:"pieles"},chain_shirt:{cat:"medium",look:"camisote"},scale_mail:{cat:"medium",look:"escamas"},breastplate:{cat:"medium",look:"coraza"},half_plate:{cat:"medium",look:"semiplacas"},ring_mail:{cat:"heavy",look:"anillas"},chain_mail:{cat:"heavy",look:"malla"},splint:{cat:"heavy",look:"bandas"},plate:{cat:"heavy",look:"placas"}},dp=new Set(["shortbow","longbow","light_crossbow","heavy_crossbow","hand_crossbow","sling","dart"]),lu=new Set(["greatsword","greataxe","maul","greatclub","quarterstaff","arcane_staff","druid_staff"]),Sb=new Set(["spear","glaive","halberd","javelin"]),Eb=new Set(["dagger","shortsword","scimitar","handaxe","light_hammer","sickle","club"]),cu=new Set(["wizard","sorcerer","warlock"])});var Ib={};Tu(Ib,{buildHumanoid:()=>$s,gripMatrix:()=>uu});function Sn(i,e){return i.get(e).getWorldPosition(new w)}function JE(i){let e=new Map,t=(a,o)=>{for(let l of ZE)a.test(l)&&e.set(l,(e.get(l)||En(1,1,1)).clone().multiply(o))},n=i.width??1,s=i.thick??1;t(/^spine_0[123]$|^pelvis$/,En(n,1,n)),t(/^clavicle_[lr]$/,En(1,1+(n-1)*.7,1)),t(/^(upperarm|lowerarm)_[lr]$/,En(s*(1+(n-1)*.7),i.arms??1,s*(1+(n-1)*.7))),t(/^(thigh|calf)_[lr]$/,En(s*(1+(n-1)*.6),i.legs??1,s*(1+(n-1)*.6))),t(/^hand_[lr]$/,En(i.hands??1,i.hands??1,i.hands??1)),t(/^neck_01$/,En(1+(n-1)*.5,i.neck??1,1+(n-1)*.5));let r=i.head??1;return t(/^Head$/,En(r,r,r)),i.spine&&t(/^spine_0[123]$/,En(1,i.spine,1)),e}function Cb(i){if(pp.has(i))return pp.get(i);let e=i.geometry,t=i.skeleton,n=t.bones.map((u,d)=>u.matrixWorld.clone().multiply(t.boneInverses[d]).multiply(i.bindMatrix)),s=e.attributes.position,r=e.attributes.skinIndex,a=e.attributes.skinWeight,o=new Float32Array(s.count*3),l=new w,c=new w,h=new w;for(let u=0;u<s.count;u++){l.fromBufferAttribute(s,u),c.set(0,0,0);for(let d=0;d<4;d++){let f=a.getComponent(u,d);f&&c.addScaledVector(h.copy(l).applyMatrix4(n[r.getComponent(u,d)]),f)}o.set([c.x,c.y,c.z],u*3)}return pp.set(i,o),o}function Ab(i){return new w().setFromMatrixPosition(i.skeleton.bones.find(e=>e.name==="Head").matrixWorld)}function mp(i,e,t){let n=Cb(i),s=i.geometry.index,r=[],a=new w,o=l=>t(a.set(n[l*3]-e.x,n[l*3+1]-e.y,n[l*3+2]-e.z));for(let l=0;l<s.count;l+=3){let c=s.getX(l),h=s.getX(l+1),u=s.getX(l+2);o(c)&&o(h)&&o(u)&&r.push(c,h,u)}return r}function $E(i){if(Xa)return Xa;Xa=new Map;let e=i.get("Sword_Idle");if(!e)return Xa;for(let t of e.tracks){let[n,s]=t.name.split(".");s!=="quaternion"||!/^(index|middle|ring|pinky|thumb)_/.test(n)||Xa.set(n,new Ke().fromArray(t.values,0))}return Xa}async function $s(i){let[e,t]=await Promise.all([Lg(),Ng()]);if(!t.has("P_Bow_Shoot"))for(let Q of xb(e.rootBone.m,t))t.set(Q.name,Q);let n=i.body==="f"?"f":"m",s=e.rootBone[n],r=new Map;s.traverse(Q=>Q.isBone&&r.set(Q.name,Q));let a=Fg(s),o=new mt;o.name="modelo",o.add(a.root);let l=i.prop||{},c=JE(l);Ug(a,c),o.updateMatrixWorld(!0);let h=Sn(r,"ball_l"),u=a.byName.get("ball_l").getWorldPosition(new w),d=a.byName.get("pelvis");{let Q=d.getWorldPosition(new w);Q.y-=u.y-h.y,d.position.copy(d.parent.worldToLocal(Q)),o.updateMatrixWorld(!0)}let f=d.getWorldPosition(new w).y,p=Sn(r,"Head"),_=ep(i),g=i.colors||{},m=Vg(n,{skin:g.skin,cloth1:g.cloth1,cloth2:g.cloth2,metal:i.metalColor,leather:g.leather,hair:g.hair,eyes:g.eyes},{pattern:i.skinFx?.pattern||0,patternColor:i.skinFx?.patternColor,mail:i.mail||0,glowEyes:i.glowEyes||0}),x=m,M=m,b=rb(i.head||{}),v=[],S=i.outfit||{},R=(Q,fe={})=>{let ae=e.parts.get(Q);if(!ae){ae=[];for(let J=1;e.parts.has(`${Q}_${J}`);J++)ae.push(...e.parts.get(`${Q}_${J}`));if(!ae.length)return}let ge=/^pelo_|_ojos$|_cejas$/.test(Q),et=S.tatters&&/_(ca|ex)_(torso|piernas|brazos)$/.test(Q),X=i.gear?.robe&&/_(ca|ex)_torso$/.test(Q);for(let J of ae){let ce=et?sw(J,S.tatters):X?Kf(J,["torso","brazos","manos","cabeza"]):void 0;v.push({mesh:J,material:ge?x:m,deform:b,index:ce,...fe})}},y=[];if(i.noHead||y.push("cabeza"),(S.torso==="piel"||S.under)&&y.push("torso"),(S.brazos==="piel"||S.under)&&y.push("brazos","manos"),(S.piernas==="piel"||S.under)&&y.push("piernas","cadera"),S.pies==="piel"&&y.push("pies","pantorrillas"),y.length){let Q=e.parts.get(`${n}_cuerpo`)[0];v.push({mesh:Q,index:Kf(Q,y),material:m,deform:b})}let A=(Q,fe)=>{let ae=S[Q];ae&&ae!=="piel"&&fe[ae]&&R(`${n}_${ae}_${fe[ae]}`)};A("torso",{ex:"torso",ca:"torso"}),A("brazos",{ex:"brazos",ca:"brazos"}),A("piernas",{ex:"piernas",ca:"piernas"}),A("pies",{ex:"botas",ca:"pies"}),S.capucha&&R(`${n}_ex_capucha`),S.hombrera&&R(`${n}_ex_hombrera`),S.brazales&&R(`${n}_ex_brazales`),S.cintos&&(R(`${n}_ex_cinto1`),R(`${n}_ex_cinto2`)),i.noHead||(R(`${n}_ojos`,{hair:!0}),i.brows!==!1&&R(`${n}_cejas`,{hair:!0}));let C=S.capucha||i.gear?.helmet==="yelmo"?null:YE[i.hair||"raya"];if(C&&!i.noHead){let Q=e.parts.get(`pelo_${C==="rapado"&&n==="f"?"rapado_f":C}`)?.[0];Q&&(i.hair==="cresta"?v.push({mesh:Q,index:mp(Q,Ab(Q),fe=>Math.abs(fe.x)<.028),material:x,deform:b,hair:!0}):v.push({mesh:Q,material:x,deform:b,hair:!0}))}if(!i.noHead&&i.gear?.helmet!=="yelmo"){let Q={coleta:()=>ub(1),trenza:()=>db(i.hairLong??1),cresta:()=>S.capucha?null:fb()}[i.hair],fe=Q&&Q();fe&&(fe.translate(p.x,p.y,p.z),v.push({geometry:fe,material:x,weights:i.hair==="cresta"?null:pb(p.y),bone:"Head",deform:b,hair:!0}))}let D=i.beard&&i.beard!=="ninguna"&&!i.noHead?i.beard:null;if(D){let Q=e.parts.get("pelo_barba")[0],fe=Ab(Q),ae;D==="perilla"?ae=mp(Q,fe,X=>Math.abs(X.x)<.032&&(X.y<.012||X.y>.022)):D==="bigote"&&(ae=mp(Q,fe,X=>X.y>.004&&X.y<.04&&X.z>.07));let ge=D==="larga"||D==="trenzada",et=(X,J,ce,he,de)=>{if(b&&b(X,J,ce,he,de),ge){let Te=X.clone().sub(he),Pe=Math.max(0,.02-Te.y);X.y-=Pe*2.2,X.z+=Pe*.35,X.x-=Te.x*Math.min(.5,Pe*6)}};v.push({mesh:Q,index:ae,material:x,deform:et,hair:!0})}let F=v.slice(),O=await Rb(i,r,_,M,p);for(let Q of O)v.push(Q);let L=Yf(a,v,c,o,r);for(let Q of L.meshes)o.add(Q);let k=new mt;k.name=i.id?`pj_${i.id}`:"humanoide";let G=(l.scale??1)*(l.height??1);o.scale.setScalar(G),k.add(o);let V=new Vs(a.root),te={...Ba,...Gf[i.family]||{},...zf[i.style]||{}},N=new ts({id:i.id,kind:i.kind||"hero",def:{id:i.id,scale:G,anim:"idle",walk:"walk"},root:k,model:o,mixer:V,clips:t,anims:te,head:a.byName.get("Head"),height:1.8*G,radius:.35*G*(l.width??1),speeds:i.speeds||{},gait:{walk:(i.gait?.walk??1.35)*G,run:(i.gait?.run??3.1)*G,sprint:5*G,crouch_walk:1*G}});N.userData.look=i,N.userData.rig=a;let Z={Wnew:L.Wnew,skeleton:L.skeleton},ie=L.meshes;N.userData.setWeapon=async Q=>{let fe=N.userData.sheet;if(!fe||i.kind!=="hero")return;let{heroLook:ae}=await Promise.resolve().then(()=>(xl(),Tb)),ge=ae(fe,{prefer:Q==="ranged"?"ranged":"melee"});Q==="none"&&(ge.gear.main=null,ge.gear.off=null);let et=await Rb(ge,r,ep(ge),M,p),X=Yf(a,[...F,...et],c,o,r,Z);for(let J of ie)o.remove(J),J.geometry.dispose();ie=X.meshes;for(let J of ie)o.add(J);i.gear=ge.gear,i.style=ge.style,Object.assign(N.anims,{...Ba,...Gf[i.family]||{},...zf[ge.style]||{}}),we(ge.grips||[])},N.userData.materials={atlas:m};let be=f/jf,me=QE(a,t,be,d,ie,k),Je=new w(NaN,0,0);N.post.push(()=>{d.position.equals(Je)||(d.position.multiplyScalar(be),me&&(d.position.z+=me.dz*Math.min(1,Math.max(0,(me.restZ-d.position.z)/(me.restZ-me.lowZ)))),Je.copy(d.position))});let We=[],we=Q=>{let fe=$E(t);We=[];for(let[ae,ge]of fe)Q.some(et=>ae.endsWith(`_${et}`))&&We.push([a.byName.get(ae),ge])};we(i.grips||[]),N.post.push(()=>{for(let[Q,fe]of We)Q&&Q.quaternion.copy(fe)});for(let Q of i.missingFingers||[]){let[fe,ae]=Q.split("_"),ge=a.byName.get(`${fe}_01_${ae}`);ge&&ge.scale.setScalar(.02)}let q=i.posture?.hunch||0;if(q){let fe=[[a.byName.get("spine_01"),new Ke().setFromAxisAngle(En(1,0,0),q*.25)],[a.byName.get("spine_02"),new Ke().setFromAxisAngle(En(1,0,0),q*.3)],[a.byName.get("spine_03"),new Ke().setFromAxisAngle(En(1,0,0),q*.2)],[a.byName.get("neck_01"),new Ke().setFromAxisAngle(En(1,0,0),-q*.45)],[a.byName.get("Head"),new Ke().setFromAxisAngle(En(1,0,0),-q*.25)]].filter(([ae])=>ae).map(([ae,ge])=>({b:ae,q:ge,base:ae.quaternion.clone(),last:new Ke(NaN,0,0,1)}));N.post.push(()=>{for(let ae of fe)ae.b.quaternion.equals(ae.last)||ae.base.copy(ae.b.quaternion),ae.b.quaternion.copy(ae.base).multiply(ae.q),ae.last.copy(ae.b.quaternion)})}let j=iw(N,a,r,()=>i);return j&&N.post.push(j),N.play("idle",0),N.current&&(N.current.time=Math.random()*N.current.getClip().duration),N}function QE(i,e,t,n,s,r){let a=e.get("Death01"),o=e.get("Idle_Loop")?.tracks.find(S=>S.name==="pelvis.position"),l=s.find(S=>S.isSkinnedMesh);if(!a||!o||!l)return null;let c=[];i.root.traverse(S=>c.push([S,S.position.clone(),S.quaternion.clone()]));let h=new Vs(i.root),u=h.clipAction(a);u.play(),h.setTime(a.duration-.001),n.position.multiplyScalar(t);let d=n.position.z;r.updateMatrixWorld(!0),l.skeleton.update();let f=l.geometry.attributes.gpar,p=l.geometry.attributes.position.count,_=!1;for(let S=0;S<p&&!_;S+=7)_=f.getZ(S)<.5;let g=new w,m=1/0;for(let S=0;S<p;S+=3)_&&f.getZ(S)>=.5||(l.getVertexPosition(S,g).applyMatrix4(l.matrixWorld),g.y<m&&(m=g.y));let x=n.getWorldPosition(new w).y;n.position.z+=.1,r.updateMatrixWorld(!0);let M=(n.getWorldPosition(new w).y-x)/.1;u.stop(),h.uncacheRoot(i.root);for(let[S,R,y]of c)S.position.copy(R),S.quaternion.copy(y);r.updateMatrixWorld(!0);let b=o.values[2]*t,v=(-.02-m)/(M||1);return!Number.isFinite(v)||Math.abs(v)<.005||b-d<.2?null:{restZ:b,lowZ:d,dz:v}}function iw(i,e,t,n){let s=["r","l"].map(d=>{let f=e.byName.get(`hand_${d}`);if(!f)return null;let p=new Ke().setFromRotationMatrix(new De().extractRotation(uu(t,d))),_=new w(0,1,0).applyQuaternion(p);e.root.updateMatrixWorld(!0);let g=f.getWorldQuaternion(new Ke),m=_.applyQuaternion(g.invert()).normalize();return{side:d,hand:f,dLocal:m,base:f.quaternion.clone(),last:new Ke(NaN,0,0,1),w:0}}).filter(Boolean);if(!s.length)return null;let r=new Ke,a=new Ke,o=new w,l=new w,c=new Ke,h=new Ke,u=new Ke;return d=>{let f=n(),p=f.gear||{},_=ew.has(i.currentName)&&f.style!=="crossbow";for(let g of s){let m=g.side==="r"?p.main:p.off,x=_&&m&&!nw.test(m)?1:0;if(g.w+=(x-g.w)*Math.min(1,(d||.016)*7),g.hand.quaternion.equals(g.last)||g.base.copy(g.hand.quaternion),g.w<.002){g.hand.quaternion.copy(g.base),g.last.copy(g.base);continue}let M=tw.test(m||""),b=g.side==="r"?-1:1;M?l.set(.1*b,.93,.35):l.set(.08*b,-.55,.83),i.root.getWorldQuaternion(a),l.normalize().applyQuaternion(a),g.hand.parent.getWorldQuaternion(r),o.copy(g.dLocal).applyQuaternion(g.base).applyQuaternion(r),h.setFromUnitVectors(o,l),c.slerpQuaternions(u,h,g.w);let v=r.clone().invert().multiply(c).multiply(r).multiply(g.base);g.hand.quaternion.copy(v),g.last.copy(v)}}}async function Rb(i,e,t,n,s){let r=[],a=(c,h,u={})=>c&&r.push({geometry:c,material:n,bone:h,...u}),o=c=>c&&c.translate(s.x,s.y,s.z),l=i.extras||{};if(l.horns&&a(o(ab(l.horns.kind,l.horns.color,l.horns.scale||1)),"Head"),l.tusks&&a(o(ob(l.tusks)),"Head"),l.frill&&a(o(lb(l.frill.kind,l.frill.color)),"Head"),l.tail){let c=Sn(e,"pelvis");r.push({geometry:cb(c,l.tail.color,l.tail),material:n,weights:hb(c.y)})}if(i.undead||i.gear?.kk){let c=await mb();if(i.undead)for(let h of gb(e,{...i.undead,pieces:c}))r.push({geometry:h.geometry,material:n,bone:h.bone});for(let h of i.gear?.kk||[]){let u;if(h.bone==="Head"){let d=(c.headScale||.2)*(i.undead?.headScale??1);u=Va(c,h.name,{matrix:P.mul(P.T(s.x,s.y-.055,s.z+.005),P.S(d)),metal:h.name==="kk_casco"?.6:0}),u&&a(u,"Head")}else if(h.hand){if(u=Va(c,h.name,{metal:.5}),!u)continue;u.computeBoundingBox();let d=u.boundingBox,f=h.name.includes("escudo"),p=f?d.max.x-d.min.x:d.max.y-d.min.y,_=f?.48:h.name==="kk_baston"?1.6:.75;if(u.scale(_/p,_/p,_/p),f){let m=Sn(e,"lowerarm_l").lerp(Sn(e,"hand_l"),.45);u.applyMatrix4(P.mul(P.T(m.x,m.y+.07,m.z),P.R(-90,0,0),P.R(0,0,90))),a(u,"lowerarm_l")}else u.applyMatrix4(uu(e,h.hand)),a(u,`hand_${h.hand}`)}}}if(i.gear?.rags){let c=Sn(e,"pelvis");r.push({geometry:bb(e,i.gear.rags,{y0:c.y+.06,y1:c.y-.32}),material:n,weights:Pb(c.y+.06)})}return rw(i,e,t,a,r,n,s),r}function uu(i,e){let t=Sn(i,`hand_${e}`),n=e==="r"?-1:1;return P.mul(P.T(t.x+n*.088,t.y-.028,t.z-.004),P.R(90,0,0),P.R(0,n*90,0))}function sw(i,e){let t=Cb(i),n=i.geometry.index,s=[],r=(a,o,l)=>(Math.sin(a*37.1+o*11.7)*Math.cos(l*29.3-o*23.9)+Math.sin(o*61.3+a*7.1)*.5)*.5+.5;for(let a=0;a<n.count;a+=3){let o=n.getX(a),l=n.getX(a+1),c=n.getX(a+2),h=(t[o*3]+t[l*3]+t[c*3])/3,u=(t[o*3+1]+t[l*3+1]+t[c*3+1])/3,d=(t[o*3+2]+t[l*3+2]+t[c*3+2])/3;r(h,u,d)+(u<.6?.25:0)*(.6-u)*3<1-e&&s.push(o,l,c)}return s}function rw(i,e,t,n,s,r,a){let o=i.gear||{},l=i.body==="f",c=b=>Sn(e,`hand_${b}`),h=(b,v=new De)=>uu(e,b).multiply(v),u=(b,v,S)=>{let R=iu(b,t);R&&(R.applyMatrix4(h(v,S)),n(R,`hand_${v}`))};if(o.main&&u(o.main,"r"),o.off&&u(o.off,"l"),o.shield){let b=tp(o.shield,t),v=Sn(e,"lowerarm_l"),S=c("l"),R=v.clone().lerp(S,.45);b.applyMatrix4(P.mul(P.T(R.x,R.y+.07,R.z),P.R(-90,0,0),P.R(0,0,90))),n(b,"lowerarm_l")}let d=Sn(e,"spine_03"),f=d.z-(l?.15:.17);for(let b of o.back||[]){let v=null;b==="carcaj"?(v=Xg(t),v.applyMatrix4(P.mul(P.T(.08,d.y-.3,f-.04),P.R(0,0,-25)))):b==="laud"?(v=jg(t),v.applyMatrix4(P.mul(P.T(-.04,d.y-.15,f-.07),P.R(0,180,35)))):b==="mochila"?(v=Kg(t),v.applyMatrix4(P.T(0,d.y-.12,f-.1))):b.startsWith("escudo:")?(v=tp(b.slice(7),t),v.applyMatrix4(P.mul(P.T(0,d.y-.05,f-.03),P.R(0,180,0)))):b.startsWith("arma:")&&(v=iu(b.slice(5),t),v&&v.applyMatrix4(P.mul(P.T(.02,d.y-.05,f-.06),P.R(0,0,155)))),v&&n(v,"spine_03")}let p=Sn(e,"pelvis"),_=p.y+(l?.1:.08);if(o.book){let b=Jg(t);b.applyMatrix4(P.mul(P.T(l?.19:.18,_-.1,0),P.R(0,90,8))),n(b,"pelvis")}if(o.pouch){let b=Zg(t);b.applyMatrix4(P.T(l?-.17:-.16,_-.08,.05)),n(b,"pelvis")}if(o.sheath){let b=iu(o.sheath,t);b&&(b.applyMatrix4(P.mul(P.T(l?.2:.19,_-.05,-.04),P.R(0,0,180),P.R(-18,0,0))),n(b,"pelvis"))}let g=Sn(e,"upperarm_l"),m=Sn(e,"upperarm_r");if(o.pauldrons){let b=o.pauldrons==="grandes"?1.25:1;for(let[v,S]of[[1,g],[-1,m]]){let R=$g(v,S.clone().add(En(-v*.02,.02,.01)),t,{size:b});s.push({geometry:R,material:r,weights:()=>[[v>0?"upperarm_l":"upperarm_r",.55],[v>0?"clavicle_l":"clavicle_r",.45]]})}}if(o.breastplate){let b=l?{y:d.y-.02,w:.19,h:.25,front:.175,back:.155,cz:-0}:{y:d.y+.02,w:.215,h:.26,front:.155,back:.175,cz:-.01},v=Qg(b,t,{plate:o.breastplate!=="coraza"});s.push({geometry:v,material:r,weights:S=>S.y>d.y-.05?[["spine_03",1]]:S.y>d.y-.2?[["spine_02",1]]:[["spine_01",.6],["pelvis",.4]]})}if(o.bracers)for(let b of["l","r"]){let v=Sn(e,`lowerarm_${b}`),S=c(b);n(np(v.clone().lerp(S,.25),v.clone().lerp(S,.92),.043,.037,t,{color:o.bracers==="cuero"?t.leather:null,metal:o.bracers==="cuero"?0:1}),`lowerarm_${b}`)}if(o.greaves)for(let b of["l","r"]){let v=Sn(e,`calf_${b}`),S=Sn(e,`foot_${b}`);n(np(v.clone().lerp(S,.05).add(En(0,0,.02)),v.clone().lerp(S,.72).add(En(0,0,.03)),.068,.058,t),`calf_${b}`)}let x={x:a.x,y:a.y+.1,z:a.z+.005,r:l?.098:.104},M=o.helmet||o.hat;if(M&&n(eb(M,x,t),"Head"),o.robe){let b=p.y+.13,v=tb({yTop:b,yBottom:o.robe==="corta"?.48:.07,rTop:l?.215:.205,rBottom:o.robe==="corta"?.32:.36,cz:p.z-.005,depth:.88,color:o.robeColor||t.cloth1,open:o.robeOpen||0});s.push({geometry:v,material:r,weights:Pb(b)})}if(o.tabard){let b=o.tabardColor||t.cloth1,v=o.breastplate?.075:.022,S=d.y+(l?.1:.12);for(let R of ip({g:l?"f":"m",top:S,hip:p.y+.02,bottom:o.tabard==="corta"?p.y-.22:.48,w0:l?.24:.27,w1:.3,out:v,color:b}))s.push({geometry:R.geometry,material:r,weights:R.weights});if(o.emblem){let R=(l?.16:.13)+v+.004,y=re(new hi(.055,14),{color:t.gold,metal:.8,matrix:P.T(0,d.y-(l?.08:.06),R)}),A=[];for(let C=0;C<8;C++)A.push(re(new Nt(.014,.05,3),{color:t.gold,metal:.8,matrix:P.mul(P.T(0,d.y-(l?.08:.06),R),P.R(0,0,C*45),P.T(0,.075,0),P.S(1,1,.2))}));s.push({geometry:st([y,...A]),material:r,bone:"spine_03"})}}if(o.cape){let b=d.z-(l?.18:.2),v=nb({y0:d.y+.13,y1:o.cape==="corta"?p.y-.1:.2,w0:.36,w1:o.cape==="corta"?.46:.62,z:b,bulge:.05,color:o.capeColor||t.cloth1,back:!0});s.push({geometry:v,material:r,weights:aw(d.y,p.y)});let S=re(new _t(.2,.012,4,14,Math.PI),{color:o.capeColor||t.cloth1,matrix:P.mul(P.T(0,d.y+.13,d.z-.03),P.R(90,0,0),P.S(1.05,.9,1))});s.push({geometry:S,material:r,bone:"spine_03"})}if(o.mantle){let b=o.mantle==="hojas",v=ib({y:d.y+.12,rx:l?.17:.19,rz:l?.13:.14,cz:d.z-.02,color:b?"#4f6a32":o.mantleColor||"#6a5440",thick:.07,leaves:b});s.push({geometry:v,material:r,weights:S=>[["spine_03",.7],[S.x>0?"clavicle_l":"clavicle_r",.3]]})}if(o.apron)for(let b of ip({g:l?"f":"m",top:d.y-.02,hip:p.y+.02,bottom:p.y-.42,w0:.24,w1:.34,out:.018,color:o.apron,back:!1,split:!1}))s.push({geometry:b.geometry,material:r,weights:b.weights});if(o.chain){let b=re(new _t(l?.1:.115,.007,4,18,Math.PI),{color:t.gold,metal:1,matrix:P.mul(P.T(0,d.y+.08,d.z+(l?.06:.05)),P.R(180,0,0),P.R(-62,0,0))});n(st([b,re(new Mt(.025,.025,.008,10),{color:t.gold,metal:1,matrix:P.mul(P.T(0,d.y-.03,d.z+(l?.17:.155)),P.R(90,0,0))})]),"spine_03")}if(o.glasses&&n(Yg({x:a.x,y:a.y+.098,z:a.z+(l?.1:.112)},t),"Head"),o.necklace){let b=Sn(e,"neck_01"),v=[];for(let S=0;S<9;S++){let R=(-.75+S/8*1.5)*Math.PI*.5,y=Math.sin(R)*(l?.075:.085),A=b.z+Math.cos(R)*(l?.07:.08)+.01,C=b.y-.06-Math.cos(R)*.03;v.push(re(new Nt(.008,.04,5),{color:"#e8dcc0",matrix:P.mul(P.T(y,C,A),P.R(180,0,0),P.T(0,.015,0))}))}v.push(re(new _t(.085,.004,4,16),{color:"#3a2a1c",matrix:P.mul(P.T(0,b.y-.05,b.z+.01),P.R(75,0,0))})),n(st(v),"spine_03")}o.sash&&n(sb({y:_,rx:l?.15:.16,rz:l?.12:.13,cz:p.z+0,P:t,color:o.sash}),"pelvis")}function Pb(i){return e=>{let t=Math.min(1,Math.max(0,(i-e.y)/.55)),n=Math.max(-1,Math.min(1,e.x/.12)),s=(.5+n*.5)*t*.85,r=(.5-n*.5)*t*.85;return[["pelvis",1-s-r+.001],["thigh_l",s],["thigh_r",r]]}}function aw(i,e){return t=>{if(t.y>i-.05)return[["spine_03",1]];if(t.y>e+.1){let s=(i-.05-t.y)/(i-e-.15);return[["spine_03",1-s],["spine_01",s]]}let n=Math.min(1,(e+.1-t.y)/.7);return[["spine_01",.3*(1-n)],["pelvis",.7+.1*n],["thigh_l",n*.15],["thigh_r",n*.15]]}}var En,YE,ZE,pp,Xa,ew,tw,nw,du=Vt(()=>{St();kg();Lr();su();gl();ja();tu();_b();vb();En=(i,e,t)=>new w(i,e,t),YE={raya:"raya",largo:"largo",mono:"mono",coleta:"raya",trenza:"rapado_f",rapado:"rapado",cresta:"rapado",calvo:null};ZE=["pelvis","spine_01","spine_02","spine_03","neck_01","Head","clavicle_l","clavicle_r","upperarm_l","upperarm_r","lowerarm_l","lowerarm_r","hand_l","hand_r","thigh_l","thigh_r","calf_l","calf_r"],pp=new Map;Xa=null;ew=new Set(["idle","idle_alt","walk","run","sprint","walk_back","talk","sit","sit_talk"]),tw=/great|maul|quarterstaff|staff|spear|glaive|halberd|javelin|bow|crook|pike|lance|trident/,nw=/mug|holy_symbol|book|lute|torch/});function lw(i,e){let t=ws(i,ow);return{kind:"monster",family:"goblin",species:"goblin",body:"m",hair:e==="boss"?"cresta":ws(i,["calvo","calvo","cresta","rapado"]),beard:"ninguna",brows:!0,colors:{skin:t,hair:ws(i,["#1e1a16","#2a2418","#3a3024"]),eyes:"#e8c030",cloth1:"#5a4632",cloth2:"#7a6a4a"},metalColor:"#7a7468",glowEyes:.3,prop:{scale:.6+i()*.04,width:.9,head:1.32,legs:.84,arms:1.12,hands:1.28,neck:.85,thick:.82},head:{ears:{len:.12+i()*.03,dir:[1,.32,-.4],from:.05},nose:{len:.032+i()*.012,drop:.012,wide:.12},jaw:{wide:.12,fwd:.008,brow:.016},skullScale:[1.06,.9,1.02],face:Math.floor(i()*4)},posture:{hunch:.55},speeds:{walk:1.15,run:1.1}}}function fu(i,e=0){let t=Jn(1e3+e*17+i.length),n=lw(t,i);return i==="minion"?(n.outfit={torso:"piel",brazos:"piel",piernas:"ca",pies:"piel"},n.colors.cloth1=ws(t,["#5a4632","#4a3a2a","#62503a"]),n.colors.cloth2="#6a5a40",n.gear={main:"dagger",sash:"#3a2a1c"},n.grips=["r"],n.style="1h",n.prop.width=.86):i==="warrior"?(n.outfit={torso:"ex",brazos:"piel",piernas:"ca",pies:"piel",cintos:!0,hombrera:!0},n.colors.cloth1="#7a3a26",n.colors.cloth2="#5a4a36",n.gear={main:"scimitar",shield:"tosco",helmet:"casco"},n.grips=["r"],n.style="shield",n.prop.width=.96,n.prop.thick=.92):i==="archer"?(n.outfit={torso:"ex",brazos:"ex",piernas:"ca",pies:"piel",capucha:!0,cintos:!0},n.colors.cloth1="#4f5e36",n.colors.cloth2="#5a4a36",n.gear={off:"shortbow",back:["carcaj"],sheath:"dagger"},n.grips=["l"],n.style="bow"):i==="boss"&&(n.prop={...n.prop,scale:.74,width:1.06,thick:1,head:1.24},n.outfit={torso:"ex",brazos:"piel",piernas:"ex",pies:"ex",cintos:!0,hombrera:!0},n.colors.cloth1="#3a2a22",n.colors.cloth2="#6a2a20",n.colors.skin="#6c7660",n.skinFx={pattern:2,patternColor:"#8a2418"},n.gear={main:"scimitar",shield:"tosco",helmet:"casco",mantle:"pieles",mantleColor:"#26221e",necklace:"colmillos"},n.extras={horns:{kind:"carnero",color:"#cfc4a8",scale:.8}},n.missingFingers=["ring_l","pinky_l"],n.grips=["r"],n.style="shield",n.posture={hunch:.4}),n}function gp(i,e=0){let t=Jn(2e3+e*13+i.length),n=ws(t,["#d8ccae","#cfc2a0","#ddd2b8","#c8bc9c"]),s={kind:"monster",family:"skeleton",body:"m",noHead:!0,outfit:{},colors:{cloth1:"#4a3a30",cloth2:"#3a3028"},metalColor:"#6e6a62",prop:{scale:.98+t()*.05,width:.95},undead:{skull:"guerrero",color:n},posture:{hunch:.12},speeds:{walk:.95},gait:{walk:1}};return i==="archer"?{...s,gear:{off:"shortbow",back:["carcaj"],kk:[{name:"kk_capucha",bone:"Head"}],rags:"#3a2e2a"},grips:["l"],style:"bow"}:i==="wight"?{...s,id:"vorhan",prop:{scale:1.24,width:1.12,thick:1.1},undead:{skull:"guerrero",color:"#c4b898",eyes:"#70b0ff",headScale:1.08},metalColor:"#6a5a44",gear:{main:"greatsword",breastplate:"placas",pauldrons:"grandes",greaves:!0,bracers:!0,helmet:"corona",cape:"larga",capeColor:"#3a1a1a",rags:"#2a1a16"},extras:{horns:{kind:"toro",color:"#d8ccb0",scale:1.15}},glowEyes:1,grips:["r","l"],style:"2h",posture:{hunch:.05},speeds:{walk:.9}}:{...s,gear:{kk:[{name:"kk_hoja",hand:"r"},{name:"kk_escudo",hand:"l"},...t()<.5?[{name:"kk_casco",bone:"Head"}]:[]],rags:ws(t,["#3a2e2a","#4a3a2a","#2e2a26"])},grips:["r"],style:"shield"}}function cw(i=0){let e=Jn(3e3+i*11);return{kind:"monster",family:"zombie",body:e()<.3?"f":"m",hair:ws(e,["largo","raya","calvo"]),beard:"ninguna",colors:{skin:ws(e,["#8a927c","#7d8a74","#94927e"]),hair:"#3a3630",eyes:"#d0e090",cloth1:ws(e,["#4a4236","#3e3a30","#52463a"]),cloth2:"#6a6250"},skinFx:{pattern:5,patternColor:"#5a3a30"},glowEyes:.5,outfit:{torso:"ca",brazos:"piel",piernas:"ca",pies:"piel",under:!0,tatters:.38},prop:{scale:.98,width:.95,thick:.92},posture:{hunch:.42},gait:{walk:.7,run:.8},gear:{},grips:[],style:"unarmed",speeds:{walk:.85,run:.9}}}var ws,ow,Ka,Db,bp=Vt(()=>{Fr();ws=(i,e)=>e[Math.floor(i()*e.length)],ow=["#7c8a6c","#6e7e62","#86907a","#747c6c","#6a7a5c","#808878"];Ka={goblin_minion:{type:"humanoid",look:i=>fu("minion",i),name:"Trasgo esbirro"},goblin_warrior:{type:"humanoid",look:i=>fu("warrior",i),name:"Trasgo guerrero"},goblin_archer:{type:"humanoid",look:i=>fu("archer",i),name:"Trasgo arquero"},goblin_boss:{type:"humanoid",look:i=>fu("boss",i),name:"Cabecilla trasgo"},skeleton:{type:"humanoid",look:i=>gp("warrior",i),name:"Esqueleto"},skeleton_archer:{type:"humanoid",look:i=>gp("archer",i),name:"Esqueleto arquero"},zombie:{type:"humanoid",look:i=>cw(i),name:"Zombi"},wight:{type:"humanoid",look:i=>gp("wight",i),name:"Vorhan, el tumulario"},giant_spider:{type:"spider",name:"Ara\xF1a gigante"},wolf:{type:"animal",kind:"lobo",name:"Lobo"},mastiff:{type:"animal",kind:"mastin",name:"Mast\xEDn"},elk:{type:"animal",kind:"alce",name:"Alce"},riding_horse:{type:"animal",kind:"caballo",name:"Caballo de monta"}},Db=Object.keys(Ka)});function uw(i){let e=[],t=new bt(.32,14,10);t.scale(.95,.62,1.15),e.push(re(t,{color:i.body,vary:.12}));let n=[[.06,.12,.33,.05],[-.06,.12,.33,.05],[.13,.15,.28,.03],[-.13,.15,.28,.03],[.05,.19,.27,.025],[-.05,.19,.27,.025],[.16,.1,.24,.022],[-.16,.1,.24,.022]];for(let[r,a,o,l]of n)e.push(re(new bt(l,8,6),{color:i.eyes,metal:.4,glow:.8,matrix:P.T(r,a,o)}));for(let r of[-1,1])e.push(re(new bt(.075,8,6),{color:i.body,matrix:P.mul(P.T(r*.08,-.04,.36),P.S(.9,1.1,1.2))})),e.push(re(Es([Kt(r*.08,-.1,.42),Kt(r*.07,-.2,.44),Kt(r*.03,-.25,.39)],.022,.003,{radial:6,segs:6}),{color:i.fang,metal:.3}));for(let r of[-1,1])e.push(re(Es([Kt(r*.16,-.02,.3),Kt(r*.22,.04,.45),Kt(r*.2,-.08,.55)],.03,.018,{radial:6,segs:6}),{color:i.leg}));let s=Jn(77);for(let r=0;r<40;r++){let a=s()*Math.PI*2,o=s()*.9,l=Kt(Math.cos(a)*Math.sin(o)*.3,Math.cos(o)*.2,Math.sin(a)*Math.sin(o)*.36),c=new Ke().setFromUnitVectors(Kt(0,1,0),l.clone().normalize());e.push(re(new Nt(.008,.07,3),{color:i.hair,matrix:new De().compose(l,c,Kt(1,1,1))}))}return st(e)}function dw(i){let e=[],t=new bt(.5,18,14);t.scale(.92,.78,1.18),t.translate(0,.12,-.55);let n=re(t,{color:i.body,vary:.1}),s=n.attributes.position,r=n.attributes.color,a=new ye(i.body),o=new ye(i.mark);for(let c=0;c<s.count;c++){let h=s.getX(c),u=s.getY(c),d=s.getZ(c),f=Pt.smoothstep(u,.2,.45),p=Math.abs(Math.sin((d+.55)*9+Math.abs(h)*7)),_=f*(p>.82?1:0)*(Math.abs(h)<.3?1:0),g=Math.abs(h)<.04&&f>.5?.6:0,m=Math.max(_,g),x=a.clone().lerp(o,m);r.setXYZ(c,x.r,x.g,x.b)}e.push(n),e.push(re(new Nt(.06,.12,6),{color:i.leg,matrix:P.mul(P.T(0,.05,-1.13),P.R(-90,0,0))}));let l=Jn(91);for(let c=0;c<70;c++){let h=l()*Math.PI*2,u=l()*1.3,d=Kt(Math.cos(h)*Math.sin(u)*.46,Math.cos(u)*.39+.12,Math.sin(h)*Math.sin(u)*.59-.55),f=d.clone().sub(Kt(0,.12,-.55)).normalize(),p=new Ke().setFromUnitVectors(Kt(0,1,0),f);e.push(re(new Nt(.01,.09,3),{color:i.hair,matrix:new De().compose(d,p,Kt(1,1,1))}))}return st(e)}function _p(i,e,t,n,s){let r=[Kt(0,0,0),Kt(0,i*.5,0),Kt(0,i,0)],a=[re(Es(r,e,t,{radial:7,segs:4,closed:!0}),{color:n.leg,vary:.08})];a.push(re(new bt(e*1.15,7,5),{color:n.leg})),s&&a.push(re(new Mt(t*1.12,t*1.12,i*.18,7,1,!0),{color:n.mark,matrix:P.T(0,i*.86,0)}));for(let o=0;o<6;o++)a.push(re(new Nt(.006,.05,3),{color:n.hair,matrix:P.mul(P.T(0,i*(.2+o*.12),0),P.R(0,o*70,55),P.T(0,e*.9,0))}));return st(a)}function vl(i,e){let t=i.attributes.position.count,n=new Uint16Array(t*4),s=new Float32Array(t*4);for(let r=0;r<t;r++)n[r*4]=e,s[r*4]=1;return i.setAttribute("skinIndex",new $e(n,4)),i.setAttribute("skinWeight",new $e(s,4)),i}async function Lb({index:i=0,scale:e=1}={}){let t=Jn(500+i*7),n={body:["#2a221c","#30261e","#241e1a"][i%3],leg:["#3a2e24","#40342a","#342a22"][i%3],hair:"#5a4a3a",mark:["#a08a5a","#8a6a3a","#b09a70"][i%3],fang:"#1a1410",eyes:"#c02818"},s=[.55,.62,.42],r=[],a=(v,S)=>{let R=new Os;return R.name=v,S&&S.add(R),r.push(R),R},o=a("raiz"),l=a("cuerpo",o),c=a("abdomen",l),h=[];for(let v=0;v<pu;v++)h.push([a(`pata${v}_0`,o),a(`pata${v}_1`,o),a(`pata${v}_2`,o)]);let u=[vl(uw(n),1),vl(dw(n),2)];for(let v=0;v<pu;v++)u.push(vl(_p(s[0],.045,.035,n,!0),3+v*3)),u.push(vl(_p(s[1],.034,.024,n,!0),4+v*3)),u.push(vl(_p(s[2],.022,.01,n,!1),5+v*3));let d=st(u),f=Wg(),p=new ds(d,f),_=new mt;_.add(o),_.add(p),l.position.set(0,0,0),_.updateMatrixWorld(!0);let g=new fs(r,r.map(()=>new De));p.bind(g,new De),p.castShadow=!0,p.receiveShadow=!0,p.frustumCulled=!1;let m=new mt;m.name="arana_gigante";let x=(.9+t()*.12)*e;_.scale.setScalar(x),m.add(_);let M=fw({bodyB:l,abdB:c,legB:h,lens:s,rand:t}),b=new ts({id:"giant_spider",kind:"monster",root:m,model:_,procedural:M,anims:{},head:l,height:.9*x,radius:1*x});return b.userData.materials={gear:f},b.speed=2.2,b}function fw({bodyB:i,abdB:e,legB:t,lens:n,rand:s}){let r={name:"idle",t:0,once:null,gait:0,speed:0,dead:0,lift:0,rear:0,recoil:0,curl:0,hold:!1},a=[],o=[];for(let _=0;_<pu;_++){let g=_<4?1:-1,m=_%4,x=hw[m]*.42;a.push(Kt(g*.22,.02,x));let M=[.75,.25,-.2,-.65][m];o.push(Kt(g*(1.05-Math.abs(M)*.15),0,x+M*1))}let l=.62,c=Kt(0,0,0),h=Kt(0,1,0),u=(_,g,m)=>{_.position.copy(g),c.copy(m).sub(g).normalize(),_.quaternion.setFromUnitVectors(h,c)},d={attack_melee:.9,attack_bite:.9,hit:.45,die:1.4,dodge:.5,cheer:1.4,taunt:1.4,cast:.9,attack_ranged:.9,block:.45,interact:.8,revive:1.2,awaken:1.2},f=_=>({Sword_Attack:"attack_melee",Death01:"die",Hit_Chest:"hit",Hit_Head:"hit",Jog_Fwd_Loop:"run",Walk_Loop:"walk",Sprint_Loop:"run",Idle_Loop:"idle",Sword_Idle:"idle_combat"})[_]||_;return{play(_,{speed:g}={}){_=f(_),!(r.dead&&_!=="revive")&&(r.once=null,r.name=_,r.rate=g||1)},playOnce(_,{speed:g=1,hold:m=!1}={}){_=f(_),(_==="prone"||_==="down")&&(_="die");let x=(d[_]||.8)/g;return r.once={name:_,t:0,d:x,hold:m},_==="revive"&&(r.dead=0),new Promise(M=>r.once.res=M)},length(_){return d[f(_)]||.8},update(_,g,m=!1){m?r.t=_:r.t+=_;let x=r.name,b=x==="walk"||x==="run"||x==="sprint"||x==="crouch_walk"?x==="walk"?1:1.8:0;r.speed+=(b-r.speed)*Math.min(1,_*6),r.gait+=_*(1.4+r.speed*2.6)*(r.rate||1);let v=0,S=0,R=0,y=r.dead,A=0,C=r.once;if(C){C.t+=_;let L=Math.min(1,C.t/C.d),k=Math.sin(L*Math.PI);C.name==="attack_melee"||C.name==="attack_bite"||C.name==="cast"||C.name==="attack_ranged"?(v=L<.55?Pt.smoothstep(L,0,.5):1-Pt.smoothstep(L,.55,1),R=L>.5&&L<.8?Math.sin((L-.5)/.3*Math.PI):0):C.name==="hit"||C.name==="block"?S=k:C.name==="dodge"?A=k:C.name==="cheer"||C.name==="taunt"?v=k*1.2:C.name==="die"?y=L:(C.name==="revive"||C.name==="awaken")&&(y=1-L),L>=1&&(C.name==="die"&&(r.dead=1),r.once=null,C.res?.())}let D=Math.sin(r.t*2.2)*.012,F=Math.abs(Math.sin(r.gait*Math.PI))*.03*Math.min(1,r.speed),O=l*(1-y*.75)+D+F+A*.25+v*.15;i.position.set(0,O,-S*.12-A*.3),i.rotation.set(-v*.55+S*.12-R*.25,Math.sin(r.t*.7)*.03,Math.sin(r.gait*Math.PI)*.03*r.speed),e.rotation.set(Math.sin(r.t*2.2)*.04+v*.45,0,0),e.position.set(0,0,0),i.updateMatrixWorld(!0);for(let L=0;L<pu;L++){let k=L<4?1:-1,G=L%4,V=(G+(k>0?0:1))%2,te=(r.gait+V*.5)%1,N=i.localToWorld(a[L].clone());N.applyMatrix4(new De().copy(i.parent.matrixWorld).invert());let Z=o[L].clone(),ie=.32*Math.min(1.4,r.speed);r.speed>.02?te<.5?(Z.z+=-ie/2+te/.5*ie,Z.y+=Math.sin(te/.5*Math.PI)*.18*Math.min(1,r.speed)):Z.z+=ie/2-(te-.5)/.5*ie:Z.y+=Math.max(0,Math.sin(r.t*1.3+L*1.7))*.015,G===0&&(v||R)?Z.set(k*.55,O+.55*v-R*.5,.75+R*.35):G===1&&v&&(Z.y+=v*.25),y&&Z.lerp(Kt(k*.25,O*.4,a[L].z*.8),y);let be=n[0],me=n[1],Je=n[2],we=Z.clone().add(Kt(k*.06,Je*.92,0)).clone().sub(N),q=Math.min(we.length(),be+me-.001),j=we.clone().normalize(),Q=(be*be+q*q-me*me)/(2*be*q),fe=Math.acos(Pt.clamp(Q,-1,1)),ae=Kt(k*.5,1,0).normalize(),ge=ae.clone().addScaledVector(j,-ae.dot(j)).normalize(),et=j.clone().multiplyScalar(Math.cos(fe)).addScaledVector(ge,Math.sin(fe)),X=N.clone().addScaledVector(et,be),J=N.clone().addScaledVector(j,q),[ce,he,de]=t[L];u(ce,N,X),u(he,X,J),u(de,J,Z.clone().add(Kt(k*.02,0,.01)))}}}}var Kt,pu,hw,Nb=Vt(()=>{St();Lr();gl();su();ja();Fr();Kt=(i,e,t)=>new w(i,e,t),pu=8,hw=[.62,.22,-.18,-.55]});function yl(i){return mu[i]?i:pw[i]||null}function mw(i,e){let t={};i.traverse(l=>{l.isBone&&(t[l.name.replace(/_\d+$/,"")]=l)});let n=new Map(e),s=(l,c,h)=>l.quaternion.clone().multiply(new Ke().setFromAxisAngle(c,h)),r=new w(1,0,0),a=(l,c,h,u=16)=>{let d=[],f=[];for(let p=0;p<=u;p++){let _=p/u*h;d.push(_),f.push(...c(_/h).toArray())}return new ni(`${l.name}.quaternion`,d,f)},o=[["FrontUpLeg_L",0],["BackUpLeg_R",0],["FrontUpLeg_R",.5],["BackUpLeg_L",.5]];if(t.FrontUpLeg_L){let c=[];for(let[d,f]of o){let p=t[d];p&&c.push(a(p,g=>s(p,r,Math.sin((g+f)*Math.PI*2)*.45),.9));let _=t[d.replace("Up","Low")];_&&c.push(a(_,g=>s(_,r,Math.max(0,Math.sin((g+f+.25)*Math.PI*2))*-.5),.9))}t.Head&&c.push(a(t.Head,d=>s(t.Head,r,Math.sin(d*Math.PI*4)*.06),.9)),n.set("Walk",new jn("Walk",.9,c));let h=[],u=3;t.Neck&&h.push(a(t.Neck,d=>s(t.Neck,r,(.8-Math.abs(Math.sin(d*Math.PI))*.1)*Math.min(1,Math.sin(d*Math.PI)*4)),u,24)),t.Head&&h.push(a(t.Head,d=>s(t.Head,r,Math.sin(d*Math.PI*10)*.08+.2*Math.min(1,Math.sin(d*Math.PI)*4)),u,24)),h.length&&n.set("Eating",new jn("Eating",u,h))}return n}async function vp(i,{index:e=0,tint:t=null}={}){let n=yl(i);if(!n)throw new Error(`animal desconocido: ${i}`);let s=mu[n],r=await Ys(`assets/animals/${s.file}.json`),a=Fa(r.scene),o=Jn(e*31+n.length),l={...s.tint||{},...t||{}},c=.9+o()*.2;if(a.traverse(M=>{if(!M.isMesh)return;M.castShadow=!0,M.receiveShadow=!0,M.frustumCulled=!1,M.material=M.material.clone();let b=l[M.material.name];b&&M.material.color.set(b),/Eye/.test(M.material.name)||M.material.color.multiplyScalar(c),M.material.roughness=.85,M.material.metalness=0,Bg(M.material)}),!xp.has(n)){let M=new yn().setFromObject(r.scene,!0);xp.set(n,M)}let h=xp.get(n),u=s.height/Math.max(.01,h.max.y-h.min.y)*(.95+o()*.1),d=new mt;d.add(a),a.scale.multiplyScalar(u),a.position.y=-h.min.y*u;let f=new mt;f.name=`animal_${n}`,f.add(d),f.updateMatrixWorld(!0),a.traverse(M=>{M.isSkinnedMesh&&(M.skeleton.update(),M.computeBoundingSphere(),M.boundingSphere.radius*=1.8,M.frustumCulled=!0)});let p=new Vs(a),_=new Map(r.animations.map(M=>[M.name,M]));s.farm&&!s.bird&&(_=mw(a,_));let g=s.farm?{...Ig,...s.bird?{walk:["Walk"],eat:["Yes","Idle"],attack_melee:["Bite_Front"],hit:["HitRecieve"],die:["Death"],cheer:["Dance"]}:{}}:Pg,m=a.getObjectByName("Head")||a.getObjectByName("Head_1")||null,x=new ts({id:n,kind:"animal",root:f,model:d,mixer:p,clips:_,anims:g,head:m,height:s.height,radius:s.height*.45,gait:{walk:s.height*.9,run:s.height*3.6,sprint:s.height*3.6}});return x.speed=s.height>1.2?1.1:.7,x.userData.kind=n,x.play("idle",0),x.current&&(x.current.time=o()*x.current.getClip().duration),x}function Ub(i,e,{radius:t=1.2,seed:n=1,speed:s}={}){let r=Jn(n),a={mode:"idle",t:1+r()*4,home:e.clone(),radius:t},o=["idle","eat","idle_alt","eat"];return i.root.position.copy(e),i.root.rotation.y=r()*Math.PI*2,i.play(o[Math.floor(r()*o.length)]),{update(l){if(a.t-=l,a.mode==="walk"){(!i.path.length||a.t<=0)&&(i.path=[],a.mode="idle",a.t=3+r()*6,i.play(o[Math.floor(r()*o.length)],.4));return}if(!(a.t>0))if(a.radius>.1&&r()<.5){let c=r()*Math.PI*2,h=.3+r()*a.radius;a.mode="walk",a.t=9,i.speed=s??i.speed,i.walkTo([a.home.clone().add(new w(Math.cos(c)*h,0,Math.sin(c)*h))],null,{anim:"walk"})}else a.t=3+r()*6,i.play(o[Math.floor(r()*o.length)],.4)},flee(l){let c=i.root.position.clone().sub(l);c.y=0,c.lengthSq()<1e-4&&c.set(1,0,0);let h=i.root.position.clone().addScaledVector(c.normalize(),6);a.home.copy(h),a.radius=.8,a.mode="walk",a.t=10;let u=i.speed;i.speed=u*2.5,i.walkTo([h],()=>{i.speed=u},{anim:"run"})}}}var mu,pw,Fb,xp,yp=Vt(()=>{St();Kh();ka();ja();tu();Fr();Lr();mu={oveja:{file:"oveja",height:.85,farm:!0},cerdo:{file:"cerdo",height:.62,farm:!0},gallina:{file:"gallina",height:.38,farm:!0,bird:!0},vaca:{file:"vaca",height:1.45},toro:{file:"toro",height:1.55},caballo:{file:"caballo",height:1.7},burro:{file:"burro",height:1.25},perro:{file:"perro",height:.55},ciervo:{file:"ciervo",height:1.35},alce:{file:"alce",height:2.15},lobo:{file:"lobo",height:.9},mastin:{file:"mastin",height:.85}},pw={sheep:"oveja",pig:"cerdo",chicken:"gallina",hen:"gallina",cow:"vaca",bull:"toro",horse:"caballo",riding_horse:"caballo",donkey:"burro",dog:"perro",deer:"ciervo",elk:"alce",stag:"alce",wolf:"lobo",mastiff:"mastin"},Fb=["oveja","cerdo","gallina","vaca","toro","caballo","burro","perro","ciervo","alce","lobo","mastin"];xp=new Map});function gu(i,e={}){let t=Ur[i];if(!t)return null;let n=Pi({...t,id:i},e);return gw(n,t.tweak)}function gw(i,e){if(!e)return i;if(e.outfit&&Object.assign(i.outfit,e.outfit),e.gear)for(let[t,n]of Object.entries(e.gear))n===null?delete i.gear[t]:i.gear[t]=n;return e.posture&&(i.posture={...i.posture||{},...e.posture}),i}function bw(i){let e=Jn(i),t=o=>o[Math.floor(e()*o.length)],n=e()<.5?"f":"m",s=t(["human","human","human","human","halfling","dwarf","half_elf"]),r={id:`aldeano_${i}`,species:s,class:"commoner",pronoun:n,appearance:{body:n,face:Math.floor(e()*4),hair:t(n==="f"?["largo","mono","trenza","coleta"]:["raya","rapado","calvo","raya"]),hairColor:t(["#2a2018","#4a3020","#6b4a2b","#8a5a2e","#9a948c","#c9b48a"]),beard:n==="m"?t(["ninguna","barba","bigote","perilla"]):"ninguna",cloth1:t(["#6a5a40","#5a4a3a","#4a5a6a","#6a3a2e","#5a6a4a","#7a6a50"]),cloth2:t(["#d8ccb0","#c9b48a","#b8a888"]),height:.96+e()*.08,build:t(["delgada","media","robusta"])}},a=Pi(r);return a.outfit={torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"},a.gear=e()<.3?{apron:"#c8bca0"}:{},n==="f"&&e()<.5&&(a.gear.robe="larga"),a.kind="npc",a}function kb(i){typeof i=="string"&&(i={id:i});let e=i.visual?{...i.visual,id:i.id,pronoun:i.pronoun}:i,t=e.id;if(t&&Ur[t])return gu(t);if(t==="aldeano"||e.villager)return bw(e.seed??1);let n=t&&Ml[t];if(n&&!n.villager){let a=Pi({...n,id:t,armor:"",weapons:[],shield:!1});return a.outfit={...n.outfit},a.gear={...n.gear},a.grips=a.gear.main?["r"]:[],a.style="unarmed",n.posture&&(a.posture=n.posture),a.kind="npc",e.skin&&(a.colors.skin=e.skin),e.hair&&(a.colors.hair=e.hair),e.cloth&&(a.colors.cloth1=e.cloth),a}let s={id:t,species:e.species||"human",class:e.class||"commoner",pronoun:e.pronoun,armor:"",weapons:[],shield:!1,appearance:{body:e.pronoun==="f"?"f":"m",skin:e.skin,hairColor:e.hair,cloth1:e.cloth,cloth2:e.cloth?qa(e.cloth,1.6):void 0}},r=Pi(s);return["wizard","cleric","druid","paladin","fighter"].includes(s.class)||(r.outfit={torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"}),r.kind="npc",r}var Ur,Ml,Mp=Vt(()=>{xl();Fr();Ur={brenna:{name:"Brenna Halvard",species:"human",class:"fighter",armor:"chain_mail",shield:!0,weapons:["longsword","javelin"],pronoun:"f",appearance:{body:"f",face:2,skin:"#e8c0a0",eyes:"#4a6a5a",hair:"mono",hairColor:"#5a2416",cloth1:"#6e2a24",cloth2:"#c9b48a",metal:"acero",height:1.03,build:"robusta"},tweak:{gear:{cape:"corta",capeColor:"#4a2420"}}},pip:{name:"Pip Tallowmere",species:"halfling",class:"rogue",armor:"leather",shield:!1,weapons:["shortsword","dagger","light_crossbow"],pronoun:"m",appearance:{body:"m",face:1,skin:"#e2b48a",eyes:"#5a3a1e",hair:"raya",hairColor:"#7a4a24",cloth1:"#4e5a3a",cloth2:"#c9b48a",metal:"bronce",build:"media"},tweak:{outfit:{capucha:!1},gear:{pouch:!0}}},ilyra:{name:"Ilyra Sorendel",species:"elf",lineage:"wood_elf",class:"cleric",armor:"chain_mail",shield:!0,weapons:["longsword"],pronoun:"f",appearance:{body:"f",face:3,skin:"#f0d4bc",eyes:"#4a7a4a",hair:"largo",hairColor:"#e2c88a",ears:"largas",cloth1:"#ece2c8",cloth2:"#c9a64a",metal:"laton",height:1.02,build:"delgada"},tweak:{gear:{tabardColor:"#ece2c8"}}},odvar:{name:"Maese Odvar",species:"dwarf",class:"wizard",armor:"",shield:!1,weapons:["quarterstaff","dagger"],pronoun:"m",appearance:{body:"m",face:1,skin:"#e0b08a",eyes:"#3a5a8a",hair:"calvo",hairColor:"#c8c0b4",beard:"trenzada",cloth1:"#3e4e6e",cloth2:"#c9a64a",metal:"laton",build:"robusta"},tweak:{gear:{hat:null,glasses:!0,mantle:null}}}},Ml={corwin:{name:"Corwin",species:"human",class:"commoner",pronoun:"m",appearance:{body:"m",face:2,skin:"#e0b090",hair:"raya",hairColor:"#4a3020",beard:"barba",cloth1:"#7a3b2e",cloth2:"#e8dcc0",build:"robusta",height:1.02},outfit:{torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"},gear:{apron:"#d8ccb0",main:"mug"}},dagna:{name:"Dagna Emberforge",species:"dwarf",class:"commoner",pronoun:"f",appearance:{body:"f",face:2,skin:"#c9946c",hair:"trenza",hairColor:"#9a4a24",cloth1:"#5b4332",cloth2:"#8a6a4a",build:"robusta"},outfit:{torso:"ca",brazos:"piel",piernas:"ex",pies:"ex",cintos:!0},gear:{apron:"#4a3020",main:"light_hammer",bracers:"cuero"}},ysolde:{name:"Ysolde",species:"human",class:"commoner",pronoun:"f",appearance:{body:"f",face:3,skin:"#e8c3a0",hair:"largo",hairColor:"#c9b48a",cloth1:"#4f6b3a",cloth2:"#d8ccb0",build:"delgada"},outfit:{torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"},gear:{robe:"larga",robeColor:"#4f6b3a",pouch:!0,mantle:"hojas"}},tobin:{name:"Tobin Hilltopple",species:"halfling",class:"commoner",pronoun:"m",appearance:{body:"m",face:1,skin:"#d9a882",hair:"raya",hairColor:"#6b4a2b",beard:"bigote",cloth1:"#7a5a2a",cloth2:"#c9b48a"},outfit:{torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"},gear:{hat:"chambergo",back:["mochila"],pouch:!0}},aldis:{name:"Hermana Aldis",species:"human",class:"commoner",pronoun:"f",appearance:{body:"f",face:0,skin:"#f0d0b0",hair:"mono",hairColor:"#d8d8d0",cloth1:"#d8c890",cloth2:"#f0e8d0",build:"media"},outfit:{torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"},gear:{robe:"larga",robeColor:"#e8dcc0",tabard:"larga",tabardColor:"#d8c890",emblem:!0,hat:"diadema",book:!0},posture:{hunch:.08}},maren:{name:"Maren Ashford",species:"human",class:"commoner",pronoun:"f",appearance:{body:"f",face:2,skin:"#d8b090",hair:"mono",hairColor:"#2e2a28",cloth1:"#5a3f6b",cloth2:"#c9b48a",build:"media"},outfit:{torso:"ca",brazos:"ca",piernas:"ex",pies:"ex",cintos:!0},gear:{cape:"larga",capeColor:"#3e2a4a",chain:!0}},holt:{name:"Holt Varga",species:"human",class:"commoner",pronoun:"m",appearance:{body:"m",face:1,skin:"#e8c4a4",hair:"raya",hairColor:"#8a8478",beard:"perilla",cloth1:"#26364a",cloth2:"#c9b48a",build:"delgada",height:1.01},outfit:{torso:"ca",brazos:"ca",piernas:"ex",pies:"ex",cintos:!0},gear:{robe:"corta",robeColor:"#26364a",cape:"larga",capeColor:"#1e2a3a",chain:!0,pouch:!0}},sedge:{name:"La vieja Sedge",species:"human",class:"commoner",pronoun:"f",appearance:{body:"f",face:1,skin:"#d4a888",hair:"trenza",hairColor:"#e4e0d8",cloth1:"#6a5a40",cloth2:"#9a8a6a",build:"delgada",height:.96},outfit:{torso:"ca",brazos:"ca",piernas:"ca",pies:"ca"},gear:{robe:"larga",robeColor:"#5a4a34",mantle:"pieles",mantleColor:"#9a8a70",main:"crook"},posture:{hunch:.32}},aldeano:{villager:!0}}});function Gb(i){_w=i}function xw(i){if(!Ii){let e=document.createElement("canvas");Ii=new Cr({canvas:e,antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),Ii.toneMapping=ji,Ii.toneMappingExposure=1.1,Ii.outputColorSpace=Tt}return Ii.setPixelRatio(1),Ii.setSize(i,i,!1),clearTimeout(Ob),Ob=setTimeout(()=>{Ii?.dispose(),Ii?.forceContextLoss?.(),Ii=null},15e3),Ii}function vw(){let i=new Us;i.add(new vs(15262426,3812902,1.1));let e=new vn(16769216,2.6);e.position.set(1.2,1.6,2.2),i.add(e);let t=new vn(10139903,2);t.position.set(-1.6,1.2,-1.8),i.add(t);let n=new vn(16763034,.5);return n.position.set(-2,.2,1.5),i.add(n),i}function yw(i){for(let e=0;e<4&&i&&typeof i=="object"&&!(i.root&&i.userData);e++){let t=i.ch||i.inner||i.character||i.actor||null;if(!t||t===i||typeof t!="object")break;i=t}return i}function Sp(i){try{return JSON.stringify(i)}catch{return String(i?.id??Math.random())}}function Mw(i){if(typeof i=="string")return`id:${i}`;if(i&&i.root&&i.userData)return i.userData.look?`look:${Sp(i.userData.look)}`:`ch:${i.kind}:${i.userData.monster||i.userData.kind||i.id}`;if(i&&typeof i=="object"){let{id:e,name:t,species:n,lineage:s,ancestry:r,size:a,pronoun:o,class:l,armor:c,weapons:h,shield:u,appearance:d,visual:f}=i;return`sheet:${Sp({id:e,name:t,species:n,lineage:s,ancestry:r,size:a,pronoun:o,cls:l,armor:c,weapons:h,shield:u,appearance:d,visual:f})}`}return`sheet:${Sp(i)}`}async function Sw(i,e){if(i&&i.root&&i.userData){let t=i.userData.look;if(t){let{buildHumanoid:n}=await Promise.resolve().then(()=>(du(),Ib));return n(t)}return i.kind==="animal"?e.makeAnimal(i.userData.kind||i.id):i.userData.monster?e.makeMonster(i.userData.monster):null}if(typeof i=="string"){let t={chief:"goblin_boss",krazzik:"goblin_boss",grisk:"goblin_boss",vorhan:"wight"}[i]||i;return Ur[t]?e.makeCompanion(t):Ml[t]?e.makeNpc({id:t}):Ka[t]?e.makeMonster(t):yl(t)?e.makeAnimal(t):e.makeNpc({id:t})}return e.makeHero(i||{})}function Ew(i,e){let t=i.headWorld(new w),n=i.height/1.8,s=t.clone().add(new w(0,.075*n,0)),r=1.06*Math.max(.55,n);e.position.set(s.x+r*.28,s.y+r*.06,s.z+r*.96),e.lookAt(s.x,s.y-.03*n,s.z)}function Hb(i,e,t=!1){let n=new yn().setFromObject(i.root,!0),s=n.getSize(new w);if(t){let o=new w((n.min.x+n.max.x)/2,n.max.y-s.y*.16,(n.min.z+n.max.z)/2),l=Math.max(.5,s.y*.55);e.position.set(o.x+l*.28,o.y+l*.06,o.z+l*.96+s.z*.5),e.lookAt(o);return}let r=i.headBone?i.headBone.getWorldPosition(new w):new w(0,n.max.y-s.y*.25,n.max.z-s.z*.25),a=Math.max(s.y,s.x)*.9+.4;e.position.set(r.x+a*.45,r.y+a*.18,r.z+a*.9),e.lookAt(r.x,r.y-s.y*.05,r.z)}function zb(i){try{let e=document.createElement("canvas");e.width=e.height=32;let t=e.getContext("2d",{willReadFrequently:!0});t.drawImage(i,0,0,32,32);let n=t.getImageData(0,0,32,32).data,s=0;for(let r=3;r<n.length;r+=4)n[r]>24&&s++;return s/1024}catch{return 1}}function ww(i){let e=i.userData?.look||{};return e.family==="skeleton"||e.family==="zombie"?["#3a4652","#0d1115","rgba(150,190,255,0.22)"]:i.kind==="monster"||e.family==="goblin"?["#45472f","#100f0b","rgba(255,170,90,0.20)"]:i.kind==="animal"?["#4a4634","#12100c","rgba(255,220,160,0.18)"]:["#5c4532","#140f0b","rgba(255,205,150,0.26)"]}function Tw(i,e,t,n){let s=document.createElement("canvas");s.width=s.height=e;let r=s.getContext("2d"),a=t===!1||t==="transparente"||t==="transparent",o=!a&&(t==null||t==="pintado");if(o){let[l,c,h]=ww(n),u=r.createRadialGradient(e*.44,e*.4,e*.04,e*.5,e*.5,e*.78);u.addColorStop(0,l),u.addColorStop(1,c),r.fillStyle=u,r.fillRect(0,0,e,e);let d=r.createRadialGradient(e*.52,e*.38,0,e*.52,e*.38,e*.42);d.addColorStop(0,h),d.addColorStop(1,"rgba(0,0,0,0)"),r.fillStyle=d,r.fillRect(0,0,e,e)}else a||(r.fillStyle=t,r.fillRect(0,0,e,e));if(r.drawImage(i,0,0,e,e),o){let l=r.createRadialGradient(e*.5,e*.42,e*.38,e*.5,e*.5,e*.8);l.addColorStop(0,"rgba(0,0,0,0)"),l.addColorStop(1,"rgba(0,0,0,0.45)"),r.fillStyle=l,r.fillRect(0,0,e,e)}return s.toDataURL("image/png")}async function Aw(i,{size:e=256,background:t}={},n){let s=await Sw(i,n);if(!s)return null;await za();let r=vw();r.add(s.root),s.root.position.set(0,0,0),s.root.rotation.set(0,Pt.degToRad(-14),0),s.root.visible=!0,s.setLod?.(0),s.play("idle",0),s.mixer&&s.mixer.setTime(.35);for(let d of s.post)d(0,s);s.procedural?.update(.35,s,!0),r.updateMatrixWorld(!0),s.root.traverse(d=>{d.isSkinnedMesh&&d.skeleton.update()});let a=new Yt(26,1,.05,50),o=s.kind==="animal"||s.procedural||!s.headBone||s.headBone.isBone===!1;o?Hb(s,a):Ew(s,a);let l=xw(e);l.setRenderTarget(null),l.setClearColor(0,0);let c=Ss.uRim.value;Ss.uRim.value=c*.4,l.render(r,a);let h=zb(l.domElement);if(h<.05){Hb(s,a,!o),l.render(r,a);let d=zb(l.domElement);console.warn("[personajes] retrato vac\xEDo con el primer encuadre",{id:s.id,cov:h,cov2:d,head:s.headWorld(new w).toArray()}),h=d}Ss.uRim.value=c;let u=null;return h>=.02&&(u=Tw(l.domElement,e,t,s)),r.remove(s.root),s.dispose(),u}function Vb(i,e={},t){i=yw(i);let n=`${Mw(i)}|${e.size||256}|${e.background??"pintado"}`;if(!Sl.has(n)){let s=Bb.then(()=>Aw(i,e,t)).then(r=>(r||Sl.delete(n),r)).catch(r=>(console.error("[personajes] retrato",r),Sl.delete(n),null));Bb=s,Sl.set(n,s)}return Sl.get(n)}var Ii,_w,Ob,Sl,Bb,Wb=Vt(()=>{St();Lr();Mp();bp();yp();Ii=null,_w=null,Ob=0,Sl=new Map,Bb=Promise.resolve()});function qb({lights:i=!0,pedestal:e=!0}={}){let t=new mt;t.name="vista_heroe";let n=new mt;if(t.add(n),e){let h=new Ht({color:4077104,roughness:.95}),u=new at(new Mt(.62,.7,.16,48),h);u.position.y=-.08,u.receiveShadow=!0,t.add(u);let d=new at(new _t(.62,.02,6,64),new Ht({color:14398054,metalness:.8,roughness:.35}));d.rotation.x=Math.PI/2,d.position.y=0,t.add(d)}if(i){t.add(new vs(14736596,4207658,1));let h=new vn(16769732,2.4);h.position.set(1.5,3,2.5),h.castShadow=!0,h.shadow.mapSize.set(1024,1024),Object.assign(h.shadow.camera,{left:-1.5,right:1.5,top:2.5,bottom:-.5,near:.5,far:8}),h.shadow.bias=-5e-4,t.add(h);let u=new vn(10139903,1.6);u.position.set(-2,2,-2.5),t.add(u)}let s=null,r="",a=0,o=null,l=0;return{group:t,get character(){return s},async set(h,u={}){let d=Pi(h||{},u),f=JSON.stringify(d);if(f===r&&s)return s;r=f;let p=++l;o=$s(d);let _=await o;return await za(),p!==l?(_.dispose(),s):(s&&s.dispose(),s=_,s.userData.sheet=h,n.add(s.root),s.play("idle",0),s)},drag(h){n.rotation.y+=h*.012,a=h*.6},play(h){s&&(s.isLoop(h)?s.play(h):s.playOnce(h))},update(h){if(s&&s.update(h),Math.abs(a)>.01)n.rotation.y+=a*h,a*=Math.max(0,1-h*3);else{let d=Pt.degToRad(-12)-n.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d)),n.rotation.y+=d*Math.min(1,h*.8)}},frame(h,u="cuerpo"){let d=s?s.height:1.8,f=Math.max(.6,d/1.8);u==="retrato"?(h.position.set(0,d*.92,1.25*f+.4),h.lookAt(0,d*.86,0)):(h.position.set(0,d*.62+.2,4*f+.6),h.lookAt(0,d*.48,0))},dispose(){l++,s&&s.dispose(),s=null,t.removeFromParent(),t.traverse(h=>{h.isMesh&&(h.geometry.dispose(),h.material.dispose?.())})}}}var Xb=Vt(()=>{St();xl();du();Lr()});var Zb={};Tu(Zb,{ANIMAL_DEFS:()=>mu,ANIMAL_KINDS:()=>Fb,COMPANIONS:()=>Ur,Character:()=>ts,DRAGON_COLORS:()=>Nr,METALS:()=>Wa,MONSTER_DEFS:()=>Ka,MONSTER_IDS:()=>Db,NPC_LOOKS:()=>Ml,appearanceOptions:()=>up,completeAppearance:()=>ou,createHeroPreview:()=>qb,defaultAppearance:()=>au,hasAnimal:()=>Pw,heroLook:()=>Pi,makeAnimal:()=>Jb,makeCompanion:()=>Kb,makeHero:()=>jb,makeMonster:()=>Ep,makeNpc:()=>Yb,portrait:()=>Iw,randomAppearance:()=>Mb,sampleSheet:()=>fp,setCharacterRim:()=>Og,setRenderer:()=>Rw,setTextureDetail:()=>zg,texturesReady:()=>Cw,wander:()=>Ub,weaponLoadout:()=>hu});function Rw(i){Gb(i)}function Cw(){return za()}async function jb(i={},e={}){let t=i.id,n=t&&Ur[t]&&!i.appearance?gu(t,e):Pi(i,e);t&&(n.id=t);let s=await $s(n);return s.kind="hero",s.id=t||s.id,s.userData.sheet=i,s.userData.prefer=e.prefer||null,e.lod&&s.setLod(e.lod),s}async function Kb(i,e={}){let t=gu(i,e);if(!t)throw new Error(`compa\xF1ero desconocido: ${i}`);t.id=i;let n=await $s(t);return n.kind="hero",n.id=i,n}async function Yb(i){let e=kb(i||{}),t=await $s(e);return t.kind="npc",t.id=e.id||t.id,t}async function Ep(i,{index:e=0}={}){let t=Ka[i],n;if(!t)return console.warn(`[personajes] monstruo desconocido \xAB${i}\xBB: uso un trasgo`),Ep("goblin_minion",{index:e});if(t.type==="spider")n=await Lb({index:e});else if(t.type==="animal")n=await vp(t.kind,{index:e});else{let s=t.look(e);s.id=s.id||i,n=await $s(s)}return n.kind="monster",n.id=i,n.userData.monster=i,n.setStance?.("combat"),n}async function Jb(i,e={}){return vp(i,e)}function Pw(i){return!!yl(i)}async function Iw(i,e={}){return Vb(i,e,{makeHero:jb,makeNpc:Yb,makeMonster:Ep,makeCompanion:Kb,makeAnimal:Jb})}var $b=Vt(()=>{du();xl();Lr();bp();Nb();yp();Mp();Wb();Xb();ja();Fr()});async function Qb(i){let e=await Promise.resolve().then(()=>($b(),Zb)),t,n=i.id||"";if(e.COMPANIONS[n])t=await e.makeCompanion(n);else if(i.skinLum||/goblin|trasgo/i.test(n)){let r=(i.attach||[]).some(a=>a.bone==="hand_l"&&a.make)?"goblin_archer":(i.scale??0)>=.7?"goblin_boss":i.outfit==="Male_Ranger"?"goblin_warrior":"goblin_minion";t=await e.makeMonster(r,{index:[...n].reduce((a,o)=>a+o.charCodeAt(0),0)})}else t=await e.makeNpc({id:n});return t.def={...i,scale:t.def.scale,anim:i.anim||"idle",walk:i.walk||"walk"},t.idle=t.def.anim,t.root.position.set(i.pos?.[0]??0,i.y??0,i.pos?.[1]??0),t.root.rotation.y=Pt.degToRad(i.face??0),t.play(t.idle,0),t.current&&(t.current.time=Math.random()*t.current.getClip().duration),t}var wp,ts,ja=Vt(()=>{St();tu();wp=new w,ts=class{constructor(e,t,n,s){t&&(e={def:e,root:t,mixer:n,clips:new Map([...s].map(([r,a])=>[r,a.getClip()])),anims:Ba,actions:s}),this.def=e.def||{},this.id=e.id||this.def.id||"",this.kind=e.kind||"hero",this.root=e.root,this.model=e.model||e.root,this.mixer=e.mixer||null,this.clips=e.clips||new Map,this.anims=e.anims||Ba,this.speeds=e.speeds||{},this.actions=e.actions||new Map,this.procedural=e.procedural||null,this.current=null,this.currentName="",this.path=[],this.speed=1.45,this.walkAnim="walk",this.stance="calm",this.idle=this.def.anim||"idle",this.headBone=e.head||this.root.getObjectByName("Head"),this.height=e.height||1.8,this.radius=e.radius||.35,this.post=[],this.gait=e.gait||{walk:1.35,run:3.1,sprint:5,crouch_walk:1},this.onDispose=[],this.userData={}}resolve(e,t=-1){let n=e;for(let r=0;n&&r<8;r++){let a=this.anims[n];if(a){let o=a.filter(l=>this.clips.has(l));if(o.length)return o[t>=0?t%o.length:Math.floor(Math.random()*o.length)]}else{if(this.clips.has(n))return n;if(eu[n]){n=eu[n];continue}}n=Cg[n]}return this.anims.idle?.find(r=>this.clips.has(r))||null}has(e){let t=this.anims[e];return t?t.some(n=>this.clips.has(n)):this.clips.has(e)}action(e){if(!this.actions.has(e)){let t=this.clips.get(e);if(!t||!this.mixer)return null;this.actions.set(e,this.mixer.clipAction(t))}return this.actions.get(e)}isLoop(e){if(Hf.has(e))return!0;let t=this.anims[e]?e:eu[e];return t?Hf.has(t):/Loop|Idle|Walk|Run|Gallop|Sprint|Eating/.test(e)}play(e,t=.3,{speed:n,variant:s=-1}={}){if(this.procedural)return this.procedural.play?.(e,{fade:t,speed:n,loop:!0});if(!this.isLoop(e)&&e!==this.idle){this.playOnce(e,{fade:Math.min(t,.15),speed:n,variant:s});return}let r=this.resolve(e,s),a=r&&this.action(r);if(a){if(a.timeScale=n??this.speeds[e]??1,a===this.current){this.currentName=e;return}a.reset(),a.setLoop(Ph,1/0),a.clampWhenFinished=!1,a.setEffectiveWeight(1).fadeIn(t).play(),this.current&&this.current.fadeOut(t),this.current=a,this.currentName=e}}playOnce(e,{fade:t=.12,speed:n,hold:s=!1,variant:r=-1}={}){if(this.procedural)return this.procedural.playOnce?.(e,{fade:t,speed:n,hold:s})||Promise.resolve();let a=this.resolve(e,r),o=a&&this.action(a);return o?(o.reset(),o.setLoop(Ch,1),o.clampWhenFinished=s,o.timeScale=n??this.speeds[e]??1,o.setEffectiveWeight(1).fadeIn(t).play(),this.current&&this.current!==o&&this.current.fadeOut(t),this.current=o,this.currentName=e,new Promise(l=>{let c=h=>{h.action===o&&(this.mixer.removeEventListener("finished",c),!s&&this.current===o&&this.play(this.restName(),.2),l())};this.mixer.addEventListener("finished",c)})):Promise.resolve()}restName(){return this.path.length?this.walkAnim:this.stance==="combat"&&this.idle==="idle"?"idle_combat":this.idle}setStance(e){this.stance=e,!this.path.length&&this.current&&this.isLoop(this.currentName)&&this.play(this.restName(),.35)}clipLength(e){if(this.procedural)return this.procedural.length?.(e)??.8;let t=this.clips.get(this.resolve(e,0));return t?t.duration/(this.speeds[e]??1):0}walkTo(e,t,{run:n=!1,anim:s}={}){this.path=e.slice(),this.onArrive=t,this.path.length&&(this.walkAnim=s||(n?"run":this.def.walk||"walk"),this.play(this.walkAnim,.2))}stopWalking(){this.path=[],this.play(this.restName(),.3)}setLod(e){this.lod=e}setShadows(e){let t=!0;this.root.traverse(n=>{n.isMesh&&(n.castShadow=e==="todas"||e==="cuerpo"&&t,t=!1)})}update(e){if(this._lodAcc=(this._lodAcc||0)+e,this._lodN=((this._lodN||0)+1)%(this.lod?1<<this.lod:1),this._lodN===0){let c=this._lodAcc;this._lodAcc=0,this.mixer&&this.mixer.update(c),this.procedural&&this.procedural.update(c,this);for(let h of this.post)h(c,this)}if(!this.path.length)return;let t=this.gait[this.walkAnim];t&&this.current&&!this.procedural&&(this.current.timeScale=Math.min(1.9,Math.max(.55,this.speed/t)));let n=this.path[0],s=this.root.position,r=n.x-s.x,a=n.z-s.z,o=Math.hypot(r,a),l=this.speed*e;if(o>1e-4){let h=Math.atan2(r,a)-this.root.rotation.y;h=Math.atan2(Math.sin(h),Math.cos(h)),this.root.rotation.y+=h*Math.min(1,e*10)}if(n.y!==void 0&&(s.y+=(n.y-s.y)*Math.min(1,e*8)),o<=l){if(s.x=n.x,s.z=n.z,this.path.shift(),!this.path.length){this.play(this.restName(),.35);let c=this.onArrive;this.onArrive=null,c&&c()}}else s.x+=r/o*l,s.z+=a/o*l}headWorld(e=new w){return this.headBone?(this.headBone.getWorldPosition(e),e):(this.root.getWorldPosition(e),e.y+=this.height*this.root.scale.y,e)}chestWorld(e=new w){return this.headWorld(e),this.root.getWorldPosition(wp),e.y=wp.y+(e.y-wp.y)*.78,e}handWorld(e="r",t=new w){let n=this.root.getObjectByName(`hand_${e}`);return n?n.getWorldPosition(t):this.chestWorld(t)}flash(e=16777215,t=.6,n=.25){let s=this.materials(),r=new ye(e).multiplyScalar(t);this._flash={c:r,t:n,total:n,mats:s},this._flashPost||(this._flashPost=a=>{let o=this._flash;if(!o)return;o.t-=a;let l=Math.max(0,o.t/o.total);for(let c of o.mats)c.userData.u?.uFlash&&c.userData.u.uFlash.value.copy(o.c).multiplyScalar(l);o.t<=0&&(this._flash=null)},this.post.push(this._flashPost))}setTint(e){for(let t of this.materials())t.userData.u?.uFlash&&t.userData.u.uFlash.value.set(e||0).multiplyScalar(e?.25:0)}materials(){let e=new Set;return this.root.traverse(t=>{if(t.isMesh)for(let n of[].concat(t.material))e.add(n)}),[...e]}setWeapon(e){this.userData.setWeapon?.(e)}dispose(){for(let e of this.onDispose)e();this.mixer?.stopAllAction(),this.root.traverse(e=>{e.isMesh&&e.userData.ownGeometry!==!1&&e.geometry?.dispose()}),this.root.removeFromParent()}}});St();St();var J0={type:"change"},Qd={type:"start"},$0={type:"end"},Hh=new ki,Z0=new Un,GS=Math.cos(70*Pt.DEG2RAD),pn=new w,Kn=2*Math.PI,Ft={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},$d=1e-6,zh=class extends Go{constructor(e,t=null){super(e,t),this.state=Ft.NONE,this.target=new w,this.cursor=new w,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:di.ROTATE,MIDDLE:di.DOLLY,RIGHT:di.PAN},this.touches={ONE:Ws.ROTATE,TWO:Ws.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new w,this._lastQuaternion=new Ke,this._lastTargetPosition=new w,this._quat=new Ke().setFromUnitVectors(e.up,new w(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Sa,this._sphericalDelta=new Sa,this._scale=1,this._panOffset=new w,this._rotateStart=new $,this._rotateEnd=new $,this._rotateDelta=new $,this._panStart=new $,this._panEnd=new $,this._panDelta=new $,this._dollyStart=new $,this._dollyEnd=new $,this._dollyDelta=new $,this._dollyDirection=new w,this._mouse=new $,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=WS.bind(this),this._onPointerDown=VS.bind(this),this._onPointerUp=qS.bind(this),this._onContextMenu=$S.bind(this),this._onMouseWheel=KS.bind(this),this._onKeyDown=YS.bind(this),this._onTouchStart=JS.bind(this),this._onTouchMove=ZS.bind(this),this._onMouseDown=XS.bind(this),this._onMouseMove=jS.bind(this),this._interceptControlDown=QS.bind(this),this._interceptControlUp=eE.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Ft.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(J0),this.update(),this.state=Ft.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;pn.copy(t).sub(this.target),pn.applyQuaternion(this._quat),this._spherical.setFromVector3(pn),this.autoRotate&&this.state===Ft.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Kn:n>Math.PI&&(n-=Kn),s<-Math.PI?s+=Kn:s>Math.PI&&(s-=Kn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(pn.setFromSpherical(this._spherical),pn.applyQuaternion(this._quatInverse),t.copy(this.target).add(pn),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=pn.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new w(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new w(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=pn.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Hh.origin.copy(this.object.position),Hh.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Hh.direction))<GS?this.object.lookAt(this.target):(Z0.setFromNormalAndCoplanarPoint(this.object.up,this.target),Hh.intersectPlane(Z0,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>$d||8*(1-this._lastQuaternion.dot(this.object.quaternion))>$d||this._lastTargetPosition.distanceToSquared(this.target)>$d?(this.dispatchEvent(J0),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Kn/60*this.autoRotateSpeed*e:Kn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){pn.setFromMatrixColumn(t,0),pn.multiplyScalar(-e),this._panOffset.add(pn)}_panUp(e,t){this.screenSpacePanning===!0?pn.setFromMatrixColumn(t,1):(pn.setFromMatrixColumn(t,0),pn.crossVectors(this.object.up,pn)),pn.multiplyScalar(e),this._panOffset.add(pn)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;pn.copy(s).sub(this.target);let r=pn.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Kn*this._rotateDelta.x/t.clientHeight),this._rotateUp(Kn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Kn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Kn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Kn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Kn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Kn*this._rotateDelta.x/t.clientHeight),this._rotateUp(Kn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new $,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function VS(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function WS(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function qS(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent($0),this.state=Ft.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function XS(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case di.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Ft.DOLLY;break;case di.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Ft.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Ft.ROTATE}break;case di.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Ft.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Ft.PAN}break;default:this.state=Ft.NONE}this.state!==Ft.NONE&&this.dispatchEvent(Qd)}function jS(i){switch(this.state){case Ft.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Ft.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Ft.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function KS(i){this.enabled===!1||this.enableZoom===!1||this.state!==Ft.NONE||(i.preventDefault(),this.dispatchEvent(Qd),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent($0))}function YS(i){this.enabled!==!1&&this._handleKeyDown(i)}function JS(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Ws.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=Ft.TOUCH_ROTATE;break;case Ws.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=Ft.TOUCH_PAN;break;default:this.state=Ft.NONE}break;case 2:switch(this.touches.TWO){case Ws.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Ft.TOUCH_DOLLY_PAN;break;case Ws.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Ft.TOUCH_DOLLY_ROTATE;break;default:this.state=Ft.NONE}break;default:this.state=Ft.NONE}this.state!==Ft.NONE&&this.dispatchEvent(Qd)}function ZS(i){switch(this._trackPointer(i),this.state){case Ft.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Ft.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Ft.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Ft.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Ft.NONE}}function $S(i){this.enabled!==!1&&i.preventDefault()}function QS(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function eE(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}St();var Zi={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};St();St();var Gn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},tE=new qi(-1,1,1,-1,0,1),ef=class extends ot{constructor(){super(),this.setAttribute("position",new Ye([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Ye([0,2,0,0,2,0],2))}},nE=new ef,$i=class{constructor(e){this._mesh=new at(nE,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,tE)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var La=class extends Gn{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Bt?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=zn.clone(e.uniforms),this.material=new Bt({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new $i(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var cl=class extends Gn{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let s=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},Gh=class extends Gn{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var Vh=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new $);this._width=n.width,this._height=n.height,t=new qt(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Qt}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new La(Zi),this.copyPass.material.blending=nn,this.timer=new Mr}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}cl!==void 0&&(a instanceof cl?n=!0:a instanceof Gh&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new $);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};St();var Wh=class extends Gn{constructor(e,t,n=null,s=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new ye}render(e,t,n){let s=e.autoClear;e.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=s}};St();St();var Q0={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new ye(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var Na=class i extends Gn{constructor(e,t=1,n,s){super(),this.strength=t,this.radius=n,this.threshold=s,this.resolution=e!==void 0?new $(e.x,e.y):new $(256,256),this.clearColor=new ye(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new qt(r,a,{type:Qt,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){let u=new qt(r,a,{type:Qt,depthBuffer:!1});u.texture.name="UnrealBloomPass.h"+h,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);let d=new qt(r,a,{type:Qt,depthBuffer:!1});d.texture.name="UnrealBloomPass.v"+h,d.texture.generateMipmaps=!1,this.renderTargetsVertical.push(d),r=Math.round(r/2),a=Math.round(a/2)}let o=Q0;this.highPassUniforms=zn.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Bt({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let l=[6,10,14,18,22];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new $(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new w(1,1,1),new w(1,1,1),new w(1,1,1),new w(1,1,1),new w(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=zn.clone(Zi.uniforms),this.blendMaterial=new Bt({uniforms:this.copyUniforms,vertexShader:Zi.vertexShader,fragmentShader:Zi.fragmentShader,premultipliedAlpha:!0,blending:Bn,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new ye,this._oldClearAlpha=1,this._basic=new $t,this._fsQuad=new $i(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new $(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(e,t,n,s,r){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(n),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=a}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(n*n))/n);let s=[],r=[];for(let a=1;a<e;a+=2){let o=t[a],l=a+1<e?t[a+1]:0,c=o+l;s.push((a*o+(a+1)*l)/c),r.push(c)}return new Bt({defines:{KERNEL_PAIRS:s.length},uniforms:{colorTexture:{value:null},invSize:{value:new $(.5,.5)},direction:{value:new $(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:s},gaussianWeights:{value:r}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new Bt({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};Na.BlurDirectionX=new $(1,0);Na.BlurDirectionY=new $(0,1);St();St();var hl={name:"GTAOShader",defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:"x",SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new $},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new De},cameraProjectionMatrixInverse:{value:new De},cameraWorldMatrix:{value:new De},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new w(-1,-1,-1)},sceneBoxMax:{value:new w(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},ul={name:"GTAODepthShader",defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},qh={name:"GTAOBlendShader",uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`};function eg(i=5){let e=Math.floor(i)%2===0?Math.floor(i)+1:Math.floor(i),t=iE(e),n=t.length,s=new Uint8Array(n*4);for(let a=0;a<n;++a){let o=t[a],l=2*Math.PI*o/n,c=new w(Math.cos(l),Math.sin(l),0).normalize();s[a*4]=(c.x*.5+.5)*255,s[a*4+1]=(c.y*.5+.5)*255,s[a*4+2]=127,s[a*4+3]=255}let r=new Oi(s,e,e);return r.wrapS=xn,r.wrapT=xn,r.needsUpdate=!0,r}function iE(i){let e=Math.floor(i)%2===0?Math.floor(i)+1:Math.floor(i),t=e*e,n=Array(t).fill(0),s=Math.floor(e/2),r=e-1;for(let a=1;a<=t;){if(s===-1&&r===e?(r=e-2,s=0):(r===e&&(r=0),s<0&&(s=e-1)),n[s*e+r]!==0){r-=2,s++;continue}else n[s*e+r]=a++;r++,s--}return n}St();var dl={name:"PoissonDenoiseShader",defines:{SAMPLES:16,SAMPLE_VECTORS:tf(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new $},cameraProjectionMatrixInverse:{value:new De},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function tf(i,e,t){let n=sE(i,e,t),s="vec3[SAMPLES](";for(let r=0;r<i;r++){let a=n[r];s+=`vec3(${a.x}, ${a.y}, ${a.z})${r<i-1?",":")"}`}return s}function sE(i,e,t){let n=[];for(let s=0;s<i;s++){let r=2*Math.PI*e*s/i,a=Math.pow(s/(i-1),t);n.push(new w(Math.cos(r),Math.sin(r),a))}return n}var Xh=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let t=0;t<512;t++)this.perm[t]=this.p[t&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,s,r,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,l=Math.floor(e+o),c=Math.floor(t+o),h=(3-Math.sqrt(3))/6,u=(l+c)*h,d=l-u,f=c-u,p=e-d,_=t-f,g,m;p>_?(g=1,m=0):(g=0,m=1);let x=p-g+h,M=_-m+h,b=p-1+2*h,v=_-1+2*h,S=l&255,R=c&255,y=this.perm[S+this.perm[R]]%12,A=this.perm[S+g+this.perm[R+m]]%12,C=this.perm[S+1+this.perm[R+1]]%12,D=.5-p*p-_*_;D<0?n=0:(D*=D,n=D*D*this._dot(this.grad3[y],p,_));let F=.5-x*x-M*M;F<0?s=0:(F*=F,s=F*F*this._dot(this.grad3[A],x,M));let O=.5-b*b-v*v;return O<0?r=0:(O*=O,r=O*O*this._dot(this.grad3[C],b,v)),70*(n+s+r)}noise3d(e,t,n){let s,r,a,o,c=(e+t+n)*.3333333333333333,h=Math.floor(e+c),u=Math.floor(t+c),d=Math.floor(n+c),f=1/6,p=(h+u+d)*f,_=h-p,g=u-p,m=d-p,x=e-_,M=t-g,b=n-m,v,S,R,y,A,C;x>=M?M>=b?(v=1,S=0,R=0,y=1,A=1,C=0):x>=b?(v=1,S=0,R=0,y=1,A=0,C=1):(v=0,S=0,R=1,y=1,A=0,C=1):M<b?(v=0,S=0,R=1,y=0,A=1,C=1):x<b?(v=0,S=1,R=0,y=0,A=1,C=1):(v=0,S=1,R=0,y=1,A=1,C=0);let D=x-v+f,F=M-S+f,O=b-R+f,L=x-y+2*f,k=M-A+2*f,G=b-C+2*f,V=x-1+3*f,te=M-1+3*f,N=b-1+3*f,Z=h&255,ie=u&255,be=d&255,me=this.perm[Z+this.perm[ie+this.perm[be]]]%12,Je=this.perm[Z+v+this.perm[ie+S+this.perm[be+R]]]%12,We=this.perm[Z+y+this.perm[ie+A+this.perm[be+C]]]%12,we=this.perm[Z+1+this.perm[ie+1+this.perm[be+1]]]%12,q=.6-x*x-M*M-b*b;q<0?s=0:(q*=q,s=q*q*this._dot3(this.grad3[me],x,M,b));let j=.6-D*D-F*F-O*O;j<0?r=0:(j*=j,r=j*j*this._dot3(this.grad3[Je],D,F,O));let Q=.6-L*L-k*k-G*G;Q<0?a=0:(Q*=Q,a=Q*Q*this._dot3(this.grad3[We],L,k,G));let fe=.6-V*V-te*te-N*N;return fe<0?o=0:(fe*=fe,o=fe*fe*this._dot3(this.grad3[we],V,te,N)),32*(s+r+a+o)}noise4d(e,t,n,s){let r=this.grad4,a=this.simplex,o=this.perm,l=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,h,u,d,f,p,_=(e+t+n+s)*l,g=Math.floor(e+_),m=Math.floor(t+_),x=Math.floor(n+_),M=Math.floor(s+_),b=(g+m+x+M)*c,v=g-b,S=m-b,R=x-b,y=M-b,A=e-v,C=t-S,D=n-R,F=s-y,O=A>C?32:0,L=A>D?16:0,k=C>D?8:0,G=A>F?4:0,V=C>F?2:0,te=D>F?1:0,N=O+L+k+G+V+te,Z=a[N][0]>=3?1:0,ie=a[N][1]>=3?1:0,be=a[N][2]>=3?1:0,me=a[N][3]>=3?1:0,Je=a[N][0]>=2?1:0,We=a[N][1]>=2?1:0,we=a[N][2]>=2?1:0,q=a[N][3]>=2?1:0,j=a[N][0]>=1?1:0,Q=a[N][1]>=1?1:0,fe=a[N][2]>=1?1:0,ae=a[N][3]>=1?1:0,ge=A-Z+c,et=C-ie+c,X=D-be+c,J=F-me+c,ce=A-Je+2*c,he=C-We+2*c,de=D-we+2*c,Te=F-q+2*c,Pe=A-j+3*c,je=C-Q+3*c,Oe=D-fe+3*c,U=F-ae+3*c,lt=A-1+4*c,rt=C-1+4*c,I=D-1+4*c,E=F-1+4*c,z=g&255,W=m&255,ne=x&255,pe=M&255,_e=o[z+o[W+o[ne+o[pe]]]]%32,se=o[z+Z+o[W+ie+o[ne+be+o[pe+me]]]]%32,le=o[z+Je+o[W+We+o[ne+we+o[pe+q]]]]%32,Me=o[z+j+o[W+Q+o[ne+fe+o[pe+ae]]]]%32,Be=o[z+1+o[W+1+o[ne+1+o[pe+1]]]]%32,ve=.6-A*A-C*C-D*D-F*F;ve<0?h=0:(ve*=ve,h=ve*ve*this._dot4(r[_e],A,C,D,F));let xe=.6-ge*ge-et*et-X*X-J*J;xe<0?u=0:(xe*=xe,u=xe*xe*this._dot4(r[se],ge,et,X,J));let Ne=.6-ce*ce-he*he-de*de-Te*Te;Ne<0?d=0:(Ne*=Ne,d=Ne*Ne*this._dot4(r[le],ce,he,de,Te));let Ge=.6-Pe*Pe-je*je-Oe*Oe-U*U;Ge<0?f=0:(Ge*=Ge,f=Ge*Ge*this._dot4(r[Me],Pe,je,Oe,U));let Ze=.6-lt*lt-rt*rt-I*I-E*E;return Ze<0?p=0:(Ze*=Ze,p=Ze*Ze*this._dot4(r[Be],lt,rt,I,E)),27*(h+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,s){return e[0]*t+e[1]*n+e[2]*s}_dot4(e,t,n,s,r){return e[0]*t+e[1]*n+e[2]*s+e[3]*r}};var fl=class i extends Gn{constructor(e,t,n=512,s=512,r,a,o){super(),this.width=n,this.height=s,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=eg(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new qt(this.width,this.height,{type:Qt,depthBuffer:!1}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new Bt({defines:Object.assign({},hl.defines),uniforms:zn.clone(hl.uniforms),vertexShader:hl.vertexShader,fragmentShader:hl.fragmentShader,blending:nn,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=this.camera.isPerspectiveCamera?1:0,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new Fo,this.normalMaterial.blending=nn,this.pdMaterial=new Bt({defines:Object.assign({},dl.defines),uniforms:zn.clone(dl.uniforms),vertexShader:dl.vertexShader,fragmentShader:dl.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new Bt({defines:Object.assign({},ul.defines),uniforms:zn.clone(ul.uniforms),vertexShader:ul.vertexShader,fragmentShader:ul.fragmentShader,blending:nn}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new Bt({uniforms:zn.clone(Zi.uniforms),vertexShader:Zi.vertexShader,fragmentShader:Zi.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:Wo,blendDst:Er,blendEquation:fi,blendSrcAlpha:Vo,blendDstAlpha:Er,blendEquationAlpha:fi}),this.blendMaterial=new Bt({uniforms:zn.clone(qh.uniforms),vertexShader:qh.vertexShader,fragmentShader:qh.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:Gc,blendSrc:Wo,blendDst:Er,blendEquation:fi,blendSrcAlpha:Vo,blendDstAlpha:Er,blendEquationAlpha:fi}),this._fsQuad=new $i(null),this._originalClearColor=new ye,this.setGBuffer(r?r.depthTexture:void 0,r?r.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e!==void 0?(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1):(this.depthTexture=new Hi,this.depthTexture.format=Ki,this.depthTexture.type=Xs,this.normalRenderTarget=new qt(this.width,this.height,{minFilter:jt,magFilter:jt,type:Qt,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0);let n=this.normalTexture?1:0,s=this.depthTexture===this.normalTexture?"w":"x";this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=s,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=s,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&(e.screenSpaceRadius?1:0)!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=e.screenSpaceRadius?1:0,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=tf(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(e,t,n){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(e,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(e,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case i.OUTPUT.Off:break;case i.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=n.texture,this.copyMaterial.blending=nn,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=nn,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=nn,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=nn,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case i.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=n.texture,this.copyMaterial.blending=nn,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(e,this.blendMaterial,this.renderToScreen?null:t);break;default:console.warn("THREE.GTAOPass: Unknown output type.")}}_renderPass(e,t,n,s,r){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,s!=null&&(e.setClearColor(s),e.setClearAlpha(r||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,s,r){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,s=t.clearColor||s,r=t.clearAlpha||r,s!=null&&(e.setClearColor(s),e.setClearAlpha(r||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(n){(n.isPoints||n.isLine||n.isLine2)&&n.visible&&(n.visible=!1,t.push(n))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new Xh,n=e*e*4,s=new Uint8Array(n);for(let a=0;a<e;a++)for(let o=0;o<e;o++){let l=a,c=o;s[(a*e+o)*4]=(t.noise(l,c)*.5+.5)*255,s[(a*e+o)*4+1]=(t.noise(l+e,c)*.5+.5)*255,s[(a*e+o)*4+2]=(t.noise(l,c+e)*.5+.5)*255,s[(a*e+o)*4+3]=(t.noise(l+e,c+e)*.5+.5)*255}let r=new Oi(s,e,e,Hn,In);return r.wrapS=xn,r.wrapT=xn,r.needsUpdate=!0,r}};fl.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};St();var pl={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var jh=class extends Gn{constructor(){super(),this.isOutputPass=!0,this.uniforms=zn.clone(pl.uniforms),this.material=new xa({name:pl.name,uniforms:this.uniforms,vertexShader:pl.vertexShader,fragmentShader:pl.fragmentShader}),this._fsQuad=new $i(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},ht.getTransfer(this._outputColorSpace)===wt&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===qo?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Xo?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===jo?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ji?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Yo?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Jo?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Ko&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};Kh();ka();St();ka();St();function Oa(i,e,t,{srgb:n=!0,repeat:s=!1}={}){let r=document.createElement("canvas");r.width=i,r.height=e,t(r.getContext("2d"),i,e);let a=new Bi(r);return n&&(a.colorSpace=Tt),s&&(a.wrapS=a.wrapT=xn),a.anisotropy=4,a}function mg(){return Oa(128,256,(i,e,t)=>{let n=i.createRadialGradient(e/2,t*.78,2,e/2,t*.62,t*.55);n.addColorStop(0,"rgba(255,250,230,1)"),n.addColorStop(.18,"rgba(255,214,120,0.95)"),n.addColorStop(.45,"rgba(255,128,32,0.65)"),n.addColorStop(.75,"rgba(190,50,10,0.18)"),n.addColorStop(1,"rgba(120,20,0,0)"),i.fillStyle=n,i.beginPath(),i.moveTo(e/2,t*.02),i.bezierCurveTo(e*.86,t*.42,e*.98,t*.82,e/2,t*.98),i.bezierCurveTo(e*.02,t*.82,e*.14,t*.42,e/2,t*.02),i.fill()})}function gg(i="rgba(255,200,120,0.9)",e="rgba(255,140,40,0)"){return Oa(128,128,(t,n,s)=>{let r=t.createRadialGradient(n/2,s/2,0,n/2,s/2,n/2);r.addColorStop(0,i),r.addColorStop(.35,"rgba(255,170,80,0.28)"),r.addColorStop(1,e),t.fillStyle=r,t.fillRect(0,0,n,s)})}function Nf(i="#5b1a17",e="#a7752f",t="#2b3550"){return Oa(512,768,(n,s,r)=>{n.fillStyle=i,n.fillRect(0,0,s,r);for(let o=0;o<r;o+=3)n.fillStyle=`rgba(0,0,0,${.05+.05*Math.random()})`,n.fillRect(0,o,s,1);let a=46;n.fillStyle=e,n.fillRect(0,0,s,a),n.fillRect(0,r-a,s,a),n.fillRect(0,0,a,r),n.fillRect(s-a,0,a,r),n.fillStyle=t;for(let o=a;o<s-a;o+=24)n.beginPath(),n.moveTo(o+12,10),n.lineTo(o+22,23),n.lineTo(o+12,36),n.lineTo(o+2,23),n.fill(),n.beginPath(),n.moveTo(o+12,r-36),n.lineTo(o+22,r-23),n.lineTo(o+12,r-10),n.lineTo(o+2,r-23),n.fill();n.strokeStyle=e,n.lineWidth=6,n.strokeRect(a+18,a+18,s-2*a-36,r-2*a-36),n.save(),n.translate(s/2,r/2);for(let o=0;o<4;o++){n.fillStyle=o%2?e:t;let l=150-o*34;n.beginPath(),n.moveTo(0,-l),n.lineTo(l*.7,0),n.lineTo(0,l),n.lineTo(-l*.7,0),n.fill()}n.restore();for(let o=0;o<2500;o++)n.fillStyle=`rgba(255,230,190,${Math.random()*.05})`,n.fillRect(Math.random()*s,Math.random()*r,2,2)})}function bg(){return Oa(128,256,(i,e,t)=>{let n=i.createLinearGradient(0,0,0,t);n.addColorStop(0,"#2a3b66"),n.addColorStop(1,"#0d1426"),i.fillStyle=n,i.fillRect(0,0,e,t);let s=i.createRadialGradient(e*.7,t*.25,2,e*.7,t*.25,60);s.addColorStop(0,"rgba(220,230,255,0.9)"),s.addColorStop(1,"rgba(120,150,220,0)"),i.fillStyle=s,i.fillRect(0,0,e,t)})}function _g(){return Oa(64,256,(i,e,t)=>{let n=i.createLinearGradient(0,0,0,t);n.addColorStop(0,"rgba(160,190,255,0.55)"),n.addColorStop(1,"rgba(160,190,255,0)"),i.fillStyle=n,i.fillRect(0,0,e,t);let s=i.createLinearGradient(0,0,e,0);s.addColorStop(0,"rgba(0,0,0,1)"),s.addColorStop(.3,"rgba(0,0,0,0)"),s.addColorStop(.7,"rgba(0,0,0,0)"),s.addColorStop(1,"rgba(0,0,0,1)"),i.globalCompositeOperation="destination-out",i.fillStyle=s,i.fillRect(0,0,e,t)})}function xg(){return Oa(32,32,(i,e,t)=>{let n=i.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=n,i.fillRect(0,0,e,t)})}St();var xE=mg(),vE=gg(),vg=xg(),kf=[],Of=[],es=null,Ms=null;function yg(i,e,t=1){let n=new mr({map:xE,color:16777215,blending:Bn,depthWrite:!1,transparent:!0,opacity:t,toneMapped:!1}),s=new pa(n);return s.center.set(.5,.08),s.scale.set(i,e,1),s.userData.base=[i,e],s.userData.phase=Math.random()*10,Of.push(s),s}function Mg(i,e=16760944,t=.6){let n=new mr({map:vE,color:e,blending:Bn,depthWrite:!1,transparent:!0,opacity:t,toneMapped:!1}),s=new pa(n);return s.scale.set(i,i,1),s}function Ir(i,e,t,{shadow:n=!1,mapSize:s=512,speed:r=1}={}){let a=new yr(i,e,t,2);return a.userData.base=e,a.userData.speed=r,a.userData.phase=Math.random()*100,n&&(a.castShadow=!0,a.shadow.mapSize.set(s,s),a.shadow.bias=-.002,a.shadow.normalBias=.03,a.shadow.radius=4,a.shadow.camera.near=.1,a.shadow.camera.far=14),kf.push(a),a}function Ri(i,e,{light:t=!0,size:n=1,intensity:s=1.6}={}){let r=new mt;r.position.copy(e),r.add(yg(.035*n,.09*n));let a=Mg(.32*n,16756832,.5);if(a.position.y=.035*n,r.add(a),t){let o=Ir(16754768,s,3.2,{speed:1.6});o.position.y=.08,r.add(o)}return i.add(r),r}function Sg(i,e,{shadowMap:t=1024}={}){let n=new mt;n.position.copy(e);let s=[[0,.55,.9],[-.22,.42,.7],[.22,.45,.75],[-.1,.38,.6],[.12,.36,.58],[.32,.3,.45],[-.32,.28,.42]];for(let[d,f,p]of s){let _=yg(f*.9,p,.92);_.position.set(d,.05,(Math.random()-.5)*.12),n.add(_)}let r=Mg(1.6,16738848,.85);r.position.y=.12,r.scale.set(1.7,.7,1),n.add(r);let a=Ir(16747068,48,0,{shadow:!0,mapSize:t,speed:1});a.position.set(0,.55,.45),n.add(a);let o=60,l=new ot,c=new Float32Array(o*3),h=new Float32Array(o);for(let d=0;d<o;d++)c[d*3]=(Math.random()-.5)*.7,c[d*3+1]=Math.random()*1.4,c[d*3+2]=(Math.random()-.5)*.3,h[d]=Math.random();l.setAttribute("position",new $e(c,3));let u=new ms({map:vg,size:.035,color:16752704,blending:Bn,depthWrite:!1,transparent:!0,toneMapped:!1});return es=new Hs(l,u),es.userData.life=h,n.add(es),i.add(n),{group:n,light:a}}function Eg(i,e,t,n){let s=_g(),r=e.distanceTo(t),a=new $t({map:s,transparent:!0,opacity:.32,blending:Bn,depthWrite:!1,side:Pn,toneMapped:!1}),o=new mt;for(let d=0;d<2;d++){let f=new at(new Mn(n,r),a);f.rotation.y=d*Math.PI/2,f.position.y=-r/2,o.add(f)}o.position.copy(e);let l=new w().subVectors(t,e).normalize();o.quaternion.setFromUnitVectors(new w(0,-1,0),l),i.add(o);let c=140,h=new ot,u=new Float32Array(c*3);for(let d=0;d<c;d++){let f=Math.random(),p=e.clone().lerp(t,f);u[d*3]=p.x+(Math.random()-.5)*n*.7,u[d*3+1]=p.y+(Math.random()-.5)*.3,u[d*3+2]=p.z+(Math.random()-.5)*n*.7}return h.setAttribute("position",new $e(u,3)),Ms=new Hs(h,new ms({map:vg,size:.018,color:12110079,transparent:!0,opacity:.7,blending:Bn,depthWrite:!1,toneMapped:!1})),Ms.userData.base=u.slice(),i.add(Ms),o}function yE(i){let e=i;for(let t=0;t<64&&e;t++){if(e.isScene)return!0;e=e.parent}return!1}var Ff=0;function Uf(i){return yE(i)?(i.userData.fxSeen=!0,!1):!!i.userData.fxSeen}function ME(){for(let i of[kf,Of])for(let e=i.length-1;e>=0;e--)Uf(i[e])&&i.splice(e,1);es&&Uf(es)&&(es=null),Ms&&Uf(Ms)&&(Ms=null)}function wg(i,e){Ff+=e,Ff>3&&(Ff=0,ME());for(let t of kf){let n=i*7*t.userData.speed+t.userData.phase,s=.82+.1*Math.sin(n)+.06*Math.sin(n*2.7+1.3)+.05*Math.sin(n*6.1);t.intensity=t.userData.base*s}for(let t of Of){let n=i*9+t.userData.phase,[s,r]=t.userData.base;t.scale.set(s*(.9+.1*Math.sin(n*1.3)),r*(.86+.14*Math.sin(n)+.05*Math.sin(n*3.1)),1)}if(es){let t=es.geometry.attributes.position,n=es.userData.life;for(let s=0;s<n.length;s++)n[s]+=e*.35,n[s]>1&&(n[s]=0,t.setXYZ(s,(Math.random()-.5)*.6,.1,(Math.random()-.5)*.25)),t.setY(s,.1+n[s]*1.6),t.setX(s,t.getX(s)+Math.sin(i*3+s)*e*.05);t.needsUpdate=!0,es.material.opacity=.9}if(Ms){let t=Ms.geometry.attributes.position,n=Ms.userData.base;for(let s=0;s<t.count;s++)t.setXYZ(s,n[s*3]+Math.sin(i*.3+s)*.05,n[s*3+1]+Math.sin(i*.21+s*1.7)*.06,n[s*3+2]+Math.cos(i*.25+s)*.05);t.needsUpdate=!0}}var Js={W:10,D:8,H:3.4,T:.3},{W:Et,D:gn,H:bn,T:zt}=Js,Dr=Pt.degToRad;function Ag(i,e,t,n,s,{cast:r=!0,receive:a=!0}={}){let o=new at(i,e);return o.position.set(t,n,s),o.castShadow=r,o.receiveShadow=a,o}var tt=(i,e,t,n,s,r,a,o)=>Ag(new At(i,e,t),n,s,r,a,o);function Tg(i,e,t,n){let s=new Mt(e,e*1.05,i,10,1),r=new at(s,[t,n,n]);return r.castShadow=r.receiveShadow=!0,r}function Bf(i,e){let t=new mt,n=new at(new Mt(.045,.05,.13,14),i);n.position.y=.065,t.add(n);for(let r of[.025,.105]){let a=new at(new _t(.049,.004,6,18),e);a.rotation.x=Math.PI/2,a.position.y=r,t.add(a)}let s=new at(new _t(.035,.008,6,12,Math.PI),i);return s.rotation.z=-Math.PI/2,s.position.set(.05,.068,0),t.add(s),t.traverse(r=>{r.isMesh&&(r.castShadow=r.receiveShadow=!0)}),t}function SE(i,e=.3){let t=[[0,0],[.045,0],[.05,.01],[.05,.55],[.03,.7],[.016,.76],[.016,.95],[.02,.97],[.014,1],[0,1]].map(([s,r])=>new $(s*e*2.2,r*e)),n=new at(new zs(t,14),i);return n.castShadow=!0,n}async function Rg(i,e){let t=new mt;t.name="posada",i.add(t);let n=[],s=(Re,nt,It)=>n.push({x:Re,z:nt,r:It}),r=mn("old_wood_floor",{repeat:[Et/2.4,gn/2.4],normalScale:.8,tint:14205864}),a=mn("medieval_blocks_06",{repeat:[5,.35],tint:10260352}),o=mn("medieval_blocks_06",{repeat:[4,.35],tint:10260352}),l=mn("plastered_stone_wall",{repeat:[Et/3,bn/3],tint:14865083}),c=mn("plastered_stone_wall",{repeat:[gn/3,bn/3],tint:14865083}),h=mn("medieval_wood",{repeat:[1,2],tint:7033664}),u=mn("medieval_wood",{repeat:[4,.5],tint:7033664,rotation:Math.PI/2}),d=mn("rough_wood",{repeat:[Et/1.2,1],tint:8084030}),f=mn("rough_wood",{repeat:[gn/1.2,1],tint:8084030}),p=mn("stacked_stone_wall",{repeat:[1.6,1.6],tint:11839894}),_=mn("stacked_stone_wall",{repeat:[1.5,1.2],tint:11839894}),g=mn("slate_floor",{repeat:[2,.6],tint:9079440}),m=mn("rough_wood",{repeat:[3,1],tint:6177065}),x=mn("medieval_wood",{repeat:[5,1],tint:7229235,rotation:Math.PI/2}),M=mn("rough_wood",{repeat:[1,2],tint:5913894}),b=new Ht({color:2762532,metalness:.7,roughness:.55}),v=new Ht({color:1182728,roughness:1}),S=new Ht({color:1981218,roughness:.12,metalness:.1,transparent:!0,opacity:.88}),R=new Ht({color:5909516,roughness:.12,metalness:.1,transparent:!0,opacity:.9}),y=mn("rough_wood",{repeat:[.4,.3],tint:9069632,ao:!1}),A=mn("rough_wood",{repeat:[.5,.5],tint:4863526,ao:!1}),C=new Ht({color:11569759,roughness:.9}),D=Ag(new Mn(Et,gn),r,0,0,0,{cast:!1});D.rotation.x=-Math.PI/2,D.name="suelo",t.add(D);let F=tt(Et+2*zt,.6,gn+2*zt,[o,o,v,v,a,a],0,-.302,0,{cast:!1});t.add(F);let O=new Bi((()=>{let Re=document.createElement("canvas");Re.width=Re.height=128;let nt=Re.getContext("2d"),It=nt.createRadialGradient(64,64,20,64,64,64);return It.addColorStop(0,"rgba(0,0,0,0.75)"),It.addColorStop(1,"rgba(0,0,0,0)"),nt.fillStyle=It,nt.fillRect(0,0,128,128),Re})()),L=new at(new Mn(Et*1.9,gn*1.9),new $t({map:O,transparent:!0,depthWrite:!1}));L.rotation.x=-Math.PI/2,L.position.y=-.62,t.add(L),t.add(tt(Et+2*zt,bn,zt,l,0,bn/2,-gn/2-zt/2)),t.add(tt(zt,bn,gn,c,-Et/2-zt/2,bn/2,0)),t.add(tt(Et,1,.04,d,0,.5,-gn/2+.02)),t.add(tt(.04,1,gn,f,-Et/2+.02,.5,0)),t.add(tt(Et,.07,.09,u,0,1.03,-gn/2+.045)),t.add(tt(.09,.07,gn,u,-Et/2+.045,1.03,0)),t.add(tt(Et+2*zt,.24,zt+.08,u,0,bn+.02,-gn/2-zt/2+.04)),t.add(tt(zt+.08,.24,gn,u,-Et/2-zt/2+.04,bn+.02,0));for(let Re of[-4.86,-1.35,2.15])t.add(tt(.24,bn,.14,h,Re,bn/2,-gn/2+.07));for(let Re of[-3.86,-.6,1.9,3.86])t.add(tt(.14,bn,.24,h,-Et/2+.07,bn/2,Re));let k=.4;t.add(tt(Et+zt,.26,.24,u,-zt/2,bn-.1,k));let G=mn("plastered_stone_wall",{repeat:[Et/3,.2],tint:13220258}),V=.42;t.add(tt(Et+2*zt,V,zt,G,0,V/2,gn/2+zt/2)),t.add(tt(zt,V,5.8,G,Et/2+zt/2,V/2,-gn/2+2.9)),t.add(tt(zt,V,.4,G,Et/2+zt/2,V/2,gn/2-.2)),t.add(tt(zt+.1,.05,1.8,g,Et/2+zt/2,.025,2.7)),t.add(tt(zt+.06,.62,.22,h,Et/2+zt/2,.31,1.75)),t.add(tt(zt+.06,.62,.22,h,Et/2+zt/2,.31,3.65));let te=.6,N=-gn/2;t.add(tt(.5,1.2,.62,p,te-1.05,.6,N+.31)),t.add(tt(.5,1.2,.62,p,te+1.05,.6,N+.31)),t.add(tt(2.6,.42,.66,_,te,1.41,N+.33)),t.add(tt(2.36,bn-1.62,.5,_,te,1.62+(bn-1.62)/2,N+.25)),t.add(tt(1.62,1.2,.04,v,te,.6,N+.02,{cast:!1})),t.add(tt(1.6,.06,.6,g,te,.03,N+.3)),t.add(tt(3.1,.07,.85,g,te,.035,N+.62+.42)),t.add(tt(2.95,.14,.36,u,te,1.69,N+.66)),s(te,N+.9,1.1);let Z=new mt;Z.position.set(te,.06,N+.32);for(let[Re,nt,It,is]of[[-.18,.02,.2,1.45],[.2,-.04,-.3,1.5],[0,.08,1.2,1.57]]){let $a=Tg(.7,.06,A,C);$a.rotation.set(0,It,is),$a.position.set(Re,.07,nt),Z.add($a)}t.add(Z);let ie=Sg(t,new w(te,.1,N+.36),{shadowMap:e.shadowMap}),be=await gt("bull_head");be.scale.setScalar(1.55),be.position.set(te,2.05,N+.52),t.add(be);let me=await gt("brass_candleholders");me.scale.setScalar(.62),me.position.set(te-.05,1.76,N+.68),t.add(me),Ri(t,new w(te-.05,2.28,N+.68),{light:!0,intensity:2.2}),Ri(t,new w(te-.33,2.06,N+.68),{light:!1,size:.8}),Ri(t,new w(te+.24,2.06,N+.68),{light:!1,size:.8});let Je=new mt;Je.position.set(-1.05,0,N+.45);for(let Re=0;Re<3;Re++)for(let nt=0;nt<4-Re;nt++){let It=Tg(.55,.065,A,C);It.rotation.z=Math.PI/2,It.rotation.y=.1*(Math.random()-.5)+Math.PI/2,It.position.set(0,.065+Re*.115,(nt-(3-Re)/2)*.135),Je.add(It)}t.add(Je);let We=await gt("wooden_axe");We.position.set(-.68,.2,N+.5),We.rotation.set(0,Dr(-20),Dr(-18)),t.add(We);let we=await gt("wooden_bucket_01");we.position.set(2.3,0,N+.75),t.add(we);let q=await gt("brass_pot_01");q.scale.setScalar(.8),q.position.set(1.75,.07,N+.95),t.add(q),s(-1.05,N+.45,.4),s(2.3,N+.75,.3);let j=-2.45,Q=bg(),fe=new at(new Mn(.92,1.12),new $t({map:Q,toneMapped:!1}));fe.position.set(j,1.95,N+.012),t.add(fe);let ae=h;t.add(tt(1.12,.1,.12,ae,j,2.56,N+.06)),t.add(tt(1.24,.08,.22,ae,j,1.35,N+.1)),t.add(tt(.1,1.22,.12,ae,j-.51,1.95,N+.06)),t.add(tt(.1,1.22,.12,ae,j+.51,1.95,N+.06)),t.add(tt(.04,1.12,.05,b,j,1.95,N+.03)),t.add(tt(.92,.04,.05,b,j,1.95,N+.03));let ge=new vr(9349887,34,9,Dr(30),.85,1.6);ge.position.set(j,2.3,N+.25),ge.target.position.set(j+1.1,0,N+2.5),e.shadows&&(ge.castShadow=!0,ge.shadow.mapSize.set(512,512),ge.shadow.bias=-.0015,ge.shadow.normalBias=.03),t.add(ge,ge.target),Eg(t,new w(j,2.25,N+.1),new w(j+1.15,.02,N+2.55),.95);let et=await gt("painted_wooden_bench");et.position.set(j,0,N+.3),et.traverse(Re=>{Re.isMesh&&(Re.material=Re.material.clone(),Re.material.color.setHex(9071192))}),t.add(et),s(j,N+.3,.6);let X=4.3;t.add(tt(.98,2.15,.07,M,X,1.075,N+.04));for(let Re of[.45,1.75])t.add(tt(.9,.06,.02,b,X,Re,N+.085));t.add(tt(.06,.06,.03,b,X-.36,1.1,N+.09)),t.add(tt(.14,2.3,.16,h,X-.56,1.15,N+.08)),t.add(tt(.14,2.3,.16,h,X+.56,1.15,N+.08)),t.add(tt(1.26,.16,.18,h,X,2.3,N+.09));let J=await gt("wooden_lantern_01");J.position.set(X-.85,1.72,N+.2),t.add(J),t.add(tt(.05,.05,.22,b,X-.85,2.28,N+.11));let ce=Ir(16753226,6,5,{speed:1.3});ce.position.set(X-.85,1.95,N+.2),t.add(ce),Ri(t,new w(X-.85,1.86,N+.2),{light:!1,size:.9});let he=await gt("GothicCabinet_01");he.scale.setScalar(.92),he.position.set(2.95,0,N+.5),t.add(he),s(2.95,N+.5,.75);let de=new mt;for(let[Re,nt]of[[0,.05],[.35,-.12]]){let It=await gt("wooden_crate_01");It.position.set(0,Re,0),It.rotation.y=Math.PI/2+nt,de.add(It)}de.position.set(4.55,0,-2.75),t.add(de);let Te=await gt("wicker_basket_01");Te.position.set(4.55,.7,-2.75),Te.rotation.y=.3,t.add(Te);for(let Re=0;Re<5;Re++){let nt=await gt("food_apple_01");nt.position.set(4.45+Re%3*.09,.73,-2.8+Math.floor(Re/3)*.09),t.add(nt)}let Pe=await gt("wine_barrel_01");Pe.position.set(4.5,0,-1.75),Pe.rotation.y=.6,t.add(Pe);let je=await gt("wooden_broom");je.position.set(4.88,.12,-.95),je.rotation.set(0,Math.PI/2,Dr(10)),t.add(je),s(4.55,-2.75,.55),s(4.5,-1.75,.45);let Oe=-3.45,U=-2.75,lt=1.1,rt=lt-U,I=(U+lt)/2;t.add(tt(.55,1,rt,m,Oe,.5,I)),t.add(tt(.78,.08,rt+.2,x,Oe,1.04,I)),t.add(tt(.6,.12,rt,v,Oe+.02,.06,I));for(let Re=U+.25;Re<lt;Re+=.48)t.add(tt(.04,.82,.09,h,Oe+.29,.53,Re));t.add(tt(1.75,1,.55,m,-4.12,.5,lt+.27)),t.add(tt(1.85,.08,.75,x,-4.07,1.04,lt+.27));for(let Re=U;Re<=lt+.3;Re+=.6)s(Oe,Re,.45);s(-4.1,lt+.27,.6);for(let Re of[1.48,2.06]){t.add(tt(.32,.05,2.9,x,-Et/2+.18,Re,-1.1));for(let nt of[-2.4,-1.1,.2])t.add(tt(.05,.16,.05,b,-Et/2+.06,Re-.1,nt))}let E=-Et/2+.2,z=await gt("brass_goblets");z.scale.setScalar(.55),z.position.set(E,1.505,-2.2),z.rotation.y=Math.PI/2,t.add(z);for(let Re=0;Re<7;Re++){let nt=SE(Re%3===1?R:S,.26+Re%2*.05);nt.position.set(E+(Re%2?.05:-.03),2.085,-2.3+Re*.17),t.add(nt)}for(let Re=0;Re<4;Re++){let nt=await gt("carved_wooden_plate");nt.rotation.set(0,Math.PI/2,Dr(70)),nt.position.set(E-.06,1.62,-1.3+Re*.3),t.add(nt)}for(let Re=0;Re<5;Re++){let nt=Bf(y,b);nt.position.set(E,1.505,-.2+Re*.16),nt.rotation.y=Math.PI,t.add(nt)}for(let[Re,nt]of[[.32,.2],[-.45,-.4]]){let It=await gt("wine_barrel_01");It.position.set(-4.48,0,Re),It.rotation.y=nt,t.add(It)}let W=await gt("wooden_cutting_board");W.position.set(Oe,1.08,-1.95),W.rotation.y=Math.PI/2,t.add(W);let ne=new at(new bt(.1,16,10),new Ht({color:11036974,roughness:.8}));ne.scale.set(1.3,.55,.8),ne.position.set(Oe,1.15,-1.95),ne.castShadow=!0,t.add(ne);for(let[Re,nt]of[[-1.15,.3],[-.95,-.6],[0,2.1]]){let It=Bf(y,b);It.position.set(Oe+.05,1.08,Re),It.rotation.y=nt,t.add(It)}let pe=await gt("wooden_lantern_01");pe.position.set(Oe-.05,1.08,.55),t.add(pe);let _e=Ir(16753226,7,5.5,{speed:1.2});_e.position.set(Oe-.05,1.3,.55),t.add(_e),Ri(t,new w(Oe-.05,1.24,.55),{light:!1,size:.9});let se=await gt("wooden_candlestick");se.position.set(Oe,1.08,-2.45),t.add(se),Ri(t,new w(Oe,1.3,-2.45),{light:!0,intensity:1.4});let le=await gt("wooden_table_02");le.position.set(.5,0,-1.25),t.add(le);for(let Re of[-.42,1.42]){let nt=await gt("wooden_stool_01");nt.position.set(Re,0,-1.25),t.add(nt)}s(.5,-1.25,.75);let Me=await gt("carved_wooden_plate");Me.position.set(.5,.8,-1.25),t.add(Me);for(let Re=0;Re<3;Re++){let nt=await gt("food_apple_01");nt.position.set(.47+Re*.07,.82,-1.25+Re%2*.06),t.add(nt)}for(let[Re,nt,It]of[[.08,-1.12,.4],[.9,-1.38,2.6]]){let is=Bf(y,b);is.position.set(Re,.8,nt),is.rotation.y=It,t.add(is)}let Be=await gt("wooden_candlestick");Be.position.set(.72,.8,-1.5),t.add(Be),Ri(t,new w(.72,1.02,-1.5),{light:!0,intensity:3.5});let ve=await gt("wooden_table_02");ve.position.set(2.85,0,.55),ve.rotation.y=Math.PI/2,t.add(ve);let xe=await gt("wooden_stool_01");xe.position.set(2.85,0,-.32),t.add(xe),s(2.85,.55,.7);let Ne=await gt("wicker_basket_01");Ne.scale.setScalar(.8),Ne.position.set(2.8,.8,.8),t.add(Ne);let Ge=await gt("wooden_bowl_01");Ge.scale.setScalar(.8),Ge.position.set(2.95,.8,.2),t.add(Ge);let Ze=await gt("book_encyclopedia_set_01");Ze.scale.setScalar(.5),Ze.position.set(2.6,.8,1.05),Ze.rotation.y=.4,t.add(Ze);let H=await gt("wooden_candlestick");H.position.set(3.08,.8,.5),t.add(H),Ri(t,new w(3.08,1.02,.5),{light:!0,intensity:3.5});let Se=await gt("kite_shield");Se.scale.setScalar(.75),Se.position.set(-Et/2+.07,2.2,2.75),Se.rotation.y=Math.PI/2,t.add(Se);for(let Re of[-1,1]){let nt=await gt("antique_estoc");nt.scale.setScalar(.8),nt.position.set(-Et/2+.05,1.75,2.75),nt.rotation.set(Re*Dr(38),Math.PI/2,0),t.add(nt)}let oe=await gt("treasure_chest");oe.scale.setScalar(.85),oe.position.set(-Et/2+.38,0,2.75),oe.rotation.y=Math.PI/2,t.add(oe),s(-4.6,2.75,.5);let Ee=await gt("spinning_wheel_01");Ee.position.set(-4.35,0,3.55),Ee.rotation.y=Dr(35),t.add(Ee),s(-4.35,3.55,.5);let Ae=await gt("wooden_lantern_01");Ae.scale.setScalar(.8),Ae.position.set(-Et/2+.22,1.9,1.9),t.add(Ae),t.add(tt(.24,.04,.04,b,-Et/2+.12,2.35,1.9));let ue=Ir(16753226,6,5,{speed:1.4});ue.position.set(-Et/2+.22,2.05,1.9),t.add(ue),Ri(t,new w(-Et/2+.22,2,1.9),{light:!1,size:.8});let Ve=new at(new Mn(2,3.2),new Ht({map:Nf(),roughness:.95}));Ve.rotation.set(-Math.PI/2,0,Math.PI/2),Ve.position.set(2,.006,1.85),Ve.receiveShadow=!0,t.add(Ve);let ke=new at(new Mn(.95,2.1),new Ht({map:Nf("#2c3a4f","#9a7b3e","#5b1a17"),roughness:.95}));ke.rotation.set(-Math.PI/2,0,Math.PI/2),ke.position.set(te,.006,-2.1),ke.receiveShadow=!0,t.add(ke);let Rt=await gt("lantern_chandelier_01");Rt.scale.setScalar(1.15),Rt.position.set(.6,bn-.22,k),t.add(Rt),t.add(tt(.03,.12,.03,b,.6,bn-.17,k));let vt=Ir(16756838,32,0,{shadow:e.shadows,mapSize:e.shadowMap/2,speed:.6});vt.position.set(.6,bn-.85,k),t.add(vt),Ri(t,new w(.6,bn-.98,k),{light:!1,size:1.4});let Zn=new vs(5595262,3810326,1.3);t.add(Zn);let $n=new vn(16768184,.75);return $n.position.set(6,9,8),t.add($n),{room:t,blockers:n,floor:D,hearth:ie}}ja();St();function Dw(){let i=new mt,e=new Ht({color:5978914,roughness:.8}),t=new at(new Mt(.018,.022,1.55,8),e);t.position.y=.35,i.add(t);let n=new at(new bt(.04,10,8),e);n.position.y=1.12,i.add(n);let s=new at(new gs(.035),new Ht({color:10475775,emissive:3837904,emissiveIntensity:2.2,roughness:.2}));return s.position.y=1.18,i.add(s),i.traverse(r=>{r.isMesh&&(r.castShadow=!0)}),i}var El=[{id:"brenna",name:"Brenna Halvard",role:"Guerrera \xB7 Campeona",hp:[7,12],ac:19,color:"#c8a45a",outfit:"Female_Ranger",hideParts:["Hood"],hair:["Hair_Buns"],hairColor:4858900,skin:16770774,recolor:{from:.33,width:.16,shift:.27,sat:.35,val:.9},pos:[2.7,1.8],lookAt:"maren",anim:"Sword_Idle",attach:[{prop:"antique_estoc",bone:"hand_r",scale:.62,pos:[0,.07,.03],rot:[0,0,-90]},{prop:"kite_shield",bone:"lowerarm_l",scale:.48,pos:[.08,.12,-.02],rot:[0,90,90]}],items:["Espada larga","Escudo","4 jabalinas","Cota de malla","Poci\xF3n de curaci\xF3n"]},{id:"pip",name:"Pip Tallowmere",role:"P\xEDcaro \xB7 Ladr\xF3n",hp:[10,10],ac:14,color:"#8fb07a",outfit:"Male_Ranger",variant:"T_Ranger_3_BaseColor",skin:16769736,scale:.8,pos:[3.55,1.35],lookAt:"maren",anim:"Idle_Loop",items:["Espada corta","2 dagas","Ballesta ligera (20 virotes)","Armadura de cuero","Herramientas de ladr\xF3n"]},{id:"ilyra",name:"Ilyra Sorendel",role:"Cl\xE9riga \xB7 Dominio de la Vida",hp:[10,10],ac:18,color:"#e8d9a8",outfit:"Female_Peasant",hair:["Hair_Long"],hairColor:14731408,skin:16773350,recolor:{from:.08,width:.1,shift:0,sat:.4,val:1.35},pos:[3.4,2.5],lookAt:"maren",anim:"Idle_Torch_Loop",attach:[{prop:"wooden_lantern_01",bone:"hand_l",scale:.7,pos:[0,.1,0],rot:[180,0,0],light:!0}],items:["Espada larga","Escudo con el sol del Alba","Cota de malla","S\xEDmbolo sagrado","Poci\xF3n de curaci\xF3n"]},{id:"odvar",name:"Maese Odvar",role:"Mago \xB7 Evocador",hp:[5,8],ac:11,color:"#8fb3d9",outfit:"Male_Peasant",variant:"T_Peasant_2_BaseColor",hair:["Hair_Beard","Hair_Buzzed"],hairColor:12103844,skin:15780008,scale:.84,recolor:{from:.12,width:.14,shift:.48,sat:1.4,val:1},pos:[2.25,2.75],lookAt:"maren",anim:"Idle_Loop",attach:[{make:Dw,bone:"hand_r",scale:1,pos:[0,.06,.02],rot:[0,0,-90]}],items:["Bast\xF3n","Daga","Libro de conjuros","Saquito de componentes","Poci\xF3n de curaci\xF3n"]}],e_=[{id:"maren",name:"Maren Ashford",role:"Alcaldesa de Merrowick",outfit:"Female_Peasant",hair:["Hair_Buns"],hairColor:3025448,skin:16177340,recolor:{from:.08,width:.12,shift:.72,sat:.9,val:.85},pos:[1.15,1.2],lookAt:"brenna",anim:"Idle_Talking_Loop",quest:!0,lines:["\xABMerrowick os debe una. Y me temo que voy a pediros otra.\xBB","\xABLos Zarpas Grises no se quedar\xE1n en el bosque. Si no vamos nosotros, vendr\xE1n ellos.\xBB"]},{id:"corwin",name:"Corwin",role:"Posadero",outfit:"Male_Peasant",hair:["Hair_SimpleParted","Hair_Beard"],hairColor:4861984,skin:15911076,pos:[-4.2,-1.55],face:90,anim:"Idle_Loop",lines:["\xABCama, cena y chimenea, dos piezas de oro por cabeza. Esta noche invita la casa: nos hab\xE9is salvado el pellejo.\xBB","\xABLos trasgos bajaron por el camino del este, el del bosque de Elderhal. All\xED tienen su campamento los Zarpas Grises.\xBB"]},{id:"dagna",name:"Dagna Emberforge",role:"Herrera",outfit:"Female_Peasant",variant:"T_Peasant_2_BaseColor",hair:["Hair_Buns"],hairColor:10111524,skin:15250572,scale:.84,pos:[-.36,-1.25],y:0,face:90,anim:"Sitting_Talking_Loop",lines:["\xABSi es de acero, lo arreglo. Si es de trasgo, lo fundo. \xBFQu\xE9 te hace falta?\xBB"]},{id:"tobin",name:"Tobin Hilltopple",role:"Buhonero",outfit:"Male_Peasant",hair:["Hair_SimpleParted"],hairColor:7031339,skin:15910044,scale:.76,recolor:{from:.08,width:.1,shift:.04,sat:1.3,val:1.1},pos:[1.36,-1.25],y:0,face:-90,anim:"Sitting_Talking_Loop",lines:["\xAB\xA1G\xE9nero de todas las Marcas! Cuerdas, pergaminos, cosas raras\u2026 Todo honrado. Casi todo.\xBB"]},{id:"ysolde",name:"Ysolde",role:"Herbolaria",outfit:"Female_Ranger",hair:["Hair_Long"],hairColor:13218954,skin:16770256,hideParts:["Hood"],pos:[2.85,-.3],y:0,face:0,anim:"Sitting_Idle_Loop",lines:["\xABRa\xEDz de sangre para las heridas, cardo para el veneno. Y paciencia, que no se vende.\xBB"]}],bu=["La lluvia ha amainado sobre Merrowick. En la Posada del Toro Dormido crepita la chimenea y huele a pan y a lana mojada. Corwin os ha guardado sitio junto al fuego: esta noche invita la casa.","En la mesa del hogar, Dagna la herrera y Tobin el buhonero discuten el precio de una cuerda. Junto a la otra mesa, Ysolde ordena sus hierbas a la luz de una vela.","Maren Ashford, la alcaldesa, se acerca sin quitarse la capa. \xABMerrowick os debe una. Y me temo que voy a pediros otra.\xBB","Los trasgos que os emboscaron en el prado bajaron por el camino del este, desde el bosque de Elderhal. All\xED acampan los Zarpas Grises. Si nadie los detiene, volver\xE1n."];St();var Zt=i=>document.querySelector(i),Ya=new w,_u=class{constructor(){this.moveMode=!0,this.onSelect=null,this.onMoveMode=null,this.onCenter=null,this.storyAt=0,this.bubbles=new Map,this.labelsEl=Zt("#rotulos"),this.buildParty(),this.bindActions(),this.renderStory()}progress(e){let t=Zt("#carga-barra");t&&(t.style.transform=`scaleX(${Math.max(.04,e)})`)}ready(){document.body.classList.add("lista"),setTimeout(()=>Zt("#carga")?.remove(),900)}fail(e){let t=Zt("#carga-texto");t&&(t.textContent=`No se ha podido montar la escena: ${String(e.message).slice(0,200)}`)}stage(e){let t=Zt("#carga-texto");t&&!this._stuck&&(t.textContent=`${e}\u2026`)}stuck(e,t){this._stuck=!0;let n=Zt("#carga-texto");if(n){n.textContent=e;for(let s of t){let r=document.createElement("p");r.className="carga-detalle",r.textContent=s,n.after(r)}}}buildParty(){let e=Zt("#grupo");for(let t of El){let n=document.createElement("button");n.className="pj",n.id=`pj-${t.id}`,n.type="button",n.innerHTML=`
        <span class="marco"><img alt="" data-retrato="${t.id}"><span class="ca" title="Clase de armadura">${t.ac}</span></span>
        <span class="datos">
          <span class="nombre">${t.name.split(" ")[0]==="Maese"?"Odvar":t.name.split(" ")[0]}</span>
          <span class="rol">${t.role}</span>
          <span class="vida" role="meter" aria-valuemin="0" aria-valuemax="${t.hp[1]}" aria-valuenow="${t.hp[0]}" aria-label="Puntos de golpe">
            <span class="relleno" style="width:${100*t.hp[0]/t.hp[1]}%"></span>
            <span class="cifra">${t.hp[0]} / ${t.hp[1]}</span>
          </span>
        </span>`,n.addEventListener("click",()=>this.onSelect?.(t.id)),e.appendChild(n)}}setPortraits(e){for(let[t,n]of Object.entries(e)){let s=document.querySelector(`img[data-retrato="${t}"]`);s&&(s.src=n)}}setSelected(e){for(let n of document.querySelectorAll(".pj"))n.classList.toggle("activo",n.id===`pj-${e}`);for(let n of document.querySelectorAll(".rotulo.de-grupo"))n.classList.toggle("activo",this.labelById?.[e]===n);let t=El.find(n=>n.id===e);Zt("#ayuda").textContent=t?`${t.name.split(" ")[0]==="Maese"?"Odvar":t.name.split(" ")[0]} \xB7 elige una casilla iluminada para moverte`:"",this.selectedDef=t,Zt("#mochila").hidden||this.showInventory()}addLabel(e,t){let n=document.createElement("div");return n.className=`rotulo ${t?"de-grupo":"de-pnj"}${e.quest?" con-mision":""}`,n.innerHTML=`<b>${e.name.replace("Maese ","")}</b>${t?"":`<i>${e.role}</i>`}`,this.labelsEl.appendChild(n),this.labelById=this.labelById||{},this.labelById[e.id]=n,n}placeLabels(e,t,n){let s=n.clientWidth,r=n.clientHeight,a=[];for(let[l,c]of e){l.headWorld(Ya),Ya.y+=.42*(l.def.scale??1),Ya.project(t),c._w||(c._w=c.offsetWidth,c._h=c.offsetHeight);let h=c.classList.contains("de-grupo")&&!c.classList.contains("activo");a.push({ch:l,el:c,x:(Ya.x*.5+.5)*s,y:(-Ya.y*.5+.5)*r,vis:Ya.z<1,hidden:h})}a.sort((l,c)=>c.y-l.y);let o=[];for(let l of a){let c=l.y;if(l.vis&&!l.hidden){for(let f=0;f<8;f++){let p=!1;for(let _ of o){let g=Math.abs(_.x-l.x)<(_.el._w+l.el._w)/2+4,m=c-l.el._h<_.y+2&&c>_.y-_.el._h-2;g&&m&&(c=_.y-_.el._h-4,p=!0)}if(!p)break}o.push({x:l.x,y:c,el:l.el})}let h=c-l.y;l.el._off=l.el._off==null?h:l.el._off+(h-l.el._off)*.2;let u=l.y+l.el._off;l.el.style.transform=`translate(${l.x.toFixed(1)}px, ${u.toFixed(1)}px) translate(-50%, -100%)`,l.el.style.visibility=l.vis?"visible":"hidden";let d=this.bubbles.get(l.ch);d&&(d.style.transform=`translate(${l.x.toFixed(1)}px, ${(u-l.el._h-6).toFixed(1)}px) translate(-50%, -100%)`)}}say(e){let t=e.def.lines||[];if(!t.length)return;e.lineAt=((e.lineAt??-1)+1)%t.length;let n=this.bubbles.get(e);n||(n=document.createElement("div"),n.className="bocadillo",this.labelsEl.appendChild(n),this.bubbles.set(e,n)),n.textContent=t[e.lineAt],n.classList.add("visible"),clearTimeout(n._t),n._t=setTimeout(()=>n.classList.remove("visible"),7e3),this.log(`<b>${e.def.name}</b> ${t[e.lineAt]}`)}log(e){let t=document.createElement("p");t.innerHTML=e;let n=Zt("#registro");n.appendChild(t),n.scrollTop=n.scrollHeight}renderStory(){Zt("#narracion").textContent=bu[this.storyAt],Zt("#paso").textContent=`${this.storyAt+1} / ${bu.length}`}showInventory(){let e=this.selectedDef;e&&(Zt("#mochila-titulo").textContent=`Equipo de ${e.name.replace("Maese ","")}`,Zt("#mochila-lista").innerHTML=e.items.map(t=>`<li>${t}</li>`).join(""))}toast(e){let t=Zt("#aviso");t.textContent=e,t.classList.add("visible"),clearTimeout(this._toast),this._toast=setTimeout(()=>t.classList.remove("visible"),4200)}bindActions(){let e=(t,n)=>Zt(t)?.addEventListener("click",n);e("#a-mover",()=>{this.moveMode=!this.moveMode,Zt("#a-mover").setAttribute("aria-pressed",String(this.moveMode)),this.onMoveMode?.()}),e("#a-hablar",()=>this.toast("Haz clic en alguien de la posada para hablar con \xE9l.")),e("#a-atacar",()=>this.toast("Aqu\xED no hay a qui\xE9n atacar. Guarda el acero para los Zarpas Grises.")),e("#a-explorar",()=>this.toast("Sobre la chimenea, la cabeza de toro que da nombre a la posada. En la pared, el escudo y las espadas de Corwin.")),e("#a-mochila",()=>{let t=Zt("#mochila");t.hidden=!t.hidden,Zt("#a-mochila").setAttribute("aria-pressed",String(!t.hidden)),this.showInventory()}),e("#mochila-cerrar",()=>{Zt("#mochila").hidden=!0,Zt("#a-mochila").setAttribute("aria-pressed","false")}),e("#a-descansar",()=>this.toast("Corwin os ofrece cama y cena. El descanso largo llegar\xE1 cuando termin\xE9is de hablar con la alcaldesa.")),e("#a-dado",()=>{let t=1+Math.floor(Math.random()*20);this.toast(`d20: ${t}${t===20?" \xB7 \xA1cr\xEDtico!":t===1?" \xB7 pifia":""}`),this.log(`Tirada de d20: <b>${t}</b>`)}),e("#a-historia",()=>{this.storyAt=Math.min(this.storyAt+1,bu.length-1),this.renderStory()}),e("#n-atras",()=>{this.storyAt=Math.max(this.storyAt-1,0),this.renderStory()}),e("#n-plegar",()=>{let t=Zt("#narrador");t.classList.toggle("plegado"),Zt("#n-plegar").setAttribute("aria-expanded",String(!t.classList.contains("plegado")))}),e("#a-centrar",()=>this.onCenter?.())}};var Al=new URLSearchParams(location.search),Lw=Al.has("captura"),Nw=Math.min(innerWidth,innerHeight)<700||/Android|iPhone|iPad/i.test(navigator.userAgent),Fw=(()=>{try{let i=document.createElement("canvas").getContext("webgl2"),e=i&&i.getExtension("WEBGL_debug_renderer_info");return/Intel|Vega \d|Radeon\(TM\) Graphics|Radeon Graphics|UHD|Iris|Mali|Adreno|PowerVR|Apple GPU|SwiftShader|llvmpipe|Microsoft Basic/i.test(e?i.getParameter(e.UNMASKED_RENDERER_WEBGL):"")}catch{return!1}})(),xu=Al.get("calidad")==="baja"||(Nw||Fw)&&Al.get("calidad")!=="alta",Or={shadows:!0,shadowMap:xu?512:1024,ao:!xu,msaa:!xu,pixelRatio:xu?1:Math.min(devicePixelRatio,1.6)},t_=matchMedia("(prefers-reduced-motion: reduce)").matches,Ln=new _u;Ai.onProgress=(i,e,t)=>Ln.progress(e/Math.max(t,1));var Rp=new Set,Cl=[],a_="Preparando la escena",Uw=Ai.itemStart.bind(Ai),kw=Ai.itemEnd.bind(Ai);Ai.itemStart=i=>{Rp.add(i),Uw(i)};Ai.itemEnd=i=>{Rp.delete(i),kw(i)};Ai.onError=i=>Cl.push(`no se pudo cargar ${i.slice(0,80)}`);var Ow=console.error.bind(console);console.error=(...i)=>{Cl.push(i.map(e=>e&&e.message||String(e)).join(" ").slice(0,160)),Ow(...i)};addEventListener("error",i=>Cl.push((i.message||"error").slice(0,160)));addEventListener("unhandledrejection",i=>Cl.push(String(i.reason?.message||i.reason).slice(0,160)));function vu(i){a_=i,Ln.stage(i)}var Bw=setTimeout(()=>{let i=e=>e.startsWith("data:")?e.slice(0,30)+"\u2026":e.split("/").slice(-2).join("/");Ln.stuck(`${a_}\u2026 est\xE1 tardando m\xE1s de lo normal.`,[...[...Rp].slice(0,4).map(e=>`Esperando: ${i(e)}`),...Cl.slice(-3)])},25e3),tr=document.getElementById("escena"),Ts=new Cr({canvas:tr,antialias:!1,powerPreference:"high-performance"});Ts.setPixelRatio(Or.pixelRatio);Ts.setSize(innerWidth,innerHeight,!1);Ts.toneMapping=ji;Ts.toneMappingExposure=1.55;Ts.shadowMap.enabled=!0;Ts.shadowMap.type=Sr;pg(Math.min(8,Ts.capabilities.getMaxAnisotropy()));var kr=new Us;kr.background=(()=>{let i=document.createElement("canvas");i.width=64,i.height=256;let e=i.getContext("2d"),t=e.createLinearGradient(0,0,0,256);t.addColorStop(0,"#120c0a"),t.addColorStop(.55,"#1c120d"),t.addColorStop(1,"#0a0605"),e.fillStyle=t,e.fillRect(0,0,64,256);let n=new Bi(i);return n.colorSpace=Tt,n})();var ns=new Yt(30,innerWidth/innerHeight,.5,80),Qs={target:new w(.05,.5,.45),az:Pt.degToRad(35),pol:Pt.degToRad(50),dist:18};function o_(){let i=innerWidth/innerHeight,e=Qs.dist*(i<1?1.55/Math.max(i,.45)*.62:i<1.4?1.12:1);ns.position.setFromSphericalCoords(e,Qs.pol,Qs.az).add(Qs.target),ns.lookAt(Qs.target)}o_();var cn=new zh(ns,tr);cn.target.copy(Qs.target);cn.enableDamping=!0;cn.dampingFactor=.08;cn.minDistance=7;cn.maxDistance=34;cn.minPolarAngle=Pt.degToRad(28);cn.maxPolarAngle=Pt.degToRad(66);cn.minAzimuthAngle=Pt.degToRad(-12);cn.maxAzimuthAngle=Pt.degToRad(82);cn.screenSpacePanning=!1;cn.mouseButtons={LEFT:di.ROTATE,MIDDLE:di.DOLLY,RIGHT:di.PAN};cn.addEventListener("change",()=>{cn.target.x=Pt.clamp(cn.target.x,-4,4),cn.target.z=Pt.clamp(cn.target.z,-3,3.5),cn.target.y=Pt.clamp(cn.target.y,.2,1.4)});var Hw=new $(innerWidth,innerHeight),zw=new qt(innerWidth*Or.pixelRatio,innerHeight*Or.pixelRatio,{type:Qt,samples:Or.msaa?4:0}),nr=new Vh(Ts,zw);nr.setPixelRatio(Or.pixelRatio);nr.addPass(new Wh(kr,ns));var wl=null;Or.ao&&(wl=new fl(kr,ns,innerWidth,innerHeight),wl.updateGtaoMaterial({radius:.45,distanceExponent:1.4,thickness:1.2,scale:1,samples:12}),wl.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12}),wl.blendIntensity=.7,nr.addPass(wl));var Gw=new Na(Hw,.42,.55,.92);nr.addPass(Gw);var Cp=new La({uniforms:{tDiffuse:{value:null},uTime:{value:0},uAspect:{value:innerWidth/innerHeight}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uAspect; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = vUv - 0.5; q.x *= uAspect * 0.75;
      float v = smoothstep(0.95, 0.25, length(q));
      c.rgb *= mix(0.45, 1.0, v);
      float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));
      c.rgb = mix(c.rgb, c.rgb * vec3(1.06, 0.98, 0.9), smoothstep(0.0, 0.6, l));
      c.rgb += (hash(vUv * 900.0 + uTime) - 0.5) * 0.012;
      gl_FragColor = c;
    }`});nr.addPass(Cp);nr.addPass(new jh);var Vw=(()=>{let i=document.createElement("canvas");i.width=i.height=128;let e=i.getContext("2d");e.strokeStyle="#fff",e.lineWidth=7,e.beginPath(),e.arc(64,64,52,0,Math.PI*2),e.stroke(),e.lineWidth=3,e.setLineDash([10,9]),e.beginPath(),e.arc(64,64,41,0,Math.PI*2),e.stroke();let t=new Bi(i);return t.colorSpace=Tt,t})();function Ww(i){let e=new at(new Mn(1,1),new $t({map:Vw,color:i,transparent:!0,opacity:.75,depthWrite:!1,blending:Bn,toneMapped:!1}));return e.rotation.x=-Math.PI/2,e.position.y=.02,e.renderOrder=2,e}var Rl=.75,n_=Rl*Math.sqrt(3)/2,qw=-Js.W/2+.45,i_=-Js.D/2+.45,Pl=[];for(let i=0;i*n_+i_<Js.D/2-.3;i++)for(let e=0;;e++){let t=qw+e*Rl+(i&1)*Rl/2;if(t>Js.W/2-.3)break;Pl.push({c:e,r:i,x:t,z:i_+i*n_,free:!0})}var Xw=(i,e)=>Pl.find(t=>t.c===i&&t.r===e);function jw(i){return(i.r&1?[[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[1,0],[-1,0],[-1,-1],[0,-1],[-1,1],[0,1]]).map(([n,s])=>Xw(i.c+n,i.r+s)).filter(Boolean)}function Su(i,e){let t=null,n=1/0;for(let s of Pl){let r=(s.x-i)**2+(s.z-e)**2;r<n&&(n=r,t=s)}return t}var Eu=new mt,Tl=(()=>{let i=new Wn,e=Rl/Math.sqrt(3)*.9;for(let n=0;n<6;n++){let s=Math.PI/6+n*Math.PI/3,r=[Math.cos(s)*e,Math.sin(s)*e];n===0?i.moveTo(...r):i.lineTo(...r)}let t=new at(new No(i),new $t({color:15777888,transparent:!0,opacity:.22,depthWrite:!1,toneMapped:!1}));return t.rotation.x=-Math.PI/2,t.position.y=.015,t.visible=!1,t})(),gi=[],Ja=[],l_=[],c_=new Map,er=null,Za=new Map,h_=new Map;function Kw(){for(let i of Pl)i.free=!f_.some(e=>Math.hypot(e.x-i.x,e.z-i.z)<e.r+.12),i.free&&(i.free=!Ja.some(e=>Math.hypot(e.root.position.x-i.x,e.root.position.z-i.z)<.5))}function Yw(i,e=12){let t=Su(i.root.position.x,i.root.position.z),n=gi.filter(a=>a!==i).map(a=>Su(a.root.position.x,a.root.position.z));t.free=!0;let s=new Map([[t,{d:0,prev:null}]]),r=[t];for(;r.length;){let a=r.shift(),o=s.get(a).d;if(!(o>=e))for(let l of jw(a))!l.free||s.has(l)||n.includes(l)||(s.set(l,{d:o+1,prev:a}),r.push(l))}return s}function Pp(){if(Eu.clear(),!er||!Ln.moveMode)return;Za=Yw(er);let i=Rl/Math.sqrt(3)*.9,e=[],t=[],n=12;for(let[r,a]of Za){let o=Math.max(0,1-a.d/(n+1))**1.6,l=[.95*o,.72*o,.4*o];for(let c=0;c<6;c++){let h=Math.PI/6+c*Math.PI/3,u=h+Math.PI/3;e.push(r.x+Math.cos(h)*i,.012,r.z+Math.sin(h)*i,r.x+Math.cos(u)*i,.012,r.z+Math.sin(u)*i),t.push(...l,...l)}}let s=new ot;s.setAttribute("position",new Ye(e,3)),s.setAttribute("color",new Ye(t,3)),Eu.add(new br(s,new Bs({vertexColors:!0,transparent:!0,opacity:.3,blending:Bn,depthWrite:!1,toneMapped:!1})))}function yu(i){er=i;for(let e of gi)e.ring.material.opacity=e===i?1:.45,e.ring.material.color.set(e===i?10285216:6270570);Ln.setSelected(i?i.def.id:null),Pp()}function u_(i){if(!er||!Za.has(i))return;let e=[];for(let s=i;s;s=Za.get(s).prev)e.unshift(s);e.shift();let t=e.map(s=>new w(s.x,0,s.z)),n=er;Eu.clear(),n.walkTo(t,()=>{let s=Ja.find(r=>r.def.quest);if(s){let r=s.root.position.x-n.root.position.x,a=s.root.position.z-n.root.position.z;n.root.rotation.y=Math.atan2(r,a)}n===er&&Pp()})}var Tp=new zo,s_=new $,Mu=null;function d_(i){let e=tr.getBoundingClientRect();s_.set((i.clientX-e.left)/e.width*2-1,-((i.clientY-e.top)/e.height)*2+1),Tp.setFromCamera(s_,ns);let t=Tp.intersectObjects(l_,!1)[0];if(t)return{ch:c_.get(t.object)};let n=new w;return Tp.ray.intersectPlane(new Un(new w(0,1,0),0),n)&&Math.abs(n.x)<Js.W/2&&Math.abs(n.z)<Js.D/2?{floor:n}:{}}tr.addEventListener("pointerdown",i=>{Mu=[i.clientX,i.clientY]});tr.addEventListener("pointerup",i=>{if(!Mu||Math.hypot(i.clientX-Mu[0],i.clientY-Mu[1])>6)return;let e=d_(i);if(e.ch)gi.includes(e.ch)?yu(e.ch):Ln.say(e.ch);else if(e.floor&&Ln.moveMode){let t=Su(e.floor.x,e.floor.z);t&&u_(t)}});tr.addEventListener("pointermove",i=>{if(!er||!Ln.moveMode){Tl.visible=!1;return}let e=d_(i);if(tr.style.cursor=e.ch?"pointer":"default",e.floor){let t=Su(e.floor.x,e.floor.z);Tl.visible=!!t&&Za.has(t),t&&Tl.position.set(t.x,.015,t.z)}else Tl.visible=!1});var f_=[];async function Jw(){vu("Montando la sala");let{blockers:i}=await Rg(kr,Or);f_=i,vu("Vistiendo a los personajes"),kr.add(Eu,Tl);let e=async(n,s)=>{let r=await Qb(n);kr.add(r.root),r.ring=Ww(s?6270570:14201434),r.ring.scale.setScalar(s?.95:.8),s||(r.ring.material.opacity=n.quest?.8:.35),r.ring.position.set(0,.02,0),r.root.add(r.ring);let a=new at(new Mt(.38,.38,1.8,8),new $t({transparent:!0,opacity:0,depthWrite:!1,colorWrite:!1}));return a.position.y=.9,c_.set(a,r),r.root.add(a),l_.push(a),h_.set(r,Ln.addLabel(n,s)),r};gi=await Promise.all(El.map(n=>e(n,!0))),Ja=await Promise.all(e_.map(n=>e(n,!1)));let t=[...gi,...Ja];for(let n of t){if(!n.def.lookAt)continue;let s=t.find(r=>r.def.id===n.def.lookAt);s&&(n.root.rotation.y=Math.atan2(s.root.position.x-n.root.position.x,s.root.position.z-n.root.position.z))}Kw(),vu("Pintando los retratos");for(let n of gi)n.mixer.update(.01);kr.updateMatrixWorld(!0);try{Ln.setPortraits(await Zw(gi))}catch(n){console.error("retratos",n)}vu("Encendiendo la chimenea"),Ln.onSelect=n=>yu(gi.find(s=>s.def.id===n)),Ln.onMoveMode=()=>Pp(),Ln.onCenter=()=>{Qs.dist=18,o_(),cn.target.copy(Qs.target)},yu(gi[0]),clearTimeout(Bw),Ln.ready(),Al.has("depurar")&&(window.__mdg={party:gi,npcs:Ja,cells:Pl,reach:()=>Za,moveSelectedTo:u_,select:yu,camera:ns})}async function Zw(i){let n=new Cr({antialias:!0,alpha:!0,preserveDrawingBuffer:!0});n.setSize(168,200),n.toneMapping=ji,n.toneMappingExposure=1.15;let s={};for(let r of i){let a=new Us,o=Fa(r.root);o.position.set(0,0,0),o.rotation.set(0,0,0),o.traverse(f=>{f.isLight&&(f.intensity=0),(f.isSprite||f.isPoints)&&(f.visible=!1),f.material&&f.material.colorWrite===!1&&(f.visible=!1),f.geometry&&f.geometry.type==="PlaneGeometry"&&f.material&&f.material.blending===Bn&&(f.visible=!1)}),a.add(o),o.updateMatrixWorld(!0);let l=o.getObjectByName("Head").getWorldPosition(new w),c=new vn(16765600,3.2);c.position.set(1.2,l.y+1.2,2.2);let h=new vn(7309e3,1.1);h.position.set(-2,l.y+.5,.5);let u=new vn(16754784,2.4);u.position.set(-.6,l.y+1,-2.5),a.add(c,h,u,new Bo(2760752,1.2));let d=new Yt(24,168/200,.05,10);d.position.set(.22,l.y+.06,.95),d.lookAt(0,l.y-.03,0),n.render(a,d),s[r.def.id]=n.domElement.toDataURL("image/png")}return n.dispose(),s}var Ap=new Mr,r_=0;function p_(){Ap.update();let i=Math.min(Ap.getDelta(),.05),e=Ap.getElapsed();for(let t of gi)t.update(i);for(let t of Ja)t.update(i);wg(t_?0:e,i);for(let t of gi)t===er&&(t.ring.rotation.z=t_?0:e*.6);if(cn.update(),Cp.uniforms.uTime.value=e,nr.render(i),Ln.placeLabels(h_,ns,tr),r_++,Lw&&r_>=(+Al.get("captura")||4)){document.title="listo";return}requestAnimationFrame(p_)}addEventListener("resize",()=>{ns.aspect=innerWidth/innerHeight,ns.updateProjectionMatrix(),Ts.setSize(innerWidth,innerHeight,!1),nr.setSize(innerWidth,innerHeight),Cp.uniforms.uAspect.value=innerWidth/innerHeight});Jw().then(()=>requestAnimationFrame(p_)).catch(i=>{console.error(i),Ln.fail(i),document.title="error "+i.message});
