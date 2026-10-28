// Massa de dados para a gravação do vídeo: exercita TODAS as rotas do backend (pelo Kong) e a Lambda de
// autenticação com clientes inventados, para o New Relic (APM, dashboard, logs) ter tráfego para mostrar.
//
// Pré-requisitos: Node 18+, credenciais do Learner Lab em ~/.aws/credentials (a conta onde o ambiente subiu) e
//   aws eks update-kubeconfig --name oficina-mecnica-lab-cluster --region us-east-1
//
// Uso:
//   node massa-dados-backend.js                 20 OS com clientes inventados
//   node massa-dados-backend.js 40              40 OS
//   node massa-dados-backend.js 10 15           lotes de 10 OS repetidos por 15 minutos (gráficos "ao vivo")
//
// Opcional (pula a descoberta pela AWS): KONG_URL, LAMBDA_URL, ADMIN_PASSWORD, NAMESPACE (padrão prod).
// CENARIO=<nome> força um dos cenários abaixo em todas as OS.
//
// Cada OS segue um cenário sorteado:
//   completo        admin aprova -> FINALIZADA -> ENTREGUE
//   cliente-aprova  diagnóstico -> cliente aprova pela rota pública (token da Lambda) -> FINALIZADA
//   cliente-recusa  cliente recusa o orçamento pela rota pública -> RECUSADA
//   em-execucao     admin aprova e a OS fica EM_EXECUCAO
//   aguardando      fica AGUARDANDO_APROVACAO
// e em toda OS: login por CPF na Lambda, consulta pública com token, sem token (401) e com token adulterado (401).
const { execSync } = require('child_process');

const QTD = Number(process.argv[2] || 20);
const MINUTOS = Number(process.argv[3] || 0);
const NAMESPACE = process.env.NAMESPACE || 'prod';

const sh = c => execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// ---------- descoberta do ambiente ----------
function kongUrl() {
  if (process.env.KONG_URL) return process.env.KONG_URL.replace(/\/$/, '');
  const elb = sh(`kubectl get svc -n kong kong-kong-proxy -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"`);
  if (!elb) throw new Error('LoadBalancer do Kong sem endereço (o oficina-mvp-infra-iac subiu?)');
  return 'http://' + elb;
}
function lambdaUrl() {
  if (process.env.LAMBDA_URL) return process.env.LAMBDA_URL;
  const api = sh(`aws apigatewayv2 get-apis --region us-east-1 --query "Items[?Name=='oficina-auth-function-api'].ApiEndpoint | [0]" --output text`);
  if (!api || api === 'None') throw new Error('API Gateway da Lambda não encontrado (a oficina-auth-function subiu?)');
  return api + '/authenticate';
}
function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const b64 = sh(`kubectl get secret app-secrets -n ${NAMESPACE} -o jsonpath="{.data.SEED_ADMIN_PASSWORD}"`);
  if (!b64) throw new Error(`Secret app-secrets não encontrado no namespace ${NAMESPACE} (o backend subiu?)`);
  return Buffer.from(b64, 'base64').toString();
}

// ---------- HTTP ----------
const stats = { ok: 0, falha: 0 };
async function call(label, url, expected, opts = {}) {
  let status, body;
  try {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    status = r.status; const t = await r.text(); try { body = JSON.parse(t); } catch { body = t; }
  } catch (e) { status = 'ERRO'; body = e.message; }
  const ok = expected.includes(status);
  stats[ok ? 'ok' : 'falha']++;
  const resumo = typeof body === 'object' && body ? (body.message || body.code || body.status || '') : String(body).slice(0, 60);
  console.log(`  ${ok ? '✅' : '❌'} ${label.padEnd(44)} ${status}${ok ? '' : ` (esperado ${expected.join('/')}) ${resumo}`}`);
  return { ok, status, body };
}

