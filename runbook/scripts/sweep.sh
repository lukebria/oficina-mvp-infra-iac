#!/usr/bin/env bash
# Varredura da conta AWS depois do destroy (passo "Derrubar" do RUNBOOK.md): lista tudo que costuma cobrar.
# Esperado: todas as linhas vazias. Sobram de propósito: o bucket de state (centavos/mês) e as Lambdas/log groups do
# próprio AWS Academy (ModLabRole, MainMonitoringFunction, RoleCreationFunction, Redshift*) - NÃO apagar esses.
# Uso: bash sweep.sh
set -u
echo "Conta: $(aws sts get-caller-identity --query Account --output text)  (confira se é a do seu Lab)"
echo "EKS clusters ........: $(aws eks list-clusters --query clusters --output text)"
echo "EC2 ativas ..........: $(aws ec2 describe-instances --filters Name=instance-state-name,Values=pending,running,stopping,stopped --query 'Reservations[].Instances[].InstanceId' --output text)"
echo "Load Balancers (v1) .: $(aws elb describe-load-balancers --query 'LoadBalancerDescriptions[].LoadBalancerName' --output text)"
echo "Load Balancers (v2) .: $(aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName' --output text)"
echo "Elastic IPs .........: $(aws ec2 describe-addresses --query 'Addresses[].PublicIp' --output text)"
echo "Volumes EBS .........: $(aws ec2 describe-volumes --query 'Volumes[].VolumeId' --output text)"
echo "NAT Gateways ........: $(aws ec2 describe-nat-gateways --filter Name=state,Values=pending,available --query 'NatGateways[].NatGatewayId' --output text)"
echo "RDS .................: $(aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier' --output text)"
echo "RDS snapshots manuais: $(aws rds describe-db-snapshots --snapshot-type manual --query 'DBSnapshots[].DBSnapshotIdentifier' --output text)"
echo "API Gateway (HTTP) ..: $(aws apigatewayv2 get-apis --query 'Items[].Name' --output text)"
echo "DynamoDB ............: $(aws dynamodb list-tables --query TableNames --output text)"
echo "ECR .................: $(aws ecr describe-repositories --query 'repositories[].repositoryName' --output text)"
echo "Secrets Manager .....: $(aws secretsmanager list-secrets --include-planned-deletion --query 'SecretList[].Name' --output text)"
echo "Lambdas (só as do Lab devem aparecer): $(aws lambda list-functions --query 'Functions[].FunctionName' --output text)"
echo "S3 (só o bucket de state deve aparecer): $(aws s3 ls | awk '{print $3}' | tr '\n' ' ')"
