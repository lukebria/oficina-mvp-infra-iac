// Dispara um workflow (botão "Run workflow") e acompanha até terminar, mostrando o estado de cada job.
// Uso: node run-workflow.js <repo> <arquivo.yml> [branch=homolog]
// Ex.:  node run-workflow.js oficina-mvp-infra-iac create_iac.yml
const { OWNER, gh } = require('./lib');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const [repo, file, ref = 'homolog'] = process.argv.slice(2);
  if (!repo || !file) { console.error('Uso: node run-workflow.js <repo> <arquivo.yml> [branch]'); process.exit(1); }
  // margem de 2 min: o relógio local pode estar adiantado em relação ao GitHub
  const before = new Date(Date.now() - 120000).toISOString();
  const d = await gh(`/repos/${OWNER}/${repo}/actions/workflows/${file}/dispatches`, { method: 'POST', body: JSON.stringify({ ref }) });
  if (d.status !== 204) { console.error('Falha ao disparar:', d.status, d.body?.message, '(404 = workflow não registrado no GitHub)'); process.exit(1); }
  let run;
  for (let i = 0; i < 15 && !run; i++) {
    await sleep(4000);
    run = (await gh(`/repos/${OWNER}/${repo}/actions/workflows/${file}/runs?event=workflow_dispatch&per_page=5`)).body.workflow_runs
      .find(x => x.created_at >= before.slice(0, 19) && x.head_branch === ref);
  }
  if (!run) { console.error('Run não encontrado; veja a aba Actions.'); process.exit(1); }
  console.log(`run ${run.id}: ${run.html_url}`);
  let last = '';
  for (;;) {
    const r = (await gh(`/repos/${OWNER}/${repo}/actions/runs/${run.id}`)).body;
    const jobs = (await gh(`/repos/${OWNER}/${repo}/actions/runs/${run.id}/jobs`)).body.jobs;
    const s = jobs.map(j => `${j.name}=${j.conclusion || j.status}`).join(' | ');
    if (s !== last) { console.log(new Date().toISOString().slice(11, 19), s); last = s; }
    if (r.status === 'completed') { console.log('RESULTADO:', r.conclusion); process.exit(r.conclusion === 'success' ? 0 : 1); }
    await sleep(20000);
  }
})();
