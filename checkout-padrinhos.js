(()=>{
"use strict";
const cfg=window.WEDDING_CONFIG;
const $=id=>document.getElementById(id);
const money=n=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const min=Number(cfg.godparentsMinimum)||1200;
const grid=$("gift-options"),custom=$("custom-amount"),checkout=$("checkout"),notice=$("checkout-notice");
let selected=null;
function choose(amount) {
  selected=amount;
  $("checkout-name").textContent="Presente especial dos padrinhos";
  $("checkout-price").textContent=money(amount);
  checkout.classList.remove("hidden");
  notice.textContent="";
  checkout.scrollIntoView({behavior:"smooth",block:"center"});
}
for(const amount of cfg.godparentsAmounts.filter(n=>Number.isFinite(n)&&n>=min)){
 const button=document.createElement("button");button.type="button";button.className="gift-option";
 const price=document.createElement("strong");price.textContent=money(amount);
 const description=document.createElement("span");description.textContent="Um carinho para nosso primeiro lar";
 button.append(price,description);
 button.addEventListener("click",()=>{custom.value="";grid.querySelectorAll(".gift-option").forEach(b=>b.classList.remove("selected"));button.classList.add("selected");choose(amount)});
 grid.appendChild(button);
}
custom.addEventListener("change",()=>{
 const amount=Number(custom.value);
 if(!Number.isFinite(amount)||amount<min||amount>100000){notice.textContent="Escolha um valor entre "+money(min)+" e R$ 100.000,00.";return;}
 grid.querySelectorAll(".gift-option").forEach(b=>b.classList.remove("selected"));
 choose(amount);
});
async function pay(method){
 if(selected===null){notice.textContent="Escolha o valor do presente primeiro.";return;}
 const buttons=[$("choose-pix"),$("choose-card")];
 buttons.forEach(b=>b.disabled=true);
 notice.textContent="Preparando seu pagamento seguro...";
 try{
  const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"padrinhos",method,giftId:null,customAmountCents:Math.round(selected*100)})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.url)throw new Error(result.error||"Não foi possível gerar o pagamento.");
  const link=new URL(result.url);
  if(link.protocol!=="https:"||!/^(?:[a-z0-9-]+\.)*infinitepay\.(?:io|com\.br)$/.test(link.hostname))throw new Error("A InfinitePay retornou um link de pagamento inesperado.");
  window.location.assign(link.href);
 }catch(error){
  notice.textContent=error.message||"Não foi possível iniciar o pagamento.";
  buttons.forEach(b=>b.disabled=false);
 }
}
$("choose-pix").addEventListener("click",()=>pay("pix"));
$("choose-card").addEventListener("click",()=>pay("credit_card"));
})();
