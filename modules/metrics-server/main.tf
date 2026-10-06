# ==============================================================================
# METRICS-SERVER (pré-requisito do HPA)
# ==============================================================================
# O EKS não vem com o metrics-server: sem ele o HPA da aplicação fica com
# "cpu: <unknown>" e nunca escala (visto no primeiro deploy real, 2026-10-04).
# Instalado via chart Helm oficial (kubernetes-sigs) porque o AWS Academy
# Learner Lab nega a API de add-ons do EKS (eks:DescribeAddonVersions ->
# AccessDeniedException). Detalhe em plans/09-metrics-server-hpa.md (projeto de
# specs).
# ==============================================================================

resource "helm_release" "metrics_server" {
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  version    = var.chart_version
  namespace  = "kube-system"
}
