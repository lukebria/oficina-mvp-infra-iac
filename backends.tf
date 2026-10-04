# ==============================================================================
# BACKEND CONFIGURATION
# ==============================================================================
# Guarda o estado do Terraform (tfstate) de forma remota e segura no Amazon S3.
# ==============================================================================

terraform {
  backend "s3" {
    bucket  = "oficina-mvp-tfstate-536036031274"
    key     = "oficina-lab/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
