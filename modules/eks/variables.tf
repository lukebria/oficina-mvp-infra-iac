variable "cluster_name" {
  description = "Nome do Cluster EKS"
  type        = string
}

variable "lab_role_arn" {
  description = "ARN da Role do IAM (LabRole do VocLabs)"
  type        = string
}

variable "subnet_ids" {
  description = "Lista de IDs das Subnets para o EKS"
  type        = list(string)
}

variable "instance_types" {
  description = "Tipos de instância dos Worker Nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "desired_size" {
  description = "Quantidade desejada de nós"
  type        = number
  default     = 2
}

variable "node_tags" {
  description = "Tags comuns aplicadas às instâncias EC2 e discos dos nós (via launch template - default_tags do provider não chegam lá)"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags padrões"
  type        = map(string)
  default     = {}
}