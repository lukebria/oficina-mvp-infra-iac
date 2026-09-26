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
