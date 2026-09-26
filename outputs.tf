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
