// Configuração inicial (uma vez, ou ao trocar algum valor): grava os secrets/variables da aplicação
// nos repositórios certos, a partir de ~/.oficina-secrets.env. Valores que precisam ser IDÊNTICOS entre repos
// (CUSTOMER_JWT_SECRET, INTERNAL_API_KEY, NEW_RELIC_LICENSE_KEY) saem da mesma linha do arquivo.
// Uso: node set-app-secrets.js
const { setSecret, setVariable, readEnvFile } = require('./lib');

const env = readEnvFile();
const OTLP = env.NEW_RELIC_REGION === 'EU' ? 'https://otlp.eu01.nr-data.net:4318' : 'https://otlp.nr-data.net:4318';
const LAYER = env.NEW_RELIC_LAMBDA_LAYER_ARN || 'arn:aws:lambda:us-east-1:451483290750:layer:NewRelicNodeJS22X:108';

const PLAN = {
  'oficina-auth-function': {
    secrets: ['CUSTOMER_JWT_SECRET', 'INTERNAL_API_KEY', 'NEW_RELIC_LICENSE_KEY'],
    vars: { AWS_DEFAULT_REGION: 'us-east-1', NEW_RELIC_ACCOUNT_ID: env.NEW_RELIC_ACCOUNT_ID, NEW_RELIC_LAMBDA_LAYER_ARN: LAYER },
  },
  'oficina-mvp-infra-iac': {
    secrets: ['CUSTOMER_JWT_SECRET', 'NEW_RELIC_LICENSE_KEY'],
    vars: { AWS_DEFAULT_REGION: 'us-east-1' },
  },
  'oficina-mvp-infra-db': {
    secrets: [],
    vars: { AWS_DEFAULT_REGION: 'us-east-1' },
  },
  'oficina-mvp-java-backend': {
    secrets: ['CUSTOMER_JWT_SECRET', 'INTERNAL_API_KEY', 'JWT_SECRET', 'SEED_ADMIN_PASSWORD', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM', 'NEW_RELIC_LICENSE_KEY'],
    vars: {
      AWS_DEFAULT_REGION: 'us-east-1', MAIL_HOST: env.MAIL_HOST, MAIL_PORT: env.MAIL_PORT,
      NEW_RELIC_OTLP_ENDPOINT: OTLP + '/v1/traces', NEW_RELIC_OTLP_METRICS_ENDPOINT: OTLP + '/v1/metrics',
      TRACING_SAMPLING_PROBABILITY: '1.0', OTLP_METRICS_EXPORT_ENABLED: 'true',
    },
  },
};

(async () => {
  for (const [repo, { secrets, vars }] of Object.entries(PLAN)) {
    const out = [];
    for (const n of secrets) out.push(env[n] ? await setSecret(repo, n, env[n]) : `${n}: VAZIO no arquivo, pulado`);
    for (const [n, v] of Object.entries(vars)) out.push(v ? await setVariable(repo, n, v) : `${n}: VAZIO, pulado`);
    console.log(`== ${repo}\n   ` + out.join('\n   '));
  }
})();
