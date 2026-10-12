# Roteiro do vídeo (até 15 minutos)

Pré-requisito: ambiente de pé e `node e2e-test.js` com "Tudo certo." ([`RUNBOOK.md`](RUNBOOK.md)). Os comandos
abaixo são para o **Git Bash**, de dentro de `oficina-mvp-infra-iac/runbook/scripts`.

O enunciado pede que o vídeo mostre: **autenticação com CPF, execução da pipeline CI/CD, deploy automatizado,
consumo das APIs protegidas, dashboard de monitoramento com análise ao vivo, logs e traces em execução.**

## Antes de apertar o REC (~15 min, sem gravar)

1. Variáveis para os comandos (copie os valores que o `e2e-test.js` mostrou):
   ```bash
   KONG=http://<DNS do Kong>
   LAMBDA=<URL da Lambda>          # termina em /authenticate
   ```
2. **Dados para os dashboards** (os widgets precisam de alguns minutos de dados):
   ```bash
   node demo.js status                   # widget "tempo médio por status"
   node demo.js falha-email on           # ~2 min (troca os pods)
   node demo.js status                   # e-mails falham -> widget "erros de integração"
   node demo.js falha-email off          # ~2 min
   ```
3. **Alerta de falha de OS** (abre ~5 min depois — deixe pronto para a cena 6):
   ```bash
   node demo.js falha-os on              # ~1 min gerando erros 500
   node demo.js falha-os off             # SEMPRE desfazer logo em seguida
   ```
4. Abas abertas, na ordem: GitHub (Actions do backend), terminal (fonte grande), Swagger
   (`$KONG/swagger-ui.html`), New Relic (dashboard, *APM & Services → oficina-mvp-backend*, *Logs*,
   *Alerts → Issues*), caixa de e-mail do alerta (techpos2026@gmail.com, se tiver acesso).
5. **Nunca mostre**: credenciais AWS, senhas (admin, banco), o arquivo `.aws/credentials`.

---

## 0. Abertura (~30 s)

Diagrama `01-componentes-visao-nuvem.png` na tela. **Fala**: "Tech Challenge da Fase 3 — sistema de oficina
mecânica com login por CPF numa function serverless, aplicação em Kubernetes na AWS atrás do Kong, banco
gerenciado RDS e observabilidade no New Relic, em 4 repositórios com CI/CD."

## 1. Pipeline CI/CD e deploy automatizado (~3 min)

1. GitHub → um PR qualquer (ex.: o último `homolog → master` do backend) → aba **Checks**: testes, Sonar, análise
   estática. **Fala**: "toda mudança entra por Pull Request; `master` é protegida."
2. Aba **Actions** do backend → o run **Oficina App - Pipeline** que subiu o ambiente hoje: jobs *Run Tests →
   SonarQube → Build → Docker Build & ECR Push → Deploy to AWS EKS*. Abrir o job de deploy: *Discover Kong and RDS*
   (endereços lidos da AWS) e o `kubectl rollout status` no fim.
3. Mostrar rapidamente os runs dos outros 3 repos (Terraform do EKS/Kong, do RDS, da Lambda).
4. Terminal:
   ```bash
   kubectl get pods -n prod
   kubectl get pods -n prod -o jsonpath='{..image}'; echo     # tag da imagem = commit do master
   ```
   **Fala**: "o deploy é automático: a pipeline publica a imagem com a tag do commit no ECR e aplica os manifestos
   no EKS; o job só fica verde quando os pods novos passam no healthcheck."

> Se o Lucas estiver junto, dá para mostrar ao vivo: PR pequeno mergeado em `master` com a chave
> `DEPLOY_ENABLED=true` → pipeline dispara sozinha → pods trocados (`kubectl get pods -n prod -w`).

## 2. Autenticação com CPF (~2 min)

