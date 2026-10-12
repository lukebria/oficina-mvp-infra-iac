// Scripts SÓ PARA O DONO dos repositórios (gravam secrets/variables no GitHub - em repo de conta pessoal, só o dono
// pode; quem grava o vídeo não precisa de nada desta pasta, ver ../../RUNBOOK.md).
// Funções compartilhadas. NENHUM segredo fica neste arquivo:
// - Token do GitHub: variável de ambiente GITHUB_TOKEN (fine-grained PAT dos 4 repos, com
//   Secrets/Variables/Actions/Contents/Pull requests = Read and write).
// - Segredos do projeto: arquivo local OFICINA_SECRETS_FILE (padrão: ~/.oficina-secrets.env), FORA do OneDrive.
// - Credenciais AWS: ~/.aws/credentials (perfil default), atualizadas a cada sessão do Learner Lab.
const fs = require('fs');
const os = require('os');
const path = require('path');

const OWNER = process.env.GITHUB_OWNER || 'lukebria';
const REPOS = ['oficina-auth-function', 'oficina-mvp-infra-iac', 'oficina-mvp-infra-db', 'oficina-mvp-java-backend'];
// Opcional: trava contra colar credenciais da conta errada (ex.: EXPECTED_AWS_ACCOUNT=536036031274)
const EXPECTED_AWS_ACCOUNT = process.env.EXPECTED_AWS_ACCOUNT || '';

function token() {
  const t = process.env.GITHUB_TOKEN;
  if (!t) {
    console.error('Defina GITHUB_TOKEN (PowerShell: $env:GITHUB_TOKEN = "github_pat_..."; bash: export GITHUB_TOKEN=github_pat_...)');
    process.exit(1);
  }
  return t.trim();
}

async function gh(apiPath, opts = {}) {
  const r = await fetch('https://api.github.com' + apiPath, {
    ...opts,
    headers: { Authorization: 'Bearer ' + token(), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
  });
  const text = await r.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: r.status, body };
}

function readEnvFile(file = process.env.OFICINA_SECRETS_FILE || path.join(os.homedir(), '.oficina-secrets.env')) {
  if (!fs.existsSync(file)) { console.error('Arquivo de segredos não encontrado: ' + file); process.exit(1); }
  const out = {};
  for (const l of fs.readFileSync(file, 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m) out[m[1]] = m[2].trim(); }
  return out;
}

function readAwsCredentials(file = path.join(os.homedir(), '.aws', 'credentials')) {
  const out = {}; let inDefault = false;
  for (const l of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const sec = l.match(/^\s*\[(.+)\]\s*$/); if (sec) { inDefault = sec[1] === 'default'; continue; }
    const m = inDefault && l.match(/^\s*(aws_[a-z_]+)\s*=\s*(\S+)/); if (m) out[m[1]] = m[2];
  }
  if (!out.aws_session_token) { console.error('~/.aws/credentials sem aws_session_token no perfil [default] (copie o bloco inteiro de AWS Details -> AWS CLI)'); process.exit(1); }
  return out;
}

// Grava um GitHub Actions secret (criptografado localmente com a chave pública do repo - libsodium sealed box).
async function setSecret(repo, name, value) {
  const sodium = require('libsodium-wrappers');
  await sodium.ready;
  const pk = await gh(`/repos/${OWNER}/${repo}/actions/secrets/public-key`);
  if (pk.status !== 200) return `${name}: ERRO ${pk.status} ao ler a chave pública`;
  const enc = sodium.to_base64(sodium.crypto_box_seal(sodium.from_string(value), sodium.from_base64(pk.body.key, sodium.base64_variants.ORIGINAL)), sodium.base64_variants.ORIGINAL);
  const r = await gh(`/repos/${OWNER}/${repo}/actions/secrets/${name}`, { method: 'PUT', body: JSON.stringify({ encrypted_value: enc, key_id: pk.body.key_id }) });
  return `${name}: ${r.status === 201 ? 'criado' : r.status === 204 ? 'atualizado' : 'ERRO ' + r.status}`;
}

// Grava uma GitHub Actions variable (texto aberto - nunca usar para valor sensível).
async function setVariable(repo, name, value) {
  let r = await gh(`/repos/${OWNER}/${repo}/actions/variables/${name}`, { method: 'PATCH', body: JSON.stringify({ name, value }) });
  if (r.status === 404) r = await gh(`/repos/${OWNER}/${repo}/actions/variables`, { method: 'POST', body: JSON.stringify({ name, value }) });
  return `${name}=${value}: ${r.status === 201 ? 'criada' : r.status === 204 ? 'atualizada' : 'ERRO ' + r.status}`;
}

module.exports = { OWNER, REPOS, EXPECTED_AWS_ACCOUNT, gh, readEnvFile, readAwsCredentials, setSecret, setVariable };
