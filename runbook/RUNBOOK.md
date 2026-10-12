# Guia de gravação — subir, validar e derrubar o ambiente

Para quem vai **gravar o vídeo** (ou só testar o projeto) sem conhecer os detalhes. Tudo sobe no **seu** AWS
Academy Learner Lab, clicando nos workflows do GitHub. Roteiro das cenas: [`ROTEIRO-VIDEO.md`](ROTEIRO-VIDEO.md).

| Etapa | Tempo | Quem |
|---|---|---|
| 0. Preparar a máquina (1ª vez) | 10 min | você |
| 1. Iniciar o Lab e mandar as credenciais | 5 min | você + **Lucas** (cola no GitHub) |
| 2. Subir (4 workflows, na ordem) | ~35 min | você |
| 3. Validar | 2 min | você |
| 4. Gravar | ≤ 15 min de vídeo | você |
| 5. Derrubar | ~20 min | você (+ Lucas, se o Lab expirou) |

**Custo**: ≈ US$ 0,26/h com tudo de pé (o Lab tem US$ 50). **Derrube no mesmo dia.**

---

## 0. Preparar a máquina (1ª vez)

1. Ser **colaborador** (escrita) dos 4 repositórios — peça ao Lucas:
   [`oficina-mvp-infra-iac`](https://github.com/lukebria/oficina-mvp-infra-iac) ·
   [`oficina-mvp-infra-db`](https://github.com/lukebria/oficina-mvp-infra-db) ·
   [`oficina-auth-function`](https://github.com/lukebria/oficina-auth-function) ·
   [`oficina-mvp-java-backend`](https://github.com/lukebria/oficina-mvp-java-backend)
2. Instalar (Windows, PowerShell):
   ```powershell
   winget install Amazon.AWSCLI
   winget install Kubernetes.kubectl
   winget install OpenJS.NodeJS.LTS
   winget install Git.Git
   ```
   Feche e abra o terminal depois.
3. Baixar este repositório (só para ter os scripts):
   ```powershell
   git clone https://github.com/lukebria/oficina-mvp-infra-iac.git
   cd oficina-mvp-infra-iac/runbook/scripts
   ```
   Os scripts **não precisam** de `npm install` nem de token do GitHub (a pasta `dono/` é só do Lucas).

---

## 1. Iniciar o Lab e mandar as credenciais

1. No AWS Academy: **Learner Lab → Start Lab** → espere a bolinha ficar verde (~1–2 min).
2. **AWS Details → AWS CLI → Show**: copie o bloco inteiro (`[default]`, `aws_access_key_id`,
   `aws_secret_access_key`, `aws_session_token`).
3. **Mande o bloco ao Lucas por mensagem privada** (nunca em grupo/vídeo). Ele cola nos 4 repositórios
   (*Settings → Secrets and variables → Actions*: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
   `AWS_SESSION_TOKEN`) e te avisa. Só o dono do repositório consegue gravar secrets — é o único passo dele.
4. Cole o mesmo bloco no arquivo `C:\Users\<você>\.aws\credentials` (crie a pasta `.aws` se não existir) e confira:
   ```powershell
   aws sts get-caller-identity --query Account --output text   # número da SUA conta do Lab
   ```

> ⏱️ A sessão do Lab dura ~4 h. Se expirar (erros `ExpiredToken`/`AccessDenied` nos workflows), clique **Start Lab**
> de novo e repita os passos 2–4 — inclusive antes de derrubar.

---

## 2. Subir (Actions → Run workflow, sempre na branch `master`)

Em cada repositório: aba **Actions** → escolha o workflow na lista à esquerda → **Run workflow** → branch
`master` → **Run workflow**. Espere ficar ✅ verde antes do próximo. Se um workflow rodar fora de ordem, ele
**falha com uma mensagem dizendo o que subir antes** — nada quebra, é só rodar de novo na ordem certa.

| # | Repositório | Workflow | Tempo | O que sobe |
|---|---|---|---|---|
| 1 | `oficina-mvp-infra-iac` | **Oficina IaC - Create** | ~15 min | Bucket de state (1ª vez na sua conta), cluster EKS, 2 nós, ECR, Kong (LoadBalancer), metrics-server, New Relic |
| 2a | `oficina-mvp-infra-db` | **Oficina IaC DB - Create** | ~6 min | RDS PostgreSQL 16 |
| 2b | `oficina-auth-function` | **Auth Function - Deploy** | ~2 min | Lambda de login por CPF + API Gateway |
| 3 | `oficina-mvp-java-backend` | **Oficina App - Pipeline** | ~10 min | Testes, Sonar, imagem no ECR, deploy no EKS (namespace `prod`) |

2a e 2b podem rodar ao mesmo tempo. O backend (3) só depois dos dois.

Depois do passo 1, ligue o `kubectl` ao cluster (uma vez por subida):
```powershell
aws eks update-kubeconfig --name oficina-mecnica-lab-cluster --region us-east-1
kubectl get nodes        # 2 nós Ready
```

> 💡 Quer gravar a subida? A aba Actions com os jobs rodando é a cena "pipeline/deploy automatizado" do roteiro.

---

## 3. Validar

```powershell
node e2e-test.js
```
Testa health, login admin, abertura de OS, Lambda (CPF inválido 400 / sem cadastro 404 / válido 200 + JWT), Kong
(sem token 401 / token adulterado 401 / com token 200). Tem que terminar em **"Tudo certo."** O script mostra o
endereço do Kong e da Lambda — anote para o vídeo.

| O quê | Onde |
|---|---|
| Swagger | `http://<DNS do Kong>/swagger-ui.html` |
| Login admin | `admin@oficina.com` · senha: `kubectl get secret app-secrets -n prod -o jsonpath="{.data.SEED_ADMIN_PASSWORD}"` e decodificar (base64) — **não mostrar na tela** |
| Lambda | `POST <URL da Lambda>` com `{"document":"52998224725"}` (CPF de teste, criado pelo `e2e-test.js`) |
| New Relic | [Dashboard do projeto](https://one.newrelic.com/dashboards/detail/ODU1ODQ2NXxWSVp8REFTSEJPQVJEfGRhOjEzMjU3MzM5) (conta 8558465, todo o grupo tem acesso) · *Alerts → Issues* · *Logs* |

---

## 4. Gravar

Siga o [`ROTEIRO-VIDEO.md`](ROTEIRO-VIDEO.md). Comandos de apoio (nesta pasta):

| Comando | Para a cena |
|---|---|
| `node demo.js status` | Gera dados para o widget "tempo médio por status" (OS percorre os status) |
| `node demo.js falha-email on` → `node demo.js status` → `node demo.js falha-email off` | Widget "erros de integração" + alerta "Falha em integração externa" |
| `node demo.js falha-os on` → `node demo.js falha-os off` | Alerta "Falha no processamento de ordens de serviço" |
| `kubectl get pods,hpa -n prod` | Pods e HPA |

---

## 5. Derrubar (sempre, no mesmo dia)

Na ordem (Actions → Run workflow, branch `master`):

1. App no cluster (libera o que o deploy criou):
   ```powershell
   kubectl delete ingress,hpa,deployment,service,configmap,secret --all -n prod
   ```
2. `oficina-auth-function` → **Auth Function - Destroy** (~2 min)
3. `oficina-mvp-infra-db` → **Oficina IaC DB - Destroy** (~3 min)
4. `oficina-mvp-infra-iac` → **Oficina IaC - Destroy** (~12 min)
5. Conferir que não sobrou nada:
   ```powershell
   bash sweep.sh      # (Git Bash) todas as linhas vazias, exceto o bucket de state e as Lambdas do próprio Lab
   ```
   O bucket de state (`oficina-mvp-tfstate-<sua conta>`) fica de propósito: custa centavos e guarda o histórico.
6. AWS Academy → **End Lab**.

---

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| Workflow falha em *Configure AWS Credentials* ou com `ExpiredToken` | Sessão do Lab expirou / credenciais não coladas | Passo 1 de novo (Start Lab, mandar ao Lucas) |
| `AccessDenied ... voc-cancel-cred` | Sessão do Lab encerrada | Start Lab + passo 1 |
| infra-db: "State do oficina-mvp-infra-iac não encontrado" | infra-iac ainda não subiu nesta conta | Rodar o passo 1 da subida primeiro |
| auth-function: "Cluster EKS ... não encontrado" / "Kong ainda sem endereço" | infra-iac não terminou | Esperar o ✅ do infra-iac (e 1–2 min) e rodar de novo |
| backend: "RDS ... não encontrado" | infra-db não terminou | Esperar o ✅ do infra-db e rodar de novo |
| `kubectl`: `You must be logged in` / `no such host` | Kubeconfig de outro cluster | `aws eks update-kubeconfig --name oficina-mecnica-lab-cluster --region us-east-1` |
| `e2e-test.js`: `503` no health logo após o deploy | Pod ainda subindo (~75 s) | Esperar 1–2 min |
| HPA `cpu: <unknown>` | Métricas ainda chegando | Esperar ~2 min |
| Destroy do infra-iac demora/falha em Load Balancer | App ainda no cluster | Rodar o passo 1 do "Derrubar" e o destroy de novo |

---

## Para o Lucas (dono dos repositórios)

- **Credenciais**: colar os 3 secrets AWS nos 4 repos a cada sessão do Lab (ou `node dono/set-aws-secrets.js`, com
  `GITHUB_TOKEN`).
- **Chave `DEPLOY_ENABLED`** (variable nos 4 repos): `false` (padrão) = merges só testam; `true` = merge em
  `homolog`/`master` faz deploy. O **Run workflow** ignora a chave — quem grava não precisa dela.
- Pasta `dono/`: scripts que gravam no GitHub (`set-aws-secrets.js`, `deploy-key.js`, `run-workflow.js`,
  `set-app-secrets.js`); precisam de `npm install` nessa pasta e de `GITHUB_TOKEN`.
- Nada é fixo de conta: o bucket de state é `oficina-mvp-tfstate-<conta>` (criado pelo infra-iac) e os endereços
  do Kong/RDS são lidos da AWS pelos próprios workflows (plano 18).
