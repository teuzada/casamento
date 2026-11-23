"use strict";
const crypto=require("node:crypto");
module.exports=async function handler(req,res){res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Allow","POST");if(req.method!=="POST")return res.status(405).json({error:"Método não permitido."});const password=process.env.RSVP_ADMIN_PASSWORD,secret=process.env.RSVP_WEBHOOK_SECRET,url=process.env.RSVP_SHEETS_WEBHOOK_URL;if(!password||!secret||!url)return res.status(503).json({error:"Painel aguardando configuração segura."});let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  } catch {
    return res.status(400).json({error:"Solicitação inválida."});
  }
  body = body || {};
  const supplied=typeof body.password==="string"?body.password:"";const a=Buffer.from(password),b=Buffer.from(supplied);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:"Senha incorreta."});try{const response=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({secret,action:"list"}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error("Erro ao consultar planilha");const data=await response.json();if(!data||data.ok!==true||!Array.isArray(data.rows))throw Error("Resposta inválida");return res.status(200).json({rows:data.rows})}catch(err){console.error("RSVP admin",err.message);return res.status(502).json({error:"Não foi possível consultar a lista agora."})}};
