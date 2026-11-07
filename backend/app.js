import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path:path.join(here,'.env')});
export const app=express();
const root=path.resolve(here,'..');
const allowedOrigin=(process.env.ALLOWED_ORIGIN||'https://codak-agency.online').replace(/\/$/,'');
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(cors({origin:allowedOrigin,methods:['GET','POST'],allowedHeaders:['Content-Type','X-Telegram-Bot-Api-Secret-Token']}));
app.use(express.json({limit:'10kb'}));
app.get('/api/health',(_req,res)=>res.json({success:true,status:'ok'}));
const orderLimit=rateLimit({windowMs:15*60*1000,max:5,standardHeaders:true,legacyHeaders:false,message:{success:false,error:'Too many requests. Please try again later.'}});
const clean=(value,max)=>String(value??'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
app.post('/api/order',orderLimit,async(req,res)=>{
  try{
    if(clean(req.body?.website,200))return res.json({success:true});
    const name=clean(req.body?.name,100);
    const phone=clean(req.body?.phone,24);
    const service=clean(req.body?.service,120);
    const budget=clean(req.body?.budget,80);
    const email=clean(req.body?.email,254);
    const details=clean(req.body?.message,1000);
    const general=service==='General inquiry';
    const validPhone=phone==='Not provided'||/^[+\d][\d\s().-]{7,23}$/.test(phone);
    if(name.length<2||!validPhone||service.length<2||budget.length<2||email&&!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({success:false,error:'Please check the submitted fields.'});
    if(!process.env.BOT_TOKEN||!process.env.ADMIN_CHAT_ID)return res.status(503).json({success:false,error:'Service unavailable.'});
    const timestamp=new Intl.DateTimeFormat('ar-EG',{timeZone:'Africa/Cairo',dateStyle:'medium',timeStyle:'short'}).format(new Date());
    const lines=['طلب جديد من موقع Codak',`الاسم: ${name}`,`الواتساب: ${phone}`,`الخدمة: ${service}`,`الميزانية: ${budget}`,`التوقيت: ${timestamp} (القاهرة)`];
    if(email)lines.push(`البريد الإلكتروني: ${email}`);
    if(details)lines.push(`التفاصيل: ${details}`);
    const telegram=await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.ADMIN_CHAT_ID,text:lines.join('\n')})});
    if(!telegram.ok)return res.status(502).json({success:false,error:'Could not deliver the request.'});
    return res.json({success:true,message:'Request received.'});
  }catch{return res.status(500).json({success:false,error:'Request could not be processed.'})}
});
app.post('/api/telegram/webhook',(req,res)=>{
  res.sendStatus(200);
  const message=req.body?.message;
  if(message?.text?.trim().startsWith('/start')&&process.env.BOT_TOKEN){
    fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:message.chat.id,text:'أهلاً بك في Codak Agency! نصمم ونطور المواقع الإلكترونية والمتاجر وأنظمة الحجز والمنصات الرقمية، مع التركيز على السرعة وتجربة المستخدم وتهيئة محركات البحث. يسعدنا مساعدتك في مشروعك.'})}).catch(()=>{});
  }
});
app.use('/api',(_req,res)=>res.status(404).json({success:false,error:'Not found.'}));
app.get('/',(_req,res)=>res.sendFile(path.join(root,'index.html')));
app.get(/^\/(en|ar|fr|es|de)\/(services|work|about|team|portfolio)\/?$/,(req,res)=>{
 const match=req.path.match(/^\/(en|ar|fr|es|de)\/(services|work|about|team|portfolio)\/?$/);
 const anchors={services:'services',work:'work',about:'team',team:'team',portfolio:'work'};
 res.redirect(302,`/${match[1]}/#${anchors[match[2]]}`);
});
app.use('/css',express.static(path.join(root,'css')));
app.use('/js',express.static(path.join(root,'js')));
app.use(express.static(path.join(root,'site'),{extensions:['html']}));
app.use(express.static(path.join(root,'public')));
app.get('*',(req,res)=>{
 const lang=['en','ar','fr','es','de'].includes(req.path.split('/').filter(Boolean)[0])?req.path.split('/').filter(Boolean)[0]:'en';
 res.status(404).sendFile(path.join(root,'site',lang,'index.html'));
});
