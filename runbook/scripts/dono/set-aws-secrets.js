// Alternativa à tela do GitHub: regrava os 3 secrets AWS (sessão do Learner Lab) nos 4 repositórios.
// Uso: node set-aws-secrets.js
// Lê ~/.aws/credentials (perfil default). Se EXPECTED_AWS_ACCOUNT estiver definida, recusa outra conta.
const { execSync } = require('child_process');
const { REPOS, EXPECTED_AWS_ACCOUNT, readAwsCredentials, setSecret } = require('./lib');

(async () => {
  const account = execSync('aws sts get-caller-identity --query Account --output text').toString().trim();
  console.log('Conta AWS das credenciais:', account);
  if (EXPECTED_AWS_ACCOUNT && account !== EXPECTED_AWS_ACCOUNT) {
    console.error(`Conta AWS ${account} != ${EXPECTED_AWS_ACCOUNT}. Credenciais do Lab do outro curso? Nada foi gravado.`);
    process.exit(1);
  }
  const aws = readAwsCredentials();
  for (const repo of REPOS) {
    const out = [];
    out.push(await setSecret(repo, 'AWS_ACCESS_KEY_ID', aws.aws_access_key_id));
    out.push(await setSecret(repo, 'AWS_SECRET_ACCESS_KEY', aws.aws_secret_access_key));
    out.push(await setSecret(repo, 'AWS_SESSION_TOKEN', aws.aws_session_token));
    console.log(repo.padEnd(26), out.join(' | '));
  }
})();
