// Liga/desliga a chave de deploy (variable DEPLOY_ENABLED) nos 4 repositórios.
// Uso: node deploy-key.js on   |   node deploy-key.js off   |   node deploy-key.js status
const { REPOS, OWNER, gh, setVariable } = require('./lib');

(async () => {
  const mode = process.argv[2];
  if (!['on', 'off', 'status'].includes(mode)) { console.error('Uso: node deploy-key.js on|off|status'); process.exit(1); }
  for (const repo of REPOS) {
    if (mode === 'status') {
      const r = await gh(`/repos/${OWNER}/${repo}/actions/variables/DEPLOY_ENABLED`);
      console.log(repo.padEnd(26), 'DEPLOY_ENABLED =', r.status === 200 ? r.body.value : '(ausente = desligado)');
    } else {
      console.log(repo.padEnd(26), await setVariable(repo, 'DEPLOY_ENABLED', mode === 'on' ? 'true' : 'false'));
    }
  }
})();
