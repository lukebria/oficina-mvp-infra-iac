# ==============================================================================
# NEW RELIC - INTEGRAÇÃO COM KUBERNETES (nri-bundle)
# ==============================================================================
# Instala o agente de infraestrutura, kube-state-metrics e o forwarder de logs
# (Fluent Bit) via o chart oficial da New Relic. Chamado só quando
# var.license_key não está vazia (ver main.tf raiz, module "newrelic" com
# count) - sem chave, não faz sentido instalar um agente que não vai
# autenticar em lugar nenhum.
# ==============================================================================

resource "helm_release" "newrelic_bundle" {
  name             = "newrelic-bundle"
  repository       = "https://helm-charts.newrelic.com"
  chart            = "nri-bundle"
  namespace        = "newrelic"
  create_namespace = true

  set {
    name  = "global.licenseKey"
    value = var.license_key
  }

  set {
    name  = "global.cluster"
    value = var.cluster_name
  }

  set {
    name  = "newrelic-infrastructure.enabled"
    value = "true"
  }

  set {
    name  = "kube-state-metrics.enabled"
    value = "true"
  }

  set {
    name  = "newrelic-logging.enabled"
    value = "true"
  }

  set {
    name  = "kubeEvents.enabled"
    value = "true"
  }

  # Desabilitados de propósito: reduzem custo/consumo de recursos num cluster de lab pequeno.
  # Reavaliar se o volume de dados/uso justificar.
  set {
    name  = "newrelic-prometheus-agent.enabled"
    value = "false"
  }

  set {
    name  = "newrelic-pixie.enabled"
    value = "false"
  }

  set {
    name  = "pixie-chart.enabled"
    value = "false"
  }
}
