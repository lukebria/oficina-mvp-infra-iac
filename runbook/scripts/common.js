// Funções comuns dos scripts de quem grava/testa o ambiente. Sem token do GitHub e sem dependências npm: tudo vem
// do próprio ambiente, com as credenciais do Learner Lab em ~/.aws/credentials e o kubectl apontando para o cluster
// (aws eks update-kubeconfig --name oficina-mecnica-lab-cluster --region us-east-1).
const { execSync } = require('child_process');

const NAMESPACE = process.env.NAMESPACE || 'prod'; // deploy a partir de master = namespace prod
const DEPLOYMENT = 'oficina-app-deployment';
const sh = (c, opts = {}) => execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString().trim();

function kongUrl() {
  const elb = sh(`kubectl get svc -n kong kong-kong-proxy -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"`);
  if (!elb) throw new Error('LoadBalancer do Kong sem endereço (o oficina-mvp-infra-iac subiu?)');
  return 'http://' + elb;
}

function lambdaUrl() {
  const api = sh(`aws apigatewayv2 get-apis --query "Items[?Name=='oficina-auth-function-api'].ApiEndpoint | [0]" --output text`);
  if (!api || api === 'None') throw new Error('API Gateway da Lambda não encontrado (a oficina-auth-function subiu?)');
  return api + '/authenticate';
}

// Senha do admin semeado: lida do Secret do próprio cluster (o pipeline grava ali a partir do GitHub Secret).
function adminPassword() {
  const b64 = sh(`kubectl get secret app-secrets -n ${NAMESPACE} -o jsonpath="{.data.SEED_ADMIN_PASSWORD}"`);
  if (!b64) throw new Error(`Secret app-secrets não encontrado no namespace ${NAMESPACE} (o backend subiu?)`);
  return Buffer.from(b64, 'base64').toString();
}

async function call(label, url, expected, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
  const ok = expected.includes(r.status);
  const show = JSON.stringify(b, (k, v) => (typeof v === 'string' && /token/i.test(k) && v.length > 30) ? v.slice(0, 16) + '…' : v).slice(0, 140);
  console.log(`${ok ? '✅' : '❌'} ${label.padEnd(46)} ${r.status} (esperado ${expected.join('/')}) ${show}`);
  return { ok, status: r.status, body: b };
}

async function adminHeaders(base) {
  const login = await call('Login admin', `${base}/api/auth/login`, [200], { method: 'POST', body: JSON.stringify({ email: 'admin@oficina.com', password: adminPassword() }) });
  return { Authorization: 'Bearer ' + (login.body.token || '') };
}

// Abre uma OS (cria cliente + veículo na hora). CPF de teste válido (gerado), não pertence a ninguém.
const TEST_CPF = '52998224725';
async function openServiceOrder(base, H, label = 'Abrir OS (cria cliente + veículo)') {
  return call(label, `${base}/api/service-orders`, [201], { method: 'POST', headers: H, body: JSON.stringify({
    customerDocument: TEST_CPF, customer: { name: 'Cliente Teste E2E', email: 'cliente.e2e@example.com', phone: '11999990000' },
    vehicle: { plate: 'TST' + String(Date.now()).slice(-4), brand: 'Fiat', model: 'Uno', manufacturingYear: 2015 },
    services: [{ serviceItemId: 1, quantity: 1 }], parts: [{ partId: 1, quantity: 1 }] }) });
}

module.exports = { NAMESPACE, DEPLOYMENT, TEST_CPF, sh, kongUrl, lambdaUrl, adminPassword, call, adminHeaders, openServiceOrder };