```bash
curl -s -X POST $LAMBDA -H 'Content-Type: application/json' -d '{"document":"12345678900"}'; echo   # 400 inválido
curl -s -X POST $LAMBDA -H 'Content-Type: application/json' -d '{"document":"11144477735"}'; echo   # 404 sem cadastro
TOKEN=$(curl -s -X POST $LAMBDA -H 'Content-Type: application/json' -d '{"document":"52998224725"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
echo ${TOKEN:0:40}...                                                                               # JWT emitido
```
**Fala**: "a Lambda valida o CPF, consulta o cliente no backend por uma API interna e só assina o JWT para cliente
ativo." Apoio: diagrama `02-sequencia-autenticacao-cpf.png`.

## 3. APIs protegidas (~2 min 30)

1. Rota pública do cliente, pelo Kong:
   ```bash
   CODE=<código da OS>    # aparece na saída do e2e-test.js / demo.js, ex.: OS-20261012Z-48176
   curl -s -o /dev/null -w '%{http_code}\n' $KONG/api/public/service-orders/$CODE                                # 401 sem token (Kong)
   curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer ${TOKEN}x" $KONG/api/public/service-orders/$CODE   # 401 adulterado
   curl -s -H "Authorization: Bearer $TOKEN" $KONG/api/public/service-orders/$CODE; echo                         # 200 com o JWT da Lambda
   ```
2. Swagger (`$KONG/swagger-ui.html`): `POST /api/auth/login` como admin → **Authorize** → `GET /api/service-orders`
   e abrir uma OS. **Fala**: "dois perfis: equipe da oficina (JWT administrativo) e cliente (JWT da Lambda), e o
   Kong barra token inválido antes de chegar na aplicação."

## 4. Escalabilidade — HPA (~2 min, pode cortar a espera)

```bash
kubectl get hpa -n prod                     # 1 réplica, alvo CPU 20%
kubectl run carga -n prod --rm -it --image=busybox:1.36 --restart=Never -- \
  sh -c 'while true; do wget -q -O- http://oficina-app-service/api/health >/dev/null; done'
```
Noutro terminal: `kubectl get hpa -n prod -w` — escala em ~2–3 min (só sobe com CPU alta por 2 min seguidos, para
não reagir ao pico de inicialização). `Ctrl+C` no terminal da carga para parar.

## 5. Dashboard com análise ao vivo (~2 min 30)

[Dashboard do projeto](https://one.newrelic.com/dashboards/detail/ODU1ODQ2NXxWSVp8REFTSEJPQVJEfGRhOjEzMjU3MzM5):
- **Negócio**: volume diário de OS, tempo médio por status, erros de integração (dados gerados antes de gravar).
- **Ao vivo**: rodar `node demo.js status` e mostrar o contador de OS subindo em ~1 min.
- **Operação**: CPU/memória dos pods, réplicas do HPA (a carga da cena 4 aparece aqui), latência das APIs.

## 6. Logs, traces e alertas (~2 min 30)

1. *APM & Services → oficina-mvp-backend → Distributed tracing*: abrir um trace de `POST /api/service-orders`
   (spans da requisição, do banco).
2. *Logs*: filtrar `service.name = 'oficina-mvp-backend'` → abrir uma linha (JSON estruturado) → clicar no
   `trace.id` → mesma requisição no trace. **Fala**: "logs em JSON correlacionados com o trace pelo `trace.id`."
3. *Alerts → Issues*: incidentes **Falha no processamento de ordens de serviço** (cena preparada com
   `falha-os`) e **Falha em integração externa**, e o e-mail recebido.

## Encerramento (~30 s)

Resumo: login por CPF serverless, Kong, EKS com HPA, RDS, Terraform + CI/CD nos 4 repos, New Relic. Links dos
repositórios na tela.

---

## Depois de gravar

- [ ] Derrubar o ambiente ([`RUNBOOK.md`](RUNBOOK.md), passo 5) e conferir com `bash sweep.sh`.
- [ ] Vídeo ≤ 15 min, no YouTube/Vimeo como **público ou não listado** (não privado); testar o link numa aba anônima.
- [ ] Mandar o link para quem monta o PDF.
