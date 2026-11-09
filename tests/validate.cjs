// Testes de regressão de parcelas-base, a partir das tabelas de imóveis fornecidas.
// Valores nominais, sem reajustes. Não validam lances ou contemplação.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const plan=html.match(/const tabelaPlanos\s*=\s*(\{[\s\S]*?\});\s*function atualizarTabelaUnifisa/);
assert.ok(plan,'Cadastro de planos não encontrado');
const tabela=Function('"use strict";return ('+plan[1]+')')();
function parcelaBase(credito,prazo,adm,ant,reducao=1){
 const fundo=2.5,seguro=0.03;
 const mensalSeguro=credito*(1+(adm+fundo)/100)*seguro/100;
 return credito*(1+(adm+fundo)/100)/prazo*reducao+mensalSeguro-credito*ant/100/prazo;
}
const casos=[
 ['alphaPlus',300000,200,1887.75],
 ['betha',300000,200,1949.55],
 ['gamma',300000,200,1996.35],
 ['omega50',300000,200,1015.80],
 ['delta50',300000,200,1047.60],
 ['betha',150000,200,974.78]
];
for(const [id,credito,prazo,esperado] of casos){
 const p=tabela.imovel[id],i=p.prazos.indexOf(prazo);
 assert.ok(i>=0,'Prazo ausente: '+id);
 const real=parcelaBase(credito,prazo,p.adm[i],p.antecipacao,p.reducao||1);
 assert.ok(Math.abs(real-esperado)<=0.011,id+': esperado '+esperado+' obtido '+real);
 console.log('OK',id,credito,prazo,real.toFixed(2));
}
assert.match(html,/Gamma 12 não localizada/);
assert.match(html,/condição personalizada \(não homologada\)/);
assert.match(html,/PDF disponível apenas para tabelas de imóveis conferidas/);
console.log('6 referências e 3 salvaguardas verificadas.');
