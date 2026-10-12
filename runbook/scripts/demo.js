// Gera dados e simula falhas para as cenas de observabilidade do vídeo (RUNBOOK.md, roteiro). Sem token do GitHub.
//
//   node demo.js status            abre uma OS e a leva até ENTREGUE (aprovação -> FINALIZADA -> ENTREGUE): alimenta o
//                                  widget "tempo médio por status" e dispara os e-mails de notificação ao cliente
//   node demo.js falha-email on    aponta o SMTP da aplicação para um host inexistente (rollout ~1-2 min); em seguida
//                                  rode "node demo.js status": cada e-mail falha -> métrica integration.failure ->
//                                  widget "erros de integração" e alerta "Falha em integração externa"
//   node demo.js falha-email off   desfaz (kubectl rollout undo)
//   node demo.js falha-os on       torna a tabela de OS inacessível no banco (RDS) e chama as rotas de OS por ~1 min:
//                                  respostas 500 -> alerta "Falha no processamento de ordens de serviço"
//   node demo.js falha-os off      desfaz (a tabela volta ao nome original) - SEMPRE rodar antes de seguir o roteiro
//
// Os alertas do New Relic abrem alguns minutos depois (janela de 1 min + atraso de 2 min) e mandam e-mail.
const { execSync } = require('child_process');
const { NAMESPACE, DEPLOYMENT, sh, kongUrl, call, adminHeaders, openServiceOrder } = require('./common');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const run = c => { console.log('$ ' + c); execSync(c, { stdio: 'inherit' }); }; // mostra a saída ao vivo

async function statusFlow() {
  const ELB = kongUrl(); const H = await adminHeaders(ELB);
  const os = await openServiceOrder(ELB, H);
  const id = os.body.id;
  await sleep(5000); // tempo "no status" para o widget de duração ter um valor visível
  await call('Aprovar orçamento -> EM_EXECUCAO', `${ELB}/api/service-orders/${id}/approval`, [200], { method: 'PATCH', headers: H, body: JSON.stringify({ approved: true, comment: 'Aprovado (demo)' }) });
  await sleep(5000);
  await call('Status -> FINALIZADA', `${ELB}/api/service-orders/${id}/status`, [200], { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'FINALIZADA', comment: 'Serviço concluído (demo)' }) });
  await sleep(5000);
  await call('Status -> ENTREGUE', `${ELB}/api/service-orders/${id}/status`, [200], { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'ENTREGUE', comment: 'Veículo entregue (demo)' }) });
  console.log(`\nOS ${os.body.code} percorreu os status. Métricas chegam ao New Relic em ~1 min.`);
}

function emailFailure(mode) {
  if (mode === 'on') {
    run(`kubectl set env deployment/${DEPLOYMENT} -n ${NAMESPACE} MAIL_HOST=smtp.falha-simulada.invalid`);
  } else {
    run(`kubectl rollout undo deployment/${DEPLOYMENT} -n ${NAMESPACE}`);
  }
  run(`kubectl rollout status deployment/${DEPLOYMENT} -n ${NAMESPACE} --timeout=300s`);
  console.log(mode === 'on' ? '\nSMTP quebrado. Agora: node demo.js status' : '\nSMTP restaurado.');
}

function psql(sql) {
  const host = sh('aws rds describe-db-instances --db-instance-identifier oficina-mecnica-lab-postgres --query "DBInstances[0].Endpoint.Address" --output text');
  let pwd = sh('aws secretsmanager get-secret-value --secret-id oficina-mecnica-lab-rds-password --query SecretString --output text');
  try { pwd = JSON.parse(pwd).password ?? pwd; } catch { /* texto puro */ }
  console.log(`$ psql (pod temporário) -c "${sql}"`);
  execSync(`kubectl run psql-demo -n ${NAMESPACE} --rm -i --restart=Never --image=postgres:16-alpine --env=PGPASSWORD=${pwd} -- ` +
     `psql "host=${host} user=oficina dbname=oficina_mvp sslmode=require" -c "${sql}"`, { stdio: 'inherit' });
}

async function osFailure(mode) {
  if (mode === 'off') {
    psql('ALTER TABLE service_orders_falha_simulada RENAME TO service_orders;');
    console.log('\nTabela restaurada.');
    return;
  }
  psql('ALTER TABLE service_orders RENAME TO service_orders_falha_simulada;');
  const ELB = kongUrl(); const H = await adminHeaders(ELB);
  for (let i = 0; i < 12; i++) { await call('Listar OS (deve dar 500)', `${ELB}/api/service-orders`, [500], { headers: H }); await sleep(5000); }
  console.log('\nFalha gerada. Lembre de desfazer: node demo.js falha-os off');
}

(async () => {
  const [cmd, mode] = process.argv.slice(2);
  if (cmd === 'status') return statusFlow();
  if (cmd === 'falha-email' && ['on', 'off'].includes(mode)) return emailFailure(mode);
  if (cmd === 'falha-os' && ['on', 'off'].includes(mode)) return osFailure(mode);
  console.error('Uso: node demo.js status | falha-email on|off | falha-os on|off'); process.exit(1);
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
