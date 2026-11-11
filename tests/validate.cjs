// Testes de regressão de parcelas-base, a partir das tabelas de imóveis fornecidas.
// Valores nominais, sem reajustes. Não validam lances ou contemplação.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const plan=html.match(/const tabelaPlanos\s*=\s*(\{[\s\S]*?\});\s*function preencherOpcoesTabela/);
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
assert.deepEqual(Array.from(tabela.imovel.gamma12.adm),Array.from(tabela.imovel.gamma.adm));
assert.equal(tabela.imovel.delta.antecipacao,0);
assert.equal(tabela.imovel.delta.adm[tabela.imovel.delta.prazos.indexOf(60)],15);
assert.match(html,/condição personalizada \(não homologada\)/);
assert.doesNotMatch(html,/gerarPropostaPDF|nomeClientePDF|Salvar esta simulação em PDF/);
assert.match(html,/function gerarLinkConsultor\(\)/);
console.log('6 referências e salvaguardas de compartilhamento verificadas.');

// Revisão funcional: fórmulas de financiamento, campos de interface e envio.
const vm=require('node:vm');
const financiamento=html.match(/function calcularFinanciamento\([\s\S]*?\n        }\n        function calcular\(/);
assert.ok(financiamento,'Função de financiamento não encontrada');
const ctx=vm.createContext({});
vm.runInContext(financiamento[0].replace(/\n        function calcular\($/,''),ctx);
const sim=ctx.calcularFinanciamento;
function perto(real,esperado,tol=0.02){assert.ok(Math.abs(real-esperado)<=tol,'Esperado '+esperado+', recebido '+real);}
for(const sistema of ['sac','price']){
 const zero=sim(120000,0,120,sistema,0);
 perto(zero.primeira,1000);perto(zero.ultima,1000);perto(zero.total,120000);perto(zero.juros,0);
 const caso=sim(240000,12,360,sistema,0);
 assert.ok(caso.total>240000 && caso.juros>0,'Juros positivos: '+sistema);
 perto(caso.total,240000+caso.juros);
 if(sistema==='sac')assert.ok(caso.primeira>caso.ultima,'SAC decrescente');
 else perto(caso.primeira,caso.ultima);
}
const sac=sim(240000,12,360,'sac',0);
const price=sim(240000,12,360,'price',0);
assert.ok(sac.total<price.total,'SAC deve ter juros totais menores nas mesmas condições');
assert.deepEqual(Object.keys(sim(0,12,360,'sac')).sort(),['juros','primeira','total','ultima']);
for(const id of ['produto','credito','prazoConsorcio','prazoFin','entradaPct','sistemaFin','bancoFin','bancoAuto','indiceOficial','resultadoIndice','valCustoBanco','telefoneBotao','linkGerado']){
 assert.ok(html.includes('id="'+id+'"'),'Campo ausente: '+id);
}
assert.match(html,/function enviarWhatsApp\(\)/);
assert.match(html,/https:\/\/wa\.me\/'\+consultorAtual\.numero/);
assert.match(html,/encodeURIComponent\(textoProposta\(\)\)/);
assert.match(html,/contemplação não é garantida/i);
assert.match(html,/Os bancos possuem encargos e taxas\. Consulte o seu banco para ter uma precisão melhor\./);
assert.doesNotMatch(html,/id="painelReajusteFin"|id="encargosAutomaticos"|id="valEncargosFin"/);
console.log('Financiamento SAC/Price, campos, aviso e WhatsApp: verificações estáticas e matemáticas OK.');

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'./');
assert.ok(manifest.icons.some(icon=>icon.src==='./icon-192.png'&&icon.sizes==='192x192'));
assert.ok(manifest.icons.some(icon=>icon.src==='./icon-512.png'&&icon.sizes==='512x512'));
assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest"/);
assert.match(html,/serviceWorker\.register\('\.\/sw\.js'\)/);
assert.ok(fs.existsSync('sw.js')&&fs.existsSync('icon.svg'));
for(const size of [192,512,180])assert.ok(fs.existsSync('icon-'+size+'.png'),'Ícone PNG ausente: '+size);
console.log('Manifesto PWA, ícone e service worker presentes; versão desktop preservada.');

assert.match(html,/id="botaoInstalarPWA"/);
assert.match(html,/rel="apple-touch-icon" href="\.\/icon-180\.png"/);

assert.doesNotMatch(html,/atualizarPerfilEncargosBanco/,'Não chamar função de encargos removida');
assert.match(html,/if\(el\)el\.addEventListener\('change',calcular\)/);
console.log('Troca de bancos sem chamadas obsoletas verificada.');

assert.ok(tabela.auto.gamma30,'Gamma 30% precisa existir em automóveis');
assert.deepEqual(Array.from(tabela.auto.gamma30.prazos),[100,80,60]);
assert.equal(tabela.auto.gamma30.reducao,0.7);
assert.match(html,/if\(!plano\)\{[^}]*calcular\(\);return;\}/);
assert.match(html,/el\.addEventListener\('input',aplicarTabelaUnifisa\)/);
assert.match(html,/document\.getElementById\('prazoFin'\)\.addEventListener\('input', calcular\)/);
console.log('Gamma 30%, atualização imediata e recálculo do financiamento verificados.');

assert.match(html,/document\.addEventListener\('DOMContentLoaded',preencherOpcoesTabela\)/);
for(const key of ['betha','alphaPlus','gamma','omega50','delta50'])assert.ok(tabela.imovel[key],'Plano imobiliário ausente: '+key);
console.log('Inicialização independente e planos de imóveis conferidos.');
