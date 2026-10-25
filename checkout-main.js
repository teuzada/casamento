(()=>{
"use strict";
const cfg = window.WEDDING_CONFIG;
const gifts = Array.isArray(window.WEDDING_GIFTS) ? window.WEDDING_GIFTS : [];
const $ = id => document.getElementById(id);
const money = value => Number(value).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const grid=$("gift-options"), search=$("gift-search"), category=$("gift-category"), count=$("gift-count");
const checkout=$("checkout"), custom=$("custom-amount"), notice=$("checkout-notice");
let selected=null;
const min=Number(cfg.generalMinimum)||200;
for(const name of [...new Set(gifts.map(g=>g.category))]){
  const option=document.createElement("option");option.value=name;option.textContent=name;category.appendChild(option);
}
function selectGift(choice) {
  selected=choice;
  $("checkout-name").textContent=choice.name;
  $("checkout-price").textContent=money(choice.price);
  checkout.classList.remove("hidden");
  notice.textContent="";
  checkout.scrollIntoView({behavior:"smooth",block:"center"});
}
function render() {
  const term=search.value.trim().toLocaleLowerCase("pt-BR");
  const filtered=gifts.filter(g=>(!category.value||g.category===category.value)&&(!term||(g.name+" "+g.category).toLocaleLowerCase("pt-BR").includes(term)));
  grid.replaceChildren();
  count.textContent=filtered.length+" de "+gifts.length+" presentes";
  for(const gift of filtered) {
    const button=document.createElement("button");button.type="button";button.className="gift-option"+(selected&&selected.giftId===gift.id?" selected":"");
    const price=document.createElement("strong");price.textContent=money(gift.price);
    const name=document.createElement("span");name.className="gift-name";name.textContent=gift.name;
    const group=document.createElement("span");group.className="gift-category";group.textContent=gift.category;
    button.append(price,name,group);
    button.addEventListener("click",()=>{custom.value="";selectGift({giftId:gift.id,name:gift.name,price:gift.price});render()});
    grid.appendChild(button);
  }
}
search.addEventListener("input",render);
category.addEventListener("change",render);
custom.addEventListener("change",()=>{
  const amount=Number(custom.value);
  if(!Number.isFinite(amount)||amount<min||amount>100000){
    notice.textContent="Escolha um valor entre "+money(min)+" e R$ 100.000,00.";
    return;
  }
  selectGift({giftId:null,name:"Contribuição para nosso primeiro lar",price:amount});
  render();
});
async function pay(method) {
  if(!selected){notice.textContent="Escolha um presente primeiro.";return;}
  const buttons=[$("choose-pix"),$("choose-card")];
  buttons.forEach(b=>b.disabled=true);
  notice.textContent="Preparando o pagamento seguro...";
  try {
    const payload={method,giftId:selected.giftId};
    if(selected.giftId===null)payload.customAmountCents=Math.round(selected.price*100);
    const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.url)throw new Error(result.error||"Não foi possível criar o pagamento.");
    const url=new URL(result.url);
    if(url.protocol!=="https:"||url.hostname!=="checkout.infinitepay.com.br")throw new Error("Link de pagamento inválido.");
    window.location.assign(url.href);
  }catch(error){
    notice.textContent=error.message||"Não foi possível acessar o pagamento. Tente novamente.";
    buttons.forEach(b=>b.disabled=false);
  }
}
$("choose-pix").addEventListener("click",()=>pay("pix"));
$("choose-card").addEventListener("click",()=>pay("credit_card"));
render();
})();
