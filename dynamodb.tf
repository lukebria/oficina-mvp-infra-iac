# ==============================================================================
# LOCK DO STATE REMOTO (DynamoDB)
# ==============================================================================
# Tabela usada para lock do state do Terraform (backend S3, ver backends.tf).
# Decisão registrada em plans/00-decisoes-tecnicas.md do projeto: manter S3 e
# adicionar lock via DynamoDB (em vez de migrar para Terraform Cloud). Billing
# PAY_PER_REQUEST + tabela de 1 item cabem folgados no free tier permanente da
# AWS, sem custo adicional relevante no crédito do lab.
#
# BOOTSTRAP EM 2 FASES (evita o problema de "ovo e galinha" de referenciar uma
# tabela de lock que ainda não existe):
#   Fase 1 (este arquivo): cria a tabela usando o backend atual, sem lock.
#   Fase 2 (manual, depois que a Fase 1 aplicar com sucesso): adicionar
#     `dynamodb_table = "oficina-mvp-infra-iac-tf-lock"` em backends.tf e rodar
#     `terraform init -migrate-state`. Só faz sentido depois que a tabela já
#     existir de fato na conta - por isso não entra no mesmo commit.
# ==============================================================================

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "oficina-mvp-infra-iac-tf-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "oficina-mvp-tf-lock"
    Description = "Lock do state do Terraform (compartilhado pelos 3 repos de infra)"
  }
}
