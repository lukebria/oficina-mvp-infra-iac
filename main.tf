# Tags comuns a todo recurso AWS deste repo (via default_tags do provider, ver provider.tf) - padrão do projeto
# (plano 11): mesmo Project nos 3 repos de Terraform, para filtrar tudo no Tag Editor com Project = oficina-mvp.
# Cada recurso ainda recebe Name + Description dizendo o que é.
locals {
  common_tags = {
    Project     = "oficina-mvp"
    Repository  = "oficina-mvp-infra-iac"
    Component   = "kubernetes"
    Environment = var.environment
    ManagedBy   = "terraform"
    Course      = "FIAP POSTECH 13SOAT - Tech Challenge Fase 3"
  }
}

# Chamada do Módulo ECR
module "ecr" {
  source          = "./modules/ecr"
  repository_name = var.project_name
}

# Chamada do Módulo EKS
module "eks" {
  source       = "./modules/eks"
  cluster_name = "${var.project_name}-cluster"
  lab_role_arn = data.aws_iam_role.lab_role.arn
  subnet_ids   = data.aws_subnets.default.ids
  # default_tags do provider não chegam às instâncias EC2 criadas pelo node group - o módulo repassa via launch template
  node_tags = local.common_tags
}

# Chamada do Módulo Kong (API Gateway rodando dentro do cluster EKS)
module "kong" {
  source = "./modules/kong"

  # Consumer + credential + plugin JWT do cliente (ADR-006), ver kong-jwt-auth.tf
  extra_objects = local.kong_customer_jwt_objects

  depends_on = [module.eks]
}

# Chamada do Módulo metrics-server (pré-requisito do HPA da aplicação - sem ele o HPA não lê CPU e não escala)
module "metrics_server" {
  source = "./modules/metrics-server"

  depends_on = [module.eks]
}

# Chamada do Módulo New Relic (observabilidade do cluster) - só instala quando uma License Key for
# configurada (var.new_relic_license_key não vazia); sem ela, count = 0 e nada é criado. Decisão registrada
# em plans/00-decisoes-tecnicas.md / plans/05-observabilidade-new-relic.md (projeto de specs).
module "newrelic" {
  count  = var.new_relic_license_key != "" ? 1 : 0
  source = "./modules/newrelic"

  license_key  = var.new_relic_license_key
  cluster_name = "${var.project_name}-cluster"

  depends_on = [module.eks]
}