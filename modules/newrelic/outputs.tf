output "namespace" {
  description = "Namespace onde o New Relic (nri-bundle) foi instalado."
  value       = helm_release.newrelic_bundle.namespace
}
