output "release_name" {
  description = "Nome do release Helm do metrics-server"
  value       = helm_release.metrics_server.name
}
