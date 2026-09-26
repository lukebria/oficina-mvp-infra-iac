variable "license_key" {
  description = "License Key da conta New Relic (sensível)."
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  description = "Nome do cluster, usado como tag global.cluster no New Relic."
  type        = string
}
