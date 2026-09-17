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