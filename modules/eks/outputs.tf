output "cluster_name" {
  description = "Nome do Cluster EKS"
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "Endpoint do Cluster EKS"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Dados do CA do Cluster"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "cluster_security_group_id" {
  description = "Security Group criado automaticamente pelo EKS para o cluster (usado para liberar acesso de outros recursos, ex: RDS)"
  value       = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}