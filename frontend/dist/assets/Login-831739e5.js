var n=(g,p,t)=>new Promise((h,o)=>{var s=a=>{try{i(t.next(a))}catch(r){o(r)}},b=a=>{try{i(t.throw(a))}catch(r){o(r)}},i=a=>a.done?h(a.value):Promise.resolve(a.value).then(s,b);i((t=t.apply(g,p)).next())});import{c as D,j as v,f as L,r as E,b as e,g as P,B as l,P as T,h as V,T as u,L as f,i as x,d as c,D as U}from"./index-6bb394a5.js";import{c as y,a as N,u as w,F as C,C as I,G as S,b as B,L as W}from"./index.esm-f2673beb.js";import{A as F}from"./Alert-44140bca.js";import{T as _}from"./TextField-0e5af3e0.js";import{G as d}from"./Grid-dcc77fb6.js";const A=D(v.jsx("path",{d:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2M9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9zm9 14H6V10h12zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2"}),"LockOutlined"),G=y({email:N().email("Enter a valid email").required("Email is required"),password:N().min(6,"Password should be of minimum 6 characters length").required("Password is required")}),z=()=>{const{login:g,googleLogin:p,facebookLogin:t,linkedinLogin:h,error:o,isLoading:s}=L(),[b,i]=E.useState(!1),a=w({initialValues:{email:"",password:""},validationSchema:G,onSubmit:m=>n(void 0,null,function*(){yield g(m.email,m.password)})}),r=()=>n(void 0,null,function*(){yield p()}),k=()=>n(void 0,null,function*(){yield t()}),j=()=>n(void 0,null,function*(){yield h()});return e.jsxDEV(P,{component:"main",maxWidth:"xs",children:e.jsxDEV(l,{sx:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh"},children:e.jsxDEV(T,{elevation:3,sx:{p:4,width:"100%",borderRadius:2},children:[e.jsxDEV(l,{sx:{display:"flex",flexDirection:"column",alignItems:"center",mb:3},children:[e.jsxDEV(V,{sx:{m:1,bgcolor:"primary.main"},children:e.jsxDEV(A,{},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:87,columnNumber:15},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:86,columnNumber:13},globalThis),e.jsxDEV(u,{component:"h1",variant:"h5",fontWeight:"bold",children:"Sign in"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:89,columnNumber:13},globalThis),e.jsxDEV(u,{variant:"body2",color:"text.secondary",align:"center",sx:{mt:1},children:"Welcome back! Please login to your account."},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:92,columnNumber:13},globalThis)]},void 0,!0,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:78,columnNumber:11},globalThis),o&&e.jsxDEV(F,{severity:"error",sx:{mb:2},children:o},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:98,columnNumber:13},globalThis),e.jsxDEV(l,{component:"form",onSubmit:a.handleSubmit,sx:{mt:1},children:[e.jsxDEV(_,{margin:"normal",fullWidth:!0,id:"email",label:"Email Address",name:"email",autoComplete:"email",value:a.values.email,onChange:a.handleChange,onBlur:a.handleBlur,error:a.touched.email&&!!a.errors.email,helperText:a.touched.email&&a.errors.email,disabled:s},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:104,columnNumber:13},globalThis),e.jsxDEV(_,{margin:"normal",fullWidth:!0,name:"password",label:"Password",type:"password",id:"password",autoComplete:"current-password",value:a.values.password,onChange:a.handleChange,onBlur:a.handleBlur,error:a.touched.password&&!!a.errors.password,helperText:a.touched.password&&a.errors.password,disabled:s},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:118,columnNumber:13},globalThis),e.jsxDEV(l,{sx:{display:"flex",alignItems:"center",justifyContent:"space-between",mt:1},children:[e.jsxDEV(C,{control:e.jsxDEV(I,{value:"remember",color:"primary",checked:b,onChange:m=>i(m.target.checked)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:143,columnNumber:19},globalThis),label:"Remember me"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:141,columnNumber:15},globalThis),e.jsxDEV(f,{component:x,to:"/forgot-password",variant:"body2",children:"Forgot password?"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:152,columnNumber:15},globalThis)]},void 0,!0,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:133,columnNumber:13},globalThis),e.jsxDEV(c,{type:"submit",fullWidth:!0,variant:"contained",sx:{mt:3,mb:2,py:1.5},disabled:s,children:s?"Signing in...":"Sign In"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:156,columnNumber:13},globalThis),e.jsxDEV(U,{sx:{my:2},children:e.jsxDEV(u,{variant:"body2",color:"text.secondary",children:"OR"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:167,columnNumber:15},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:166,columnNumber:13},globalThis),e.jsxDEV(d,{container:!0,spacing:2,children:[e.jsxDEV(d,{item:!0,xs:4,children:e.jsxDEV(c,{fullWidth:!0,variant:"outlined",startIcon:e.jsxDEV(S,{},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:177,columnNumber:30},globalThis),onClick:r,disabled:s,sx:{py:1},children:"Google"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:174,columnNumber:17},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:173,columnNumber:15},globalThis),e.jsxDEV(d,{item:!0,xs:4,children:e.jsxDEV(c,{fullWidth:!0,variant:"outlined",startIcon:e.jsxDEV(B,{},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:189,columnNumber:30},globalThis),onClick:k,disabled:s,sx:{py:1},children:"Facebook"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:186,columnNumber:17},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:185,columnNumber:15},globalThis),e.jsxDEV(d,{item:!0,xs:4,children:e.jsxDEV(c,{fullWidth:!0,variant:"outlined",startIcon:e.jsxDEV(W,{},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:201,columnNumber:30},globalThis),onClick:j,disabled:s,sx:{py:1},children:"LinkedIn"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:198,columnNumber:17},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:197,columnNumber:15},globalThis)]},void 0,!0,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:172,columnNumber:13},globalThis),e.jsxDEV(l,{sx:{mt:2,textAlign:"center"},children:e.jsxDEV(u,{variant:"body2",children:["Don't have an account?"," ",e.jsxDEV(f,{component:x,to:"/register",variant:"body2",children:"Sign Up"},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:214,columnNumber:17},globalThis)]},void 0,!0,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:212,columnNumber:15},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:211,columnNumber:13},globalThis)]},void 0,!0,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:103,columnNumber:11},globalThis)]},void 0,!0,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:70,columnNumber:9},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:61,columnNumber:7},globalThis)},void 0,!1,{fileName:"/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/frontend/src/pages/auth/Login.tsx",lineNumber:60,columnNumber:5},globalThis)};export{z as default};
//# sourceMappingURL=Login-831739e5.js.map
