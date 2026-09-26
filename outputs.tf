output "ecr_repository_url" {
  description = "URL do Repositório ECR"
  value       = module.ecr.repository_url
}

output "eks_cluster_name" {
  description = "Nome do Cluster EKS"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint do Cluster EKS"
  value       = module.eks.cluster_endpoint
}

output "kong_namespace" {
  description = "Namespace onde o Kong (API Gateway) foi instalado"
  value       = module.kong.namespace
}

output "homolog_namespace" {
  description = "Namespace de homologação (deploy da aplicação principal)"
  value       = kubernetes_namespace.homolog.metadata[0].name
}

output "prod_namespace" {
  description = "Namespace de produção (deploy da aplicação principal)"
  value       = kubernetes_namespace.prod.metadata[0].name
}

output "terraform_lock_table_name" {
  description = "Nome da tabela DynamoDB de lock do state (usar em backends.tf apos a Fase 1 aplicar, ver dynamodb.tf)"
  value       = aws_dynamodb_table.terraform_lock.name
}

output "vpc_id" {
  description = "ID da VPC default usada pelo cluster (consumido via terraform_remote_state pelo repo oficina-mvp-infra-db)"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "IDs das subnets usadas pelo cluster EKS (consumido via terraform_remote_state pelo repo oficina-mvp-infra-db)"
  value       = data.aws_subnets.default.ids
}

output "eks_cluster_security_group_id" {
  description = "Security Group do cluster EKS - usado pelo repo oficina-mvp-infra-db para liberar acesso do RDS só a partir do cluster"
  value       = module.eks.cluster_security_group_id
}
