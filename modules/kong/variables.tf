variable "namespace" {
  description = "Namespace onde o Kong será instalado"
  type        = string
  default     = "kong"
}

variable "chart_version" {
  description = "Versão do Helm chart do Kong (repositório https://charts.konghq.com)"
  type        = string
  default     = "2.44.0"
}

variable "proxy_service_type" {
  description = "Tipo do Service do proxy Kong (LoadBalancer expõe via ELB da AWS)"
  type        = string
  default     = "LoadBalancer"
}

variable "extra_objects" {
  description = "Manifests extras instalados pelo próprio release do Kong (extraObjects do chart), depois dos CRDs - ex.: KongConsumer/KongClusterPlugin do ADR-006"
  type        = any
  default     = []
  sensitive   = true
}
