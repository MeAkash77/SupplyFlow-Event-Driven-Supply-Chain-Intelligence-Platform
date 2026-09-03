# Oracle Beginner Steps

Use this exactly in Oracle Cloud Console.

## Part 1: Create the compartment

1. Sign in to Oracle Cloud
2. Open the menu in the top-left
3. Go to `Identity & Security` → `Compartments`
4. Click `Create Compartment`
5. Name it `easyflow-demo`
6. Click `Create`

## Part 2: Add hard quota limits

1. Open the menu
2. Go to `Identity & Security` → `Quotas`
3. Make sure you are in the root compartment, not `easyflow-demo`
4. Click `Create Quota`
5. Name it `easyflow-free-tier-lock`
6. Open [ORACLE_FREE_TIER_QUOTAS.txt](/Users/vamsikrishna/Documents/EasyFlow/ORACLE_FREE_TIER_QUOTAS.txt)
7. Copy everything from that file into the quota policy box
8. Click `Create Quota`

## Part 3: Add a budget alert

1. Open the menu
2. Go to `Billing & Cost Management` → `Budgets`
3. Click `Create Budget`
4. Name it `easyflow-demo-budget`
5. Scope it to compartment `easyflow-demo`
6. Budget amount: `1 USD`
7. Add alert rules for `50%`, `80%`, and `100%`
8. Add your email
9. Click `Create`

## Part 4: Create the VM

1. Open the menu
2. Go to `Compute` → `Instances`
3. Change the compartment to `easyflow-demo`
4. Click `Create Instance`
5. Name: `easyflow-demo`
6. Image: `Ubuntu`
7. Shape:
   - click `Change shape`
   - select `Ampere`
   - choose `VM.Standard.A1.Flex`
   - if possible set `4 OCPU` and `24 GB memory`
8. Networking:
   - keep public IP enabled
   - use the default VCN option if Oracle offers it
9. SSH keys:
   - choose `Generate a key pair for me`
   - download the private key
10. Click `Create`

## Part 5: Open ports

After the VM is created:

1. Click the instance
2. Open the subnet / VCN link from the networking section
3. Open the security list
4. Add ingress rules for:
   - `22`
   - `3000`
   - `8000`
   - `5678`
   - `15672`

Use source `0.0.0.0/0` for demo access.

## Part 6: SSH into the VM

```bash
ssh -i /path/to/private-key.key ubuntu@YOUR_SERVER_IP
```

## Part 7: Deploy EasyFlow

```bash
sudo apt update
sudo apt install -y git
git clone YOUR_REPO_URL
cd EasyFlow
bash scripts/oracle/bootstrap-vm.sh
```

If asked, disconnect and SSH back in once. Then run:

```bash
cd EasyFlow
bash scripts/oracle/prepare-env.sh YOUR_SERVER_IP
docker compose up -d --build
```

## Part 8: Check it

Open:

- `http://YOUR_SERVER_IP:3000`
- `http://YOUR_SERVER_IP:8000/health`
- `http://YOUR_SERVER_IP:5678`