// ---------- dados inventados ----------
function cpf() {
  const d = Array.from({ length: 9 }, () => rand(0, 9));
  for (const n of [9, 10]) d.push((d.reduce((acc, v, i) => acc + v * (n + 1 - i), 0) * 10) % 11 % 10);
  return d.join('');
}
const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vanessa', 'William'];
const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Lima', 'Ferreira', 'Carvalho', 'Ribeiro', 'Gomes', 'Martins'];
const CARROS = [['Fiat', 'Uno'], ['Fiat', 'Argo'], ['Volkswagen', 'Gol'], ['Volkswagen', 'Polo'], ['Chevrolet', 'Onix'], ['Chevrolet', 'Prisma'], ['Ford', 'Ka'], ['Hyundai', 'HB20'], ['Toyota', 'Corolla'], ['Honda', 'Civic'], ['Renault', 'Sandero'], ['Jeep', 'Renegade']];
const DIAGNOSTICOS = ['Ruído na suspensão dianteira', 'Óleo vencido e filtro saturado', 'Pastilhas de freio no limite', 'Luz de injeção acesa', 'Desalinhamento e desgaste irregular dos pneus'];
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const placa = () => Array.from({ length: 3 }, () => pick(LETRAS)).join('') + rand(0, 9) + pick(LETRAS) + String(rand(0, 99)).padStart(2, '0');
const CENARIOS = ['completo', 'completo', 'cliente-aprova', 'cliente-recusa', 'em-execucao', 'aguardando'];

// ---------- fluxo ----------
async function preparar(ELB, H) {
  await call('Health via Kong', `${ELB}/api/health`, [200]);
  await call('Rota admin sem token (bloqueada)', `${ELB}/api/customers`, [401, 403]);
  const servicos = (await call('Catálogo de serviços', `${ELB}/api/services`, [200], { headers: H })).body;
  const pecas = (await call('Estoque de peças', `${ELB}/api/parts`, [200], { headers: H })).body;
  // Repõe estoque baixo para as aprovações não esbarrarem em "Estoque insuficiente" (422)
  for (const p of Array.isArray(pecas) ? pecas : []) {
    if (p.stockQuantity < 100) {
      await call(`Repor estoque: ${p.name}`, `${ELB}/api/parts/${p.id}`, [200], { method: 'PUT', headers: H, body: JSON.stringify({
        name: p.name, sku: p.sku, unitPrice: p.unitPrice, stockQuantity: 500, minStock: p.minStock, active: p.active }) });
    }
  }
  return {
    servicoIds: Array.isArray(servicos) && servicos.length ? servicos.map(s => s.id) : [1],
    pecaIds: Array.isArray(pecas) && pecas.length ? pecas.map(p => p.id) : [1],
  };
}

