locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Chamada do Módulo ECR
module "ecr" {
  source          = "./modules/ecr"
  repository_name = var.project_name
  tags            = local.common_tags
}

# Chamada do Módulo EKS
module "eks" {
  source       = "./modules/eks"
  cluster_name = "${var.project_name}-cluster"
  lab_role_arn = data.aws_iam_role.lab_role.arn
  subnet_ids   = data.aws_subnets.default.ids
  tags         = local.common_tags
}

# Chamada do Módulo Kong (API Gateway rodando dentro do cluster EKS)
module "kong" {
  source = "./modules/kong"

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