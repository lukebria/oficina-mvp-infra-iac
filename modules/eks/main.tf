resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  role_arn = var.lab_role_arn

  vpc_config {
    subnet_ids = var.subnet_ids
  }

  tags = merge(var.tags, {
    Name        = "oficina-mvp-eks"
    Description = "Cluster Kubernetes que roda o Kong e a aplicacao (namespaces homolog/prod)"
  })
}

# Launch template mínimo, só para dar Name/Description às instâncias EC2 e aos discos dos nós: as tags do
# aws_eks_node_group não são propagadas para as instâncias (no console elas apareciam sem nome). Tipo de
# instância continua no node group; AMI e disco continuam os padrões do EKS.
resource "aws_launch_template" "nodes" {
  name_prefix = "${var.cluster_name}-nodes-"
  description = "Tags das maquinas (EC2) do node group do EKS"

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.node_tags, {
      Name        = "oficina-mvp-eks-node"
      Description = "Maquina worker do cluster EKS (roda Kong, app, metrics-server e New Relic)"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.node_tags, {
      Name        = "oficina-mvp-eks-node-disk"
      Description = "Disco da maquina worker do cluster EKS"
    })
  }

  tags = merge(var.tags, {
    Name        = "oficina-mvp-eks-nodes-template"
    Description = "Launch template que etiqueta as EC2 do node group do EKS"
  })
}

resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = var.lab_role_arn
  subnet_ids      = var.subnet_ids

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.desired_size + 1
    min_size     = 1
  }

  instance_types = var.instance_types

  launch_template {
    id      = aws_launch_template.nodes.id
    version = aws_launch_template.nodes.latest_version
  }

  tags = merge(var.tags, {
    Name        = "oficina-mvp-eks-nodes"
    Description = "Grupo de maquinas (EC2) do cluster EKS"
  })
}