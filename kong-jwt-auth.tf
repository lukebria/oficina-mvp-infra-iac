# ==============================================================================
# VALIDAÇÃO DO JWT DE CLIENTE NO KONG (API GATEWAY) — ADR-006
# ==============================================================================
# Decisão registrada em oficina-mvp-java-backend/docs/architecture/adrs/ADR-006:
# o Kong valida a assinatura e a expiração do JWT do cliente (emitido pela Lambda
# oficina-auth-function) via o plugin nativo "jwt", ANTES de rotear a requisição
# para a aplicação principal. É defesa em profundidade: a aplicação continua
# também validando o token e revalidando o status do cliente no banco a cada
# request - nada foi removido do lado da aplicação.
#
# Como o plugin "jwt" do Kong casa o token por um único Consumer (não há um
# Consumer por cliente/CPF - o volume de clientes é dinâmico, não cadastrado no
# Kong), todo cliente compartilha o mesmo Consumer "customer-app" e o mesmo
# segredo. O claim "iss" do token precisa ser igual ao username deste Consumer.
#
# Só protege as rotas públicas de OS (/api/public/service-orders/**) - ver o
# Ingress dedicado com a anotação "konghq.com/plugins" em
# oficina-mvp-java-backend/k8s/ingress-public.yaml. As demais rotas (admin,
# health, endpoint interno da Lambda) continuam passando pelo Ingress geral,
# sem este plugin.
#
# POR QUE VIA HELM (extraObjects) E NÃO kubernetes_manifest: o recurso
# kubernetes_manifest precisa falar com o cluster já no `terraform plan`. Num
# ambiente do zero (cluster ainda inexistente) o plan inteiro falha com
# "Failed to construct REST client" e nada é criado - rodar de novo não
# resolve. Entregando os objetos ao próprio release do Kong (module.kong), o
# Helm instala primeiro os CRDs do chart (pasta crds/) e depois estes objetos,
# tudo na mesma apply, e o plan não depende do cluster existir.
#
# Label da credential: o Kong Ingress Controller 3.x (chart 2.44) reconhece
# "konghq.com/credential"; o antigo "kongCredType" foi removido no KIC 3.0.
# ==============================================================================

locals {
  kong_customer_jwt_objects = [
    {
      apiVersion = "v1"
      kind       = "Secret"
      metadata = {
        name = "customer-jwt-credential"
        labels = {
          "konghq.com/credential" = "jwt"
        }
      }
      type = "Opaque"
      stringData = {
        key       = var.customer_jwt_issuer
        algorithm = "HS256"
        secret    = var.customer_jwt_secret
      }
    },
    {
      apiVersion = "configuration.konghq.com/v1"
      kind       = "KongConsumer"
      metadata = {
        name = var.customer_jwt_issuer
        annotations = {
          "kubernetes.io/ingress.class" = "kong"
        }
      }
      username    = var.customer_jwt_issuer
      credentials = ["customer-jwt-credential"]
    },
    {
      apiVersion = "configuration.konghq.com/v1"
      kind       = "KongClusterPlugin"
      metadata = {
        name = "customer-jwt-auth"
        annotations = {
          "kubernetes.io/ingress.class" = "kong"
        }
        labels = {
          global = "false"
        }
      }
      plugin = "jwt"
      config = {
        claims_to_verify = ["exp"]
      }
    },
  ]
}