async function umaOS(i, total, ELB, LAMBDA, H, cat) {
  const doc = cpf(); const nome = `${pick(NOMES)} ${pick(SOBRENOMES)}`; const [brand, model] = pick(CARROS);
  const cenario = process.env.CENARIO || pick(CENARIOS);
  const email = nome.normalize('NFD').replace(/[^\w ]/g, '').toLowerCase().replace(' ', '.') + rand(1, 9999) + '@exemplo.com';
  console.log(`\n### ${i}/${total} ${nome} (CPF ${doc}) - ${brand} ${model} - cenário ${cenario}`);

  const os = await call('Abrir OS (cria cliente + veículo)', `${ELB}/api/service-orders`, [201], { method: 'POST', headers: H, body: JSON.stringify({
    customerDocument: doc, customer: { name: nome, email, phone: '119' + String(rand(0, 99999999)).padStart(8, '0') },
    vehicle: { plate: placa(), brand, model, manufacturingYear: rand(2008, 2025) },
    services: [{ serviceItemId: pick(cat.servicoIds), quantity: 1 }],
    parts: [{ partId: pick(cat.pecaIds), quantity: rand(1, 2) }] }) });
  if (!os.ok) return;
  const { id, code } = os.body;
  await call('Detalhe da OS (admin)', `${ELB}/api/service-orders/${id}`, [200], { headers: H });

  // Autenticação do cliente pela Lambda: CPF inválido, sem cadastro e o CPF dele (JWT)
  await call('Lambda: CPF inválido', LAMBDA, [400], { method: 'POST', body: JSON.stringify({ document: '12345678900' }) });
  await call('Lambda: CPF sem cadastro', LAMBDA, [404], { method: 'POST', body: JSON.stringify({ document: cpf() }) });
  const token = (await call('Lambda: CPF do cliente -> JWT', LAMBDA, [200], { method: 'POST', body: JSON.stringify({ document: doc }) })).body?.token || '';
  const C = { Authorization: 'Bearer ' + token };
  await call('Consulta pública SEM token (Kong barra)', `${ELB}/api/public/service-orders/${code}`, [401]);
  await call('Consulta pública token adulterado', `${ELB}/api/public/service-orders/${code}`, [401], { headers: { Authorization: 'Bearer ' + token.slice(0, -3) + 'abc' } });
  await call('Consulta pública COM token da Lambda', `${ELB}/api/public/service-orders/${code}`, [200], { headers: C });

  const pausa = () => sleep(rand(2000, 6000)); // tempo "no status" para o widget de duração por status
  const status = (s, comment) => call(`Status -> ${s}`, `${ELB}/api/service-orders/${id}/status`, [200], { method: 'PATCH', headers: H, body: JSON.stringify({ status: s, comment }) });

  if (cenario === 'cliente-aprova' || cenario === 'cliente-recusa') {
    await call('Diagnóstico da OS', `${ELB}/api/service-orders/${id}/diagnosis`, [200, 422], { method: 'PATCH', headers: H, body: JSON.stringify({ diagnosis: pick(DIAGNOSTICOS) }) });
    await pausa();
    const aprova = cenario === 'cliente-aprova';
    await call(`Cliente ${aprova ? 'APROVA' : 'RECUSA'} orçamento (rota pública)`, `${ELB}/api/public/service-orders/${code}/approval`, [200], { method: 'POST', headers: C,
      body: JSON.stringify({ approved: aprova, comment: aprova ? 'Pode fazer o serviço' : 'Achei caro, vou pensar' }) });
    if (aprova) { await pausa(); await status('FINALIZADA', 'Serviço concluído'); }
  } else if (cenario !== 'aguardando') {
    await pausa();
    await call('Admin aprova orçamento -> EM_EXECUCAO', `${ELB}/api/service-orders/${id}/approval`, [200], { method: 'PATCH', headers: H, body: JSON.stringify({ approved: true, comment: 'Aprovado por telefone' }) });
    if (cenario === 'completo') {
      await pausa(); await status('FINALIZADA', 'Serviço concluído');
      await pausa(); await status('ENTREGUE', 'Veículo entregue ao cliente');
    }
  }
  const fim = await call('Cliente consulta o status final', `${ELB}/api/public/service-orders/${code}`, [200], { headers: C });
  console.log(`  -> ${code} terminou em ${fim.body?.status || '?'}`);
}

async function listagens(ELB, H) {
  console.log('\n### Consultas administrativas');
  await call('Listar OS', `${ELB}/api/service-orders`, [200], { headers: H });
  await call('Listar clientes', `${ELB}/api/customers`, [200], { headers: H });
  await call('Listar veículos', `${ELB}/api/vehicles`, [200], { headers: H });
  await call('Listar peças', `${ELB}/api/parts`, [200], { headers: H });
  await call('Listar serviços', `${ELB}/api/services`, [200], { headers: H });
}

(async () => {
  const ELB = kongUrl(); const LAMBDA = lambdaUrl();
  console.log(`Kong  : ${ELB}\nLambda: ${LAMBDA}\nQtd: ${QTD} OS${MINUTOS ? ` por lote, repetindo por ${MINUTOS} min` : ''}\n`);
  const fimEm = Date.now() + MINUTOS * 60000; let lote = 0;
  do {
    lote++;
    // login a cada lote: o token de admin expira
    const login = await call('Login admin', `${ELB}/api/auth/login`, [200], { method: 'POST', body: JSON.stringify({ email: 'admin@oficina.com', password: adminPassword() }) });
    if (!login.ok) throw new Error('Login admin falhou - confira se o backend está no ar');
    const H = { Authorization: 'Bearer ' + login.body.token };
    const cat = await preparar(ELB, H);
    for (let i = 1; i <= QTD; i++) await umaOS(i, QTD, ELB, LAMBDA, H, cat);
    await listagens(ELB, H);
    if (MINUTOS) console.log(`\n=== Lote ${lote} concluído (${Math.max(0, Math.round((fimEm - Date.now()) / 60000))} min restantes)`);
  } while (Date.now() < fimEm);
  console.log(`\nResumo: ${stats.ok} chamadas ok, ${stats.falha} fora do esperado. Métricas chegam ao New Relic em ~1 min.`);
})().catch(e => { console.error('\nERRO:', e.message); process.exit(1); });
