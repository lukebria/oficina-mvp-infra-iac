# ==============================================================================
# BACKEND CONFIGURATION
# ==============================================================================
# Guarda o estado do Terraform (tfstate) de forma remota e segura no Amazon S3.
# O bucket NÃO fica fixo aqui (plano 18): é oficina-mvp-tfstate-<conta AWS>, calculado e criado pelo
# scripts/state-bucket.sh e passado no init (-backend-config="bucket=..."), para funcionar no Lab de qualquer
# integrante. Local: terraform init -backend-config="bucket=$(scripts/state-bucket.sh)"
# ==============================================================================

terraform {
  backend "s3" {
    key     = "oficina-lab/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
