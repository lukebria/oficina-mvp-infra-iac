variable "chart_version" {
  description = "Versão do Helm chart do metrics-server (repositório https://kubernetes-sigs.github.io/metrics-server/)"
  type        = string
  default     = "3.14.0"
}
