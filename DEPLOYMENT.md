# Healthcare Gen AI POC - Deployment Guide

## Prerequisites

### Required Tools
- Azure CLI (v2.50+)
- Terraform (v1.5+)
- Node.js (v18+)
- Python 3.10+
- Docker
- kubectl (for AKS deployment)

### Azure Subscriptions & Permissions
- Azure subscription with Owner or Contributor role
- Azure AD permissions to create service principals
- Quota for:
  - Azure OpenAI (GPT-4)
  - Azure Databricks Premium
  - Azure Machine Learning

### Azure OpenAI Access
You must have approved access to Azure OpenAI in your subscription:
```bash
# Request access at: https://aka.ms/oai/access
# Allow 48 hours for approval
```

## Deployment Steps

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd healthcare-genai-poc

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install
```

### 2. Azure Authentication

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "<your-subscription-id>"

# Create service principal for Terraform
az ad sp create-for-rbac --name "healthcare-genai-terraform" \
  --role Contributor \
  --scopes /subscriptions/<subscription-id>

# Save the output - you'll need these credentials
```

### 3. Configure Environment Variables

Create `.env` file:
```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_KEY=<your-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Azure Storage (Delta Lake)
AZURE_STORAGE_ACCOUNT=<storage-account-name>
AZURE_STORAGE_KEY=<storage-key>
AZURE_STORAGE_CONTAINER=delta-tables

# Azure Key Vault
AZURE_KEY_VAULT_URI=https://<vault-name>.vault.azure.net/

# Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string>

# Environment
ENVIRONMENT=poc
LOCATION=uksouth
```

### 4. Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
subscription_id = "<your-subscription-id>"
location        = "UK South"
environment     = "poc"
project_name    = "healthcare-genai"
EOF

# Plan deployment
terraform plan -out=tfplan

# Apply deployment
terraform apply tfplan

# Save outputs
terraform output -json > ../config/terraform-outputs.json
```

Expected deployment time: 15-20 minutes

### 5. Setup Databricks

```bash
# Get Databricks workspace URL from Terraform output
DATABRICKS_URL=$(terraform output -raw databricks_workspace_url)

# Login to Databricks
databricks configure --token

# Create cluster configuration
cat > cluster-config.json <<EOF
{
  "cluster_name": "healthcare-analytics-cluster",
  "spark_version": "13.3.x-scala2.12",
  "node_type_id": "Standard_DS3_v2",
  "num_workers": 2,
  "autotermination_minutes": 30,
  "spark_conf": {
    "spark.databricks.delta.preview.enabled": "true",
    "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
    "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog"
  },
  "custom_tags": {
    "Project": "healthcare-genai",
    "Environment": "poc"
  }
}
EOF

# Create cluster
databricks clusters create --json-file cluster-config.json

# Upload notebooks
databricks workspace import_dir ./databricks/notebooks /Workspace/healthcare-genai/

# Install libraries on cluster
databricks libraries install --cluster-id <cluster-id> \
  --pypi-package delta-spark \
  --pypi-package azure-storage-blob \
  --pypi-package openai
```

### 6. Initialize Delta Lake Tables

```bash
# Run setup notebook in Databricks
databricks runs submit \
  --notebook-path /Workspace/healthcare-genai/setup_delta_tables \
  --cluster-id <cluster-id>

# Or run locally with Spark
python delta_lake_queries.py
```

### 7. Deploy Backend API

#### Option A: Azure Container Apps

```bash
# Build Docker image
docker build -t healthcare-genai-api:latest -f Dockerfile.api .

# Tag for Azure Container Registry
docker tag healthcare-genai-api:latest \
  <registry-name>.azurecr.io/healthcare-genai-api:latest

# Push to ACR
az acr login --name <registry-name>
docker push <registry-name>.azurecr.io/healthcare-genai-api:latest

# Deploy to Container Apps
az containerapp create \
  --name healthcare-genai-api \
  --resource-group <resource-group> \
  --environment <container-app-env> \
  --image <registry-name>.azurecr.io/healthcare-genai-api:latest \
  --target-port 8000 \
  --ingress external \
  --env-vars \
    AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT \
    AZURE_OPENAI_KEY=secretref:openai-key
```

#### Option B: Local Development

```bash
# Install FastAPI dependencies
pip install fastapi uvicorn python-multipart

# Run API locally
uvicorn backend_api:app --reload --port 8000

# API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 8. Deploy Frontend

#### Option A: Azure Static Web Apps

```bash
# Build React app
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp create \
  --name healthcare-genai-frontend \
  --resource-group <resource-group> \
  --source ./build \
  --location uksouth \
  --branch main \
  --app-location "/" \
  --output-location "build"

# Configure API endpoint
az staticwebapp appsettings set \
  --name healthcare-genai-frontend \
  --setting-names API_ENDPOINT=https://<api-url>
```

#### Option B: Local Development

```bash
# Set API endpoint
export REACT_APP_API_ENDPOINT=http://localhost:8000

# Start development server
npm start

# Application will open at http://localhost:3000
```

### 9. Configure Azure AD Authentication

```bash
# Register application
az ad app create \
  --display-name "Healthcare Gen AI POC" \
  --web-redirect-uris https://<frontend-url>/auth/callback

# Create service principal
az ad sp create --id <app-id>

# Configure authentication in frontend
# Update src/config/auth.ts with:
# - tenantId
# - clientId
# - redirectUri
```

### 10. Setup Monitoring

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app healthcare-genai-insights \
  --location uksouth \
  --resource-group <resource-group> \
  --application-type web

