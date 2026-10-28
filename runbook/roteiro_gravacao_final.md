# Roteiro da gravação final — Tech Challenge Fase 3

**Data**: 28/10/2026 · **Duração do vídeo**: até 15 min

**Divisão**: o **Claude** dispara as pipelines e roda os scripts (a pedido do Lucas). Os **integrantes** gravam
as telas (GitHub Actions, console da AWS, New Relic) enquanto as execuções acontecem.

> Lição de 26–27/10: o Destroy rodou com a sessão do Lab já expirada e falhou. O ambiente ficou de pé a noite
> toda e os nós do EKS quebraram. **A sessão do Lab precisa estar ativa do começo ao fim, inclusive no Destroy.**

> **Links ao vivo**: a cada etapa concluída, o Claude manda no chat os links diretos da execução no GitHub
> Actions e das telas dos recursos recém-criados (EKS, Load Balancer, RDS, Lambda/API Gateway, ECR, Swagger pelo
> Kong, New Relic). Os links do console da AWS só abrem para quem está logado na conta do Lab (botão **AWS** do
> Learner Lab): quem grava as telas da AWS é o dono do Lab, ou outra pessoa vendo a tela compartilhada por ele.

## Links rápidos

| O quê | Link |
|---|---|
| Actions — aplicação Java | https://github.com/lukebria/oficina-mvp-java-backend/actions |
| Actions — infra Kubernetes | https://github.com/lukebria/oficina-mvp-infra-iac/actions |
| Actions — banco | https://github.com/lukebria/oficina-mvp-infra-db/actions |
| Actions — Lambda | https://github.com/lukebria/oficina-auth-function/actions |
| New Relic | https://one.newrelic.com (conta `8558465`, login com o Lucas) |
| Dashboard do projeto | https://one.newrelic.com/dashboards/detail/ODU1ODQ2NXxWSVp8REFTSEJPQVJEfGRhOjEzMjU3MzM5 |

## Dicas gerais de gravação

- **Ferramenta**: OBS Studio, ou a gravação de tela do próprio sistema (Windows: `Win + Alt + R` pela Xbox Game
  Bar; Mac: `Cmd + Shift + 5`). Grave em **1080p**, com o navegador **maximizado** e zoom em **110–125 %**
  (`Ctrl +`) para dar para ler no vídeo.
- **Uma pessoa por tela**: cada integrante grava a sua parte num arquivo separado; o vídeo é montado na edição.
- **Nunca mostre** credenciais: a tela *AWS Details* do Lab, a tela de login do New Relic e os valores de secrets
  no GitHub ou no Secrets Manager.
- **Região da AWS**: sempre **N. Virginia (us-east-1)**, no canto superior direito do console. Se aparecer outra
  região, os recursos "somem".
- **Pausas**: se uma tela demorar a carregar, continue gravando e corte depois. É melhor do que perder o momento.

---

## 0. Antes de começar (não gravado, ~5 min)

### 0.1 Iniciar o Learner Lab — integrante dono do Lab
1. Entrar em https://awsacademy.instructure.com → curso → **Modules** → **Launch AWS Academy Learner Lab**.
2. Clicar em **Start Lab** (canto superior direito) e esperar a bolinha ao lado de "AWS" ficar **verde**
   (~1–2 min). A sessão dura **~4 h**; o tempo restante aparece no topo da tela.

### 0.2 Mandar as credenciais — integrante dono do Lab
1. Na mesma tela do Lab, clicar em **AWS Details** e depois em **Show**, ao lado de "AWS CLI".
2. Copiar o bloco inteiro, que começa com `[default]` e tem 3 linhas (`aws_access_key_id`,
   `aws_secret_access_key`, `aws_session_token`).
3. Mandar **no privado** para o Lucas. O Lucas passa ao Claude.

### 0.3 Conferência e secrets — Claude
- Confere a conta (`aws sts get-caller-identity`) e grava os 3 secrets AWS nos 4 repositórios.

### 0.4 Abrir as telas — integrantes
1. **Console da AWS**: no Lab, clicar no texto **AWS** (com a bolinha verde). Abre o console numa nova aba.
   Conferir a região **us-east-1**.
