# ==============================================================================
# NAMESPACES DE AMBIENTE (homolog / prod)
# ==============================================================================
# Separação de homologação e produção dentro do mesmo cluster EKS. Decisão
# registrada em plans/00-decisoes-tecnicas.md do projeto: namespaces no mesmo
# cluster em vez de clusters/contas separados por ambiente (o control plane do
# EKS já tem custo por hora mesmo fora de free tier - dobrar isso não cabe na
# restrição de crédito do AWS Academy Learner Lab).
#
# O deploy da aplicação principal (repositório oficina-mvp-java-backend) usa
# estes namespaces via `kubectl apply -n homolog` / `-n prod`, escolhido a
# partir da branch de origem do push (ver plans/04-app-java-fase3.md).
# ==============================================================================

resource "kubernetes_namespace" "homolog" {
  metadata {
    name = "homolog"
    labels = {
      environment = "homolog"
      managed-by  = "terraform"
    }
  }

  depends_on = [module.eks]
}

resource "kubernetes_namespace" "prod" {
  metadata {
    name = "prod"
    labels = {
      environment = "prod"
      managed-by  = "terraform"
    }
  }

  depends_on = [module.eks]
}