# Configure alerts
az monitor metrics alert create \
  --name "High API Latency" \
  --resource-group <resource-group> \
  --scopes <api-resource-id> \
  --condition "avg requests/duration > 1000" \
  --window-size 5m \
  --evaluation-frequency 1m
```

## Post-Deployment Configuration

### 1. Load Sample Data

```bash
# Run data ingestion script
python scripts/load_sample_data.py \
  --storage-account <account-name> \
  --container delta-tables \
  --data-path ./sample_data/

# Verify data loaded
python scripts/verify_data.py
```

### 2. Test Gen AI Integration

```bash
# Run integration tests
pytest tests/integration/ -v

# Test API endpoints
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me patient admission trends",
    "conversation_history": []
  }'
```

### 3. Configure RBAC

```bash
# Create custom role for healthcare analytics
az role definition create --role-definition '{
  "Name": "Healthcare Analytics User",
  "Description": "Can query healthcare analytics data",
  "Actions": [
    "Microsoft.CognitiveServices/accounts/OpenAI/deployments/chat/completions/action",
    "Microsoft.Storage/storageAccounts/blobServices/containers/read"
  ],
  "AssignableScopes": ["/subscriptions/<subscription-id>"]
}'

# Assign role to users
az role assignment create \
  --assignee <user-or-group-id> \
  --role "Healthcare Analytics User" \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>
```

## Verification Checklist

- [ ] Azure OpenAI endpoint responding
- [ ] Databricks cluster running
- [ ] Delta Lake tables created and accessible
- [ ] Backend API health check passing
- [ ] Frontend loading and connecting to API
- [ ] Sample queries returning results
- [ ] Visualizations rendering correctly
- [ ] Authentication working (if configured)
- [ ] Monitoring dashboards showing data
- [ ] Alerts configured and testing

## Troubleshooting

### Issue: Azure OpenAI 429 Errors

```bash
# Check quota
az cognitiveservices account list-usage \
  --name <openai-resource> \
  --resource-group <rg-name>

# Increase TPM if needed (requires support ticket)
```

### Issue: Databricks Connection Timeout

```bash
# Check network connectivity
az network vnet show \
  --name <vnet-name> \
  --resource-group <rg-name>

# Verify subnet delegation
az network vnet subnet show \
  --name databricks-public-subnet \
  --vnet-name <vnet-name> \
  --resource-group <rg-name>
```

### Issue: Delta Lake Tables Not Found

```python
# Verify storage account access
from azure.storage.blob import BlobServiceClient

blob_service_client = BlobServiceClient(
    account_url=f"https://{account_name}.blob.core.windows.net",
    credential=account_key
)

# List containers
containers = blob_service_client.list_containers()
for container in containers:
    print(container.name)
```

### Issue: Frontend Not Connecting to API

```bash
# Check CORS configuration
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:8000/chat

# Update CORS in backend_api.py if needed
```

## Cost Estimation

### Monthly Costs (POC Environment)

| Service | Configuration | Est. Cost/Month |
|---------|--------------|-----------------|
| Azure OpenAI (GPT-4) | 100K tokens/day | £150 |
| Databricks | 2-node cluster, 8hrs/day | £400 |
| Storage (Data Lake) | 100GB data + transactions | £20 |
| Azure ML | Basic compute | £50 |
| Event Hub | Standard, 2 CU | £100 |
| Container Apps | 1 vCPU, 2GB RAM | £30 |
| Application Insights | 5GB/day ingestion | £40 |
| **Total** | | **~£790/month** |

### Production Scaling

For production with 500 concurrent users:
- Azure OpenAI: £1,500/month (higher TPM)
- Databricks: £2,000/month (larger cluster, 24/7)
- Storage: £150/month (1TB data)
- Total: ~£4,500/month

## Security Hardening (Production)

### 1. Enable Private Endpoints

```bash
# Create private endpoint for OpenAI
az network private-endpoint create \
  --name openai-private-endpoint \
  --resource-group <rg-name> \
  --vnet-name <vnet-name> \
  --subnet private-subnet \
  --private-connection-resource-id <openai-resource-id> \
  --group-id account \
  --connection-name openai-connection
```

### 2. Configure Managed Identities

```bash
# Enable managed identity for Container App
az containerapp identity assign \
  --name healthcare-genai-api \
  --resource-group <rg-name> \
  --system-assigned

# Grant Key Vault access
az keyvault set-policy \
  --name <vault-name> \
  --object-id <managed-identity-id> \
  --secret-permissions get list
```

### 3. Enable Audit Logging

```bash
# Configure diagnostic settings
az monitor diagnostic-settings create \
  --name healthcare-audit-logs \
  --resource <resource-id> \
  --logs '[{"category": "AuditEvent", "enabled": true}]' \
  --workspace <log-analytics-workspace-id>
```

## Maintenance

### Regular Tasks

**Daily:**
- Monitor Application Insights for errors
- Check OpenAI token usage
- Review cost alerts

**Weekly:**
- Review Delta Lake table sizes
- Optimize Databricks cluster configuration
- Test disaster recovery procedures

**Monthly:**
- Update dependencies (npm, pip)
- Review security recommendations
- Optimize query performance
- Update ML models if applicable

## Support

For deployment issues:
- Azure Support: https://azure.microsoft.com/support
- GitHub Issues: <repository-url>/issues
- Internal: Contact NHS Digital Architecture team

## Next Steps

After successful deployment:
1. Schedule demo with stakeholders
2. Gather feedback from pilot users
3. Plan production migration
4. Document lessons learned
5. Prepare business case for full implementation
