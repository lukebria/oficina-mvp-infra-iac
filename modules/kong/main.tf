resource "kubernetes_namespace" "kong" {
  metadata {
    name = var.namespace
  }
}

resource "helm_release" "kong" {
  name       = "kong"
  repository = "https://charts.konghq.com"
  chart      = "kong"
  version    = var.chart_version
  namespace  = kubernetes_namespace.kong.metadata[0].name

  values = [file("${path.module}/values.yaml")]

  set {
    name  = "proxy.type"
    value = var.proxy_service_type
  }
}
