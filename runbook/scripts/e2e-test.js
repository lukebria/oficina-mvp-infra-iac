// Teste de ponta a ponta do ambiente (passo "Validar" do RUNBOOK.md). Descobre sozinho a URL do Kong (kubectl), da
// Lambda (API Gateway) e a senha do admin (Secret do cluster). Sem token do GitHub e sem npm install.
// Uso: node e2e-test.js          (sai com código 1 se algum resultado não for o esperado)
const { TEST_CPF, kongUrl, lambdaUrl, call, adminHeaders, openServiceOrder } = require('./common');

(async () => {
  const ELB = kongUrl(), LAMBDA = lambdaUrl();
  console.log('Kong  :', ELB, '\nLambda:', LAMBDA, '\n');
  const results = [];
  const r = async p => { const x = await p; results.push(x.ok); return x; };
  await r(call('Health via Kong', `${ELB}/api/health`, [200]));
  const H = await adminHeaders(ELB); results.push(!!H.Authorization.slice(7));
  const os = await r(openServiceOrder(ELB, H));
  await r(call('Lambda: CPF inválido', LAMBDA, [400], { method: 'POST', body: JSON.stringify({ document: '12345678900' }) }));
  await r(call('Lambda: CPF sem cadastro', LAMBDA, [404], { method: 'POST', body: JSON.stringify({ document: '11144477735' }) }));
  const auth = await r(call('Lambda: CPF do cliente -> JWT', LAMBDA, [200], { method: 'POST', body: JSON.stringify({ document: TEST_CPF }) }));
  const code = os.body.code, tok = auth.body.token || 'x.y.z';
  await r(call('OS pública SEM token (Kong barra)', `${ELB}/api/public/service-orders/${code}`, [401]));
  await r(call('OS pública token adulterado (Kong barra)', `${ELB}/api/public/service-orders/${code}`, [401], { headers: { Authorization: 'Bearer ' + tok.slice(0, -3) + 'abc' } }));
  await r(call('OS pública COM token da Lambda', `${ELB}/api/public/service-orders/${code}`, [200], { headers: { Authorization: 'Bearer ' + tok } }));
  await r(call('Rota admin sem token', `${ELB}/api/customers`, [401, 403]));
  const fails = results.filter(ok => !ok).length;
  console.log(fails ? `\n${fails} falha(s).` : '\nTudo certo.');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
