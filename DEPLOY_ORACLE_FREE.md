# Oracle Free Demo Deploy

This is the simplest fully free demo setup for EasyFlow.

You will run everything on one Oracle Cloud Always Free VM:

- `web` on port `3000`
- `api` on port `8000`
- `n8n` on port `5678`
- `rabbitmq` on ports `5672` and `15672`
- `postgres` inside Docker

## 0. Lock Oracle to free-tier only

Before creating the VM:

1. Create a compartment named `easyflow-demo`
2. Go to `Identity & Security` → `Quotas`
3. Create a new quota policy in the root compartment
4. Paste the contents of [ORACLE_FREE_TIER_QUOTAS.txt](/Users/vamsikrishna/Documents/EasyFlow/ORACLE_FREE_TIER_QUOTAS.txt)

This does two things:

- limits you to one small Always Free style setup
- blocks common paid services like load balancers and managed databases

Also create a budget alert:

1. Go to `Billing & Cost Management` → `Budgets`
2. Create a budget for compartment `easyflow-demo`
3. Set amount to `$1`
4. Add alert thresholds at `50%`, `80%`, and `100%`

Important: budget alerts warn you, but quotas are the hard limit.

## 1. Create the VM

In Oracle Cloud:

1. Create a `Compute` instance.
2. Choose compartment `easyflow-demo`.
3. Pick an `Always Free` shape.
4. Use `Ubuntu`.
5. Allow a public IP.
6. Download the SSH key.

Open these ports in the Oracle security list:

- `22` for SSH
- `3000` for EasyFlow web
- `8000` for API
- `5678` for n8n
- `15672` for RabbitMQ UI if you want it

## 2. SSH into the server

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_SERVER_IP
```

## 3. Install Git and copy the project

```bash
sudo apt update
sudo apt install -y git
git clone YOUR_REPO_URL
cd EasyFlow
```

Or upload the project manually if the repo is private.

## 4. Install Docker

```bash
bash scripts/oracle/bootstrap-vm.sh
```

If the script tells you to reconnect, log out and SSH back in once.

## 5. Prepare the env file

```bash
bash scripts/oracle/prepare-env.sh YOUR_SERVER_IP
```

This generates `.env` for the server IP and creates strong random secrets for auth and webhooks.

## 6. Start everything

```bash
docker compose up -d --build
```

## 7. Open the demo

Use these URLs:

- EasyFlow: `http://YOUR_SERVER_IP:3000`
- API health: `http://YOUR_SERVER_IP:8000/health`
- n8n: `http://YOUR_SERVER_IP:5678`

## 8. If something fails

Check logs:

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f api
docker compose logs -f n8n
```

## 9. Important note

This is good for a demo.

It is not production-ready yet because:

- no HTTPS
- no domain
- ports are public directly
- local auth secrets are stored in `.env`

For a public investor or customer demo, this is enough to get online quickly for free.
