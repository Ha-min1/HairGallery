(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[516],{2067:e=>{"use strict";e.exports=require("node:async_hooks")},6195:e=>{"use strict";e.exports=require("node:buffer")},3353:(e,r,t)=>{"use strict";t.r(r),t.d(r,{ComponentMod:()=>g,default:()=>N});var a={};t.r(a),t.d(a,{GET:()=>m,runtime:()=>p});var s={};t.r(s),t.d(s,{originalPathname:()=>f,patchFetch:()=>E,requestAsyncStorage:()=>_,routeModule:()=>l,serverHooks:()=>h,staticGenerationAsyncStorage:()=>v});var n=t(932),i=t(2561),o=t(4828),u=t(6631),d=t(9985),c=t(8621);let p="edge";async function m(e){try{let e=(0,c.N)(),{data:r,error:t}=await e.from("reservations").select(`
        id,
        customer_name,
        customer_phone,
        date,
        time,
        status,
        services (
          name,
          price
        )
      `).order("date",{ascending:!1}).order("time",{ascending:!1});if(t)return d.xk.json({error:t.message},{status:500});let a=(r||[]).map(e=>({id:e.id,customerName:e.customer_name,customerPhone:e.customer_phone,serviceName:e.services?.name||"Custom Styling",price:e.services?.price||0,date:e.date,time:e.time,status:e.status}));return d.xk.json({reservations:a})}catch(e){return d.xk.json({error:e.message},{status:500})}}let l=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/reservations/route",pathname:"/api/admin/reservations",filename:"route",bundlePath:"app/api/admin/reservations/route"},resolvedPagePath:"/workspaces/HairGallery/the-hair-gallery-nextjs/app/api/admin/reservations/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:_,staticGenerationAsyncStorage:v,serverHooks:h}=l,f="/api/admin/reservations/route";function E(){return(0,u.XH)({serverHooks:h,staticGenerationAsyncStorage:v})}let g=s,N=n.a.wrap(l)},8621:(e,r,t)=>{"use strict";t.d(r,{N:()=>o});var a=t(6181);let s="https://wnfeakgtdsipwdllvbmn.supabase.co",n="sb_publishable_CiTmY0lmx_hCeIOdhUn-1Q_GXWz6H63";if(!s||!n)throw Error("Missing Supabase credentials. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.");let i=(0,a.eI)(s,n);function o(){return i}}},e=>{var r=r=>e(e.s=r);e.O(0,[835],()=>r(3353));var t=e.O();(_ENTRIES="undefined"==typeof _ENTRIES?{}:_ENTRIES)["middleware_app/api/admin/reservations/route"]=t}]);
//# sourceMappingURL=route.js.map