resource "aws_ecr_repository" "this" {
  name                 = var.repository_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Permite remoção forçada em ambiente de lab

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.tags, {
    Name        = "oficina-mvp-ecr"
    Description = "Imagens Docker da aplicacao Java (oficina-mvp-java-backend)"
  })
}