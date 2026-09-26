variable "aws_region" {
  description = "Região AWS padrão"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nome base do projeto"
  type        = string
  default     = "oficina-mecnica-lab"
}

variable "environment" {
  description = "Ambiente de execução"
  type        = string
  default     = "lab"
}

variable "customer_jwt_secret" {
  description = "Segredo (HS256) do JWT de cliente - mesmo valor de CUSTOMER_JWT_SECRET em oficina-auth-function e oficina-mvp-java-backend. Usado para o Kong validar o token na borda (ADR-006)."
  type        = string
  sensitive   = true
}

variable "customer_jwt_issuer" {
  description = "Claim 'iss' do JWT de cliente - vira o username do KongConsumer. Precisa bater com CUSTOMER_JWT_ISSUER em oficina-auth-function."
  type        = string
  default     = "customer-app"
}