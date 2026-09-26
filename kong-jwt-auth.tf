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
# NOTA IMPORTANTE (não testado em cluster real ainda): os CRDs do Kong
# (KongConsumer/KongClusterPlugin) são instalados pelo próprio Helm release do
# Kong (module.kong) na MESMA apply que cria estes recursos. O provider nativo
# do Kubernetes para "kubernetes_manifest" precisa inspecionar o schema do CRD
# no momento do plan/refresh - num cluster totalmente novo, isso pode falhar na
# primeira tentativa ("no matches for kind KongConsumer/KongClusterPlugin") só
# porque o CRD ainda não estava registrado quando o provider tentou. Solução
# conhecida e simples: rodar `terraform apply` DE NOVO logo em seguida (idempo-
# tente) - na segunda vez o CRD já existe e o provider consegue validar. Mesmo
# padrão de bootstrap em 2 fases já usado para o lock do DynamoDB (dynamodb.tf).
# ==============================================================================

resource "kubernetes_manifest" "customer_jwt_credential_secret" {
  manifest = {
    apiVersion = "v1"
    kind       = "Secret"
    metadata = {
      name      = "customer-jwt-credential"
      namespace = module.kong.namespace
      labels = {
        kongCredType = "jwt"
      }
    }
    type = "Opaque"
    stringData = {
      key       = var.customer_jwt_issuer
      algorithm = "HS256"
      secret    = var.customer_jwt_secret
    }
  }

  depends_on = [module.kong]
}

resource "kubernetes_manifest" "customer_kong_consumer" {
  manifest = {
    apiVersion = "configuration.konghq.com/v1"
    kind       = "KongConsumer"
    metadata = {
      name      = var.customer_jwt_issuer
      namespace = module.kong.namespace
    }
    username    = var.customer_jwt_issuer
    credentials = ["customer-jwt-credential"]
  }

  depends_on = [module.kong, kubernetes_manifest.customer_jwt_credential_secret]
}

resource "kubernetes_manifest" "customer_jwt_cluster_plugin" {
  manifest = {
    apiVersion = "configuration.konghq.com/v1"
    kind       = "KongClusterPlugin"
    metadata = {
      name = "customer-jwt-auth"
      labels = {
        global = "false"
      }
    }
    plugin = "jwt"
    config = {
      claims_to_verify = ["exp"]
    }
  }

  depends_on = [module.kong]
}