2. **New Relic**: entrar em https://one.newrelic.com com o login do grupo (pedir ao Lucas).
3. **GitHub**: deixar abertas as abas de *Actions* dos 4 repositórios (links rápidos acima).

### 0.5 Combinar quem grava o quê
| Tela | Integrante |
|---|---|
| GitHub Actions (etapas 1, 2 e 5) | |
| Console da AWS (etapas 3 e 6) | |
| New Relic (etapa 4) | |

---

## 1. Subida da infraestrutura (~20 min)

As pipelines de infra já foram gravadas antes. Aqui é só subir o ambiente, e **dá para gravar se quiserem
material extra**.

| # | Ordem | Repositório / workflow | Tempo aprox. |
|---|---|---|---|
| 1.1 | 1º | `oficina-mvp-infra-iac` → **Oficina IaC - Create** (EKS, ECR, Kong, New Relic) | ~12 min |
| 1.2 | 2º (em paralelo) | `oficina-mvp-infra-db` → **Oficina IaC DB - Create** (RDS PostgreSQL) | ~7 min |
| 1.3 | 2º (em paralelo) | `oficina-auth-function` → **Auth Function - Deploy** (Lambda + API Gateway) | ~1 min |

**Claude**: dispara cada workflow (`Run workflow` na branch `master`), acompanha até ficar verde e avisa o grupo
antes de passar à etapa seguinte.

**Como acompanhar uma execução no GitHub (qualquer integrante)**:
1. Abrir a aba **Actions** do repositório (links rápidos).
2. A execução mais recente aparece no topo da lista, com um círculo **amarelo girando** (rodando). Clicar no nome.
3. A tela mostra os **jobs** em caixinhas ligadas por setas. Clicar num job abre o log, passo a passo.
4. Fica **verde ✅** quando termina com sucesso e **vermelho ❌** se falhar. Se falhar, avisar o Claude.

---

## 2. 🎥 Pipeline da aplicação Java (~6 min) — **GRAVAR**

**Claude**: dispara `oficina-mvp-java-backend` → **Oficina App - Pipeline** (branch `master` → namespace `prod`) e
avisa no grupo "disparei".

**Integrante (GitHub Actions) — como gravar**:
1. **Antes** do disparo, abrir https://github.com/lukebria/oficina-mvp-java-backend/actions e **começar a gravar**.
2. Quando a execução nova aparecer no topo (círculo amarelo), clicar nela. Aparecem os 5 jobs em sequência:
   **1. Run Tests → 2. SonarQube Scan → 3. Build Artifact → 4. Docker Build & ECR Push → 🚀 Deploy to AWS EKS**.
3. Clicar em **1. Run Tests** e mostrar o passo *Run Unit Tests* rodando. Depois voltar ao resumo (*Summary*, no
   menu da esquerda).
4. Quando chegar em **4. Docker Build & ECR Push**, clicar nele e mostrar o passo *Build, Tag and Push Image to
   Amazon ECR*: a imagem leva a **tag do commit**.
5. Quando chegar em **🚀 Deploy to AWS EKS**, clicar nele, expandir *Substitute Secrets and Image URL & Apply K8s
   Manifests* e mostrar no fim do log o `kubectl rollout status` com a mensagem
   `deployment "oficina-app-deployment" successfully rolled out`.
6. Voltar ao *Summary* com tudo verde ✅ e parar a gravação.

**Fala sugerida**: "a pipeline roda testes e análise de qualidade, gera a imagem com a tag do commit, publica no
ECR e faz o deploy no EKS; o job só fica verde quando os pods novos passam no healthcheck."

---

## 3. 🎥 Componentes criados na AWS (~2 min) — **GRAVAR**

**Integrante (console da AWS)**. Para cada item, digite o nome do serviço na **barra de pesquisa do topo do
console** (onde está escrito *Search*) e clique no resultado.

### 3.1 Tag Editor — todos os recursos do projeto numa lista
1. Pesquisar **Tag Editor** e abrir (*Resource Groups & Tag Editor*).
2. Em **Regions**: deixar `us-east-1`.
3. Em **Resource types**: escolher `All supported resource types`.
4. Em **Tags**: em *Tag key* digitar `Project`, em *Optional tag value* digitar `oficina-mvp` e clicar **Add**.
5. Clicar no botão laranja **Search resources**. Rolar devagar pela lista em *Resource search results*.

