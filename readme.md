# 🛠️ Sistema de Gestão de Oficina Mecânica (Oficina MVP)
### Documentação de Arquitetura, Infraestrutura como Código e CI/CD

---

## 📌 1. Visão Geral do Projeto

O **Oficina MVP** é uma plataforma desenvolvida para automatizar e gerenciar o ciclo de vida completo de atendimentos de uma oficina mecânica. A solução abrange desde a recepção do veículo, geração e aprovação de orçamentos, alocação de mecânicos e execução dos serviços até o controle de inventário de peças e faturamento final.

A arquitetura foi projetada seguindo os princípios de **Domain-Driven Design (DDD)**, conteinerizada com **Docker**, orquestrada em **Amazon EKS (Kubernetes)** e provisionada via **Terraform** com pipelines de **GitHub Actions**.

Este repositório cuida de uma parte específica dessa infraestrutura — cluster EKS e repositório ECR. Ver
[Como este repositório se encaixa no projeto](#-4-como-este-repositório-se-encaixa-no-projeto) para o quadro
completo com os outros dois repositórios do desafio.

---

## 🏗️ 2. Infraestrutura como Código (IaC - Terraform)

### 2.1. Estrutura de arquivos

```text
oficina-mvp-infra-iac/
├── modules/
│   ├── ecr/
│   │   ├── main.tf              # Repositório Amazon ECR
│   │   ├── variables.tf         # Variáveis do módulo ECR
│   │   └── outputs.tf           # URL e ARN do repositório ECR
│   ├── eks/
│   │   ├── main.tf              # Cluster EKS e Managed Node Group
│   │   ├── variables.tf         # Variáveis do módulo EKS
│   │   └── outputs.tf           # Endpoints e Autoridade Certificadora
│   └── kong/
│       ├── main.tf              # Helm release do Kong (namespace + helm_release)
│       ├── values.yaml          # Config do chart: DB-less, Ingress Controller, proxy LoadBalancer
│       ├── variables.tf         # Variáveis do módulo Kong
│       └── outputs.tf           # Namespace e nome do release
├── backends.tf                  # Estado remoto do Terraform no S3
├── provider.tf                  # Configuração do provider (AWS ~> 5.0, kubernetes e helm)
├── data_source_vpc.tf           # Data sources: VPC default e subnets
├── data_source_iam.tf           # Data source: LabRole (IAM)
├── main.tf                      # Orquestração dos módulos
├── variables.tf                 # Variáveis globais (com defaults)
├── outputs.tf                   # Saídas consolidadas do projeto
├── .github/workflows/
│   ├── create_iac.yml           # Pipeline de fmt/validate → plan → apply
│   └── destroy_iac.yml          # Pipeline manual de destroy
└── readme.md                    # Este arquivo
```

### 2.2. O que é provisionado

| Recurso | Módulo               | Detalhe                                                                 |
|---------|----------------------|--------------------------------------------------------------------------|
| ECR     | `modules/ecr`        | Repositório `oficina-mecnica-lab`, `scan_on_push` ativado, `force_delete = true` |
| EKS     | `modules/eks`        | Cluster `oficina-mecnica-lab-cluster` + managed node group (`t3.medium`, tamanho desejado 2, máximo 3) |
| Kong (API Gateway) | `modules/kong` | Helm release do Kong (`https://charts.konghq.com`) no namespace `kong`, modo **DB-less** (sem banco próprio) com **Ingress Controller** habilitado — as rotas vêm de recursos `Ingress` declarados no repositório da aplicação (`oficina-mvp-java`), não de configuração manual aqui |

Usa a **VPC default** da conta e a role `LabRole` (fornecida pelo ambiente de laboratório) — não cria nenhuma IAM
role própria.

### 2.3. Ambiente: AWS Academy / Vocareum Learner Lab

Este Terraform foi escrito para rodar numa conta de **laboratório de aprendizado (AWS Academy Learner Lab)**, não
numa conta AWS convencional. Isso molda várias decisões do código:

- As credenciais são **temporárias** (access key + secret key + **session token**) e expiram em poucas horas —
  precisam ser atualizadas manualmente nos secrets do GitHub (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_SESSION_TOKEN`) sempre que a sessão do lab é renovada.
- Não é possível criar roles/policies IAM próprias — cluster e node group reutilizam a `LabRole` já existente na
  conta (`data_source_iam.tf`), em vez de uma role dedicada com o princípio de menor privilégio.
- Usa a VPC default da conta (`data_source_vpc.tf`), filtrando as subnets para excluir a zona `us-east-1e`
  (incompatível com os tipos de instância usados pelo node group nesse ambiente).
- `force_delete = true` no ECR existe para facilitar destruir/recriar o ambiente repetidamente durante o
  desenvolvimento — não é uma configuração recomendada para produção.

### 2.4. State remoto

O state fica no S3 (`backends.tf`): bucket `oficina-mvp-infra-iac`, key `oficina-lab/terraform.tfstate`,
`encrypt = true`.

⚠️ **Não há tabela DynamoDB de lock configurada.** Sem lock, duas execuções simultâneas (por exemplo, um `apply`
manual e um disparo do pipeline ao mesmo tempo) podem corromper o state — evitar rodar em paralelo até isso ser
adicionado.

### 2.5. Variáveis

| Variável       | Default               | Descrição                                              |
|-----------------|------------------------|-----------------------------------------------------------|
| `aws_region`    | `us-east-1`            | Região AWS onde tudo é provisionado                        |
| `project_name`  | `oficina-mecnica-lab`  | Nome base usado no ECR e no cluster (`<project_name>-cluster`) |
| `environment`   | `lab`                  | Ambiente, usado só como tag (`common_tags`)                |

Não há arquivo `terraform.tfvars` — os valores acima são os defaults declarados direto em `variables.tf`; para
sobrescrever, passar `-var` na linha de comando ou criar um `terraform.tfvars` local (ignorado pelo Git).

### 2.6. Outputs

| Output                 | Descrição                       |
|--------------------------|-------------------------------------|
| `ecr_repository_url`    | URL do repositório ECR              |
| `eks_cluster_name`      | Nome do cluster EKS                 |
| `eks_cluster_endpoint`  | Endpoint da API do cluster EKS      |
| `kong_namespace`        | Namespace onde o Kong (API Gateway) foi instalado |

## ⚙️ 3. CI/CD (GitHub Actions)

Dois workflows, ambos exigindo os secrets `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` e a
variável `AWS_DEFAULT_REGION` configurados no repositório:

- **`create_iac.yml`** — três jobs em cadeia: `fmt-validate` (`terraform fmt -check` + `terraform validate`) →
  `plan` → `apply` (este último só roda se o `ref` for `refs/heads/main`).
  ⚠️ Os gatilhos de `pull_request`/`push` estão configurados para a branch `main-disabled`, não `main` — na
  prática, hoje esse workflow só roda via **execução manual** (`workflow_dispatch`). Se isso for intencional
  (evitar `apply` automático consumindo hora de lab sem querer), tudo certo; caso contrário, trocar
  `main-disabled` por `main` nos gatilhos para reativar o plano automático em PR/push.
- **`destroy_iac.yml`** — só dispara manualmente (`workflow_dispatch`), roda `terraform destroy -auto-approve`.

## 🧩 4. Como este repositório se encaixa no projeto

Este é o repositório de infraestrutura (EKS + ECR + Kong) do desafio, referenciado pelos outros dois:

- [`oficina-mvp-java`](https://github.com/lukebria/oficina-mvp-java) — backend Spring Boot. O
  `.github/workflows/app-deploy.yml` de lá assume que o cluster (`oficina-mecnica-lab-cluster`), o repositório
  ECR (`oficina-mecnica-lab`) e o Kong (namespace `kong`) provisionados aqui já existem, e aplica os manifests em
  `k8s/` sobre eles — incluindo o `Ingress` que conecta a aplicação ao Kong (`k8s/ingress.yaml`) e o Postgres,
  que hoje roda como um `Deployment` comum dentro do mesmo cluster (`k8s/banco.yaml`), e **não** é um banco
  gerenciado provisionado por este Terraform.
- [`oficina-auth-function`](https://github.com/lukebria/oficina-auth-function) — Function serverless (Lambda) que
  valida CPF/CNPJ e emite o JWT do fluxo público de cliente. Não depende de nada provisionado aqui — tem seu
  próprio Terraform (Lambda + API Gateway) dentro do próprio repositório. É um **API Gateway distinto do Kong**:
  cada serviço (Lambda vs. aplicação principal no EKS) tem o seu.

### Kong (API Gateway da aplicação principal)

O `modules/kong` sobe o Kong via Helm (`https://charts.konghq.com`) dentro do próprio cluster EKS, sem nenhum
serviço gerenciado novo/billável:

- **Modo DB-less** (`env.database: "off"`) — sem Postgres/Cassandra próprio pro Kong, mais barato e mais simples
  de operar num ambiente de crédito de lab.
- **Ingress Controller habilitado** (`ingressController.enabled: true`) — o Kong descobre as rotas lendo
  recursos `Ingress` padrão do Kubernetes; ele não tem nenhuma rota "hardcoded" aqui. Quem declara o `Ingress` é
  o repositório da aplicação (`oficina-mvp-java/k8s/ingress.yaml`), com `ingressClassName: kong`.
- **`proxy.type: LoadBalancer`** — o Kong ganha seu próprio endereço público (ELB da AWS); o `Service` da
  aplicação principal passou a ser `ClusterIP` (só acessível de dentro do cluster), porque quem recebe tráfego
  externo agora é o Kong.
- Autenticação dos providers `kubernetes`/`helm` (`provider.tf`) usa os outputs do módulo `eks`
  (`cluster_endpoint`, `cluster_certificate_authority_data`) + `data "aws_eks_cluster_auth"` — reaproveita as
  mesmas credenciais AWS (temporárias, do Learner Lab) já usadas pelo provider `aws`.

O plano de organização final do projeto prevê 4 repositórios de infra/app separados (Lambda, infra Kubernetes,
infra de banco gerenciado e a aplicação principal) — ver a seção "Roadmap / TODO" do README do
`oficina-mvp-java` para o detalhe completo. Hoje: este repositório cobre a infra do Kubernetes/ECR; a infra de
banco gerenciado ainda não existe em lugar nenhum.

## 🖼️ 5. Diagrama

![Arquitetura](oficina%20mvp-2.png)

> O diagrama mostra "Terraform Cloud" como backend do state — o backend real hoje é S3 (ver
> [State remoto](#24-state-remoto)). O repositório `oficina-mvp-java-backend` no diagrama corresponde ao
> repositório atual `oficina-mvp-java`, e a function `oficina-auth-function` ainda não está representada aqui.
