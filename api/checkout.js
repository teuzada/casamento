"use strict";
const crypto = require("node:crypto");
const gifts = require("./gift-catalog.json");

const HANDLE = "mateus-luis-g5z";
const MINIMUM_CENTS = 20000;
const MAXIMUM_CENTS = 10000000;
const API_ENDPOINT = "https://api.checkout.infinitepay.io/links";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "POST");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({error:"Método não permitido."});
  if (!process.env.INFINITEPAY_API_KEY) return res.status(503).json({error:"O cartão e o Pix integrado ainda estão sendo ativados. Tente novamente mais tarde."});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || (body.method !== "credit_card" && body.method !== "pix"))
      return res.status(400).json({error:"Forma de pagamento inválida."});
    let amountCents, description;
    if (typeof body.giftId === "string" && body.giftId !== "") {
      const gift = gifts.find(g => g.id === body.giftId);
      if (!gift) return res.status(400).json({error:"Presente não encontrado."});
      amountCents = Math.round(Number(gift.price) * 100);
      description = "Presente de casamento - " + gift.name;
    } else if (body.giftId === null && Number.isInteger(body.customAmountCents)) {
      amountCents = body.customAmountCents;
      description = "Contribuição para nosso primeiro lar";
    } else {
      return res.status(400).json({error:"Selecione um presente válido."});
    }
    if (!Number.isSafeInteger(amountCents) || amountCents < MINIMUM_CENTS || amountCents > MAXIMUM_CENTS)
      return res.status(400).json({error:"Escolha um valor entre R$ 200 e R$ 100.000."});
    const order_nsu = "casamento-" + crypto.randomUUID();
    const payload = {
      handle: HANDLE,
      order_nsu,
      items:[{quantity:1,price:amountCents,description:description.slice(0,140)}],
      options:{
        assured_installments:0,
        require_delivery_address:false,
        single_payment:true,
        payment_methods_enabled:body.method === "pix" ? ["pix"] : ["credit_card"]
      }
    };
    const response = await fetch(API_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Api-Key":process.env.INFINITEPAY_API_KEY},
      body:JSON.stringify(payload),
      signal:AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      console.error("InfinitePay checkout creation failed",response.status,(await response.text()).slice(0,350));
      return res.status(502).json({error:"Não foi possível iniciar o pagamento. Tente novamente em instantes."});
    }
    const result = await response.json();
    let destination;
    try { destination = new URL(result.url); } catch (_) {}
    if (!destination || destination.protocol !== "https:" || !/^(checkout|buy|pay)\.infinitepay\.(io|com\.br)$/.test(destination.hostname))
      { console.error("InfinitePay returned unexpected checkout host",destination?.hostname||"missing-url",Object.keys(result||{})); return res.status(502).json({error:"A InfinitePay retornou um endereço não reconhecido. Confira os logs da Vercel."}); }
    return res.status(200).json({url:destination.href});
  } catch (error) {
    console.error("Checkout integration error",error && error.message);
    return res.status(502).json({error:"Não foi possível conectar à InfinitePay neste momento."});
  }
};