### 3.2 EKS — cluster Kubernetes
1. Pesquisar **EKS** → **Elastic Kubernetes Service** → menu esquerdo **Clusters** → clicar em
   `oficina-mecnica-lab-cluster`.
2. Mostrar o **Status: Active** e a versão do Kubernetes.
3. Aba **Compute** → seção *Node groups* e *Nodes*: os **2 nós** `Ready`.
4. Aba **Resources** → *Workloads* → **Deployments**: no filtro de namespace, escolher `prod` e mostrar
   `oficina-app-deployment`. Em *Pods*, mostrar o pod `Running`.

### 3.3 Load Balancer do Kong (API Gateway da aplicação)
1. Pesquisar **EC2** → menu esquerdo, seção *Load Balancing* → **Load Balancers**.
2. Clicar no load balancer da lista e mostrar o **DNS name**. É o endereço público do Kong, por onde passam todas
   as chamadas da API.

### 3.4 RDS — banco PostgreSQL
1. Pesquisar **RDS** → menu esquerdo **Databases** → clicar em `oficina-mecnica-lab-postgres`.
2. Mostrar **Status: Available**, **Engine: PostgreSQL** e, na aba *Connectivity & security*, o **Endpoint**.

### 3.5 Lambda + API Gateway — autenticação por CPF
1. Pesquisar **Lambda** → **Functions** → clicar em `oficina-auth-function`. Mostrar o diagrama no topo, com o
   **API Gateway** como gatilho (*trigger*).
2. Pesquisar **API Gateway** → clicar em `oficina-auth-function-api` → menu esquerdo **Routes** → mostrar a rota
   `POST /authenticate`.

### 3.6 ECR — imagens Docker
1. Pesquisar **ECR** → **Elastic Container Registry** → **Repositories** → clicar em `oficina-mecnica-lab`.
2. Mostrar a imagem mais recente: a **Image tag** é o hash do commit da pipeline da etapa 2.

### 3.7 Secrets Manager — senha do banco
1. Pesquisar **Secrets Manager** → mostrar o secret `oficina-mecnica-lab-rds-password` na lista.
2. **Não clicar em "Retrieve secret value"**. Basta mostrar que a senha é gerenciada pela AWS.

---

## 4. 🎥 Fluxo completo da aplicação + New Relic (~5 min) — **GRAVAR**

**Claude**: roda o script de massa de dados por ~10–15 min, para os gráficos ficarem "ao vivo", e avisa no grupo
"script rodando":
`node runbook/scripts/massa-dados-backend.js 10 15`

O que o script faz em cada OS:
- abre a OS, criando cliente com CPF válido inventado e veículo com placa aleatória;
- chama a Lambda com CPF inválido (400), sem cadastro (404) e válido (JWT);
- faz a consulta pública sem token e com token adulterado (401, barrado no Kong) e com o token da Lambda (200);
- segue um cenário sorteado: completo até ENTREGUE, cliente aprova ou recusa pela rota pública, em execução,
  ou aguardando aprovação.

**Integrante (New Relic)**. As métricas levam ~1 min para aparecer, então comece a gravar **uns 2 min depois**
do aviso "script rodando". No canto superior direito de cada tela do New Relic, deixe o período em
**Last 30 minutes**.

### 4.1 Dashboard (Negócio + Operação)
1. Abrir o link do dashboard (links rápidos) ou menu esquerdo **Dashboards** → `Oficina MVP - Tech Challenge Fase 3`.
2. Página **Negócio** (abas no topo do dashboard): mostrar *OS criadas hoje*, *Volume diário de ordens de serviço*,
   *Tempo médio por status* (Diagnóstico, Execução, Finalização) e *Falhas de integração por tipo*.
3. Clicar na aba **Operação**: mostrar *Latência das APIs p50/p95*, *Throughput (req/min)*, *CPU por pod*,
   *Memória por pod*, *Réplicas do HPA* e o widget *Logs da aplicação*.

### 4.2 APM — desempenho da aplicação
1. Menu esquerdo **APM & Services** → clicar em `oficina-mvp-backend`.
2. Na tela *Summary*: mostrar os gráficos de **tempo de resposta**, **throughput** e **taxa de erro**.
3. Menu do serviço → **Distributed tracing** → clicar num trace de `POST /api/service-orders` (abertura de OS) e
   mostrar os **spans**: a requisição passando pela aplicação até o banco.

