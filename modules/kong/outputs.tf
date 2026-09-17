output "namespace" {
  description = "Namespace onde o Kong foi instalado"
  value       = kubernetes_namespace.kong.metadata[0].name
}

output "release_name" {
  description = "Nome do release Helm do Kong"
  value       = helm_release.kong.name
}