### 4.3 Logs
1. Menu esquerdo **Logs**.
2. Na barra de busca, filtrar os logs da aplicação: `namespace_name:"prod"` → Enter.
3. Mostrar os logs chegando em tempo real. Clicar numa linha para abrir o detalhe (campos JSON e `trace.id`, que
   liga o log ao trace do APM).

### 4.4 Kubernetes
1. Menu esquerdo **Kubernetes** (ou *All entities* → *Kubernetes clusters*) → clicar no cluster.
2. Mostrar os **nós**, os **pods** do namespace `prod` e o uso de CPU e memória.

### 4.5 Alertas
1. Menu esquerdo **Alerts** → **Alert Policies** → `Oficina MVP - Alertas`.
2. Mostrar as 3 condições: *Falha no processamento de ordens de serviço*, *Falha em integração externa* e
   *Aplicação indisponível (healthcheck/uptime)*, com notificação por e-mail.

**Opcional — gravar o terminal do script**: se o Lucas compartilhar a tela, mostrar a saída do script com os ✅
de cada chamada (clientes inventados, 401 do Kong, aprovação/recusa pelo cliente).

---

## 5. 🎥 Destroy (~15 min) — **GRAVAR**

Ordem inversa da subida. Antes de começar, **o dono do Lab confere o tempo restante da sessão** no topo da tela
do Learner Lab (precisa de pelo menos 30 min).

| # | Ordem | Repositório / workflow |
|---|---|---|
| 5.1 | 1º (em paralelo) | `oficina-auth-function` → **Auth Function - Destroy** |
| 5.2 | 1º (em paralelo) | `oficina-mvp-infra-db` → **Oficina IaC DB - Destroy** |
| 5.3 | 2º | `oficina-mvp-infra-iac` → **Oficina IaC - Destroy** (EKS, Kong, ECR; leva junto a aplicação do cluster) |

**Claude**: dispara e acompanha cada um. Se algum falhar, para tudo e investiga antes de repetir.

**Integrante (GitHub Actions)**: como na etapa 2, abrir a aba *Actions* de cada repositório, clicar na execução de
Destroy e mostrar no log do passo de Terraform a linha final
`Destroy complete! Resources: N destroyed.` Gravar o *Summary* verde ✅ de cada um.

---

## 6. 🎥 Prova de que tudo foi destruído (~2 min) — **GRAVAR**

**Claude**: roda o `sweep.sh` do runbook do repo (`oficina-mvp-infra-iac/runbook/scripts/sweep.sh`) e confirma
zero recursos do projeto na conta.

**Integrante (console da AWS)**: repetir as telas da etapa 3, agora vazias. Use **F5** para atualizar cada página.
1. **Tag Editor** com a mesma busca (`Project` = `oficina-mvp`) → *Search resources* → mensagem de **nenhum
   recurso encontrado**.
2. **EKS → Clusters** → lista vazia.
3. **RDS → Databases** → lista vazia (se aparecer `Deleting`, esperar um pouco e atualizar).
4. **Lambda → Functions** → `oficina-auth-function` não aparece mais.
5. **EC2 → Instances** → só instâncias **Terminated**, se aparecerem (elas somem sozinhas depois de ~1 h).
6. **EC2 → Load Balancers** → lista vazia.

**Lucas**: voltar a chave `DEPLOY_ENABLED` para `false`, se tiver sido ligada.

---

## 7. Depois da gravação

- [ ] **Encerrar o Lab**: o dono do Lab clica em **End Lab**, só depois que a etapa 6 confirmar tudo destruído.
- [ ] Editar o vídeo (até 15 min) e subir no YouTube como **não listado**.
- [ ] Colocar o link do vídeo no PDF de entrega (rascunho no Claude Docs) e preencher grupo/integrantes.
- [ ] Conferir se o `soat-architecture` aceitou o convite nos 4 repositórios.
- [ ] Trocar a senha do New Relic e revogar o token do GitHub (`token_github.txt`) após a entrega.

## Tempo total estimado

~55–60 min de execução (subida ~25 min, demo ~15 min, destroy ~15 min). Cabe com folga numa sessão de ~4 h do Lab.
