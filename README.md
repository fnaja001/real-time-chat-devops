![Kubernetes](https://img.shields.io/badge/kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/docker-2496ED?style=flat&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/redis-DC382D?style=flat&logo=redis&logoColor=white)
![MongoDB](https://img.shields.io/badge/mongodb-47A248?style=flat&logo=mongodb&logoColor=white)
[![CI](https://github.com/fnaja001/real-time-chat-devops/actions/workflows/deploy.yml/badge.svg)](https://github.com/fnaja001/real-time-chat-devops/actions/workflows/deploy.yml)

README "About" intro

A production-grade, fully containerized real-time chat application demonstrating modern DevOps practices. Built with Node.js, Socket.io, Redis, and MongoDB, deployed on Kubernetes with horizontal scaling, observability via Prometheus and Grafana, and load testing via k6. Designed to simulate real-world multi-service microservice deployments.

![Chat UI Demo](screenshoot.png)

---

## 🏗 Architecture
User 1 ──► (HTTP/WebSocket) ──► Ingress / Port-Forward
User 2 ──► (HTTP/WebSocket) ──► Ingress / Port-Forward
│
├──► Frontend Service (Nginx) ──► serves static UI
│
└──► WebSocket Service
│
├──► WebSocket Pod 1 ──► Redis Pub/Sub ──► broadcast
│
└──► WebSocket Pod 2 ──► Redis Pub/Sub ──► broadcast
│
└──► REST API ──► MongoDB (messages, users)


- **Frontend** – Static HTML/CSS/JS (served by Nginx)
- **WebSocket Server** – Socket.io, scales horizontally via Redis pub/sub
- **REST API** – Express + Mongoose (user auth, message history)
- **Redis** – In‑memory pub/sub and optional session store
- **MongoDB** – Persistent message and user storage

----

## 🚀 Deploy on Minikube

### Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/) (Docker driver)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Docker](https://www.docker.com/products/docker-desktop/)
- (Optional) [Helm](https://helm.sh/) for packaging

### 1. Start Minikube

```bash
minikube start --driver=docker
2. Clone the repository
bash
git clone https://github.com/fnaja001/real-time-chat-devops.git
cd real-time-chat-devops
3. Deploy all components
bash
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/websocket-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
Wait for all pods to be ready:

bash
kubectl get pods -w
4. Access the chat
In two separate terminals, run:

bash
# Terminal 1 – WebSocket port‑forward
kubectl port-forward service/websocket-service 3000:3000

# Terminal 2 – Frontend tunnel
minikube service frontend-service --url
Open the URL from Terminal 2 in two browser tabs. Type a message in one tab – it appears instantly in the other!

🧪 Load Testing with k6
Simulate 50 concurrent users:

bash
kubectl apply -f load-test/k6-job.yaml
kubectl logs job/k6-load-test
(Optional) Enable HPA to autoscale WebSocket pods based on CPU or custom metrics.

📡 API Endpoints
Method	Endpoint	Description
POST	/api/register	Create a new user
POST	/api/login	Get JWT token
POST	/api/rooms	Create a new chat room
GET	/api/rooms	List user rooms
GET	/api/messages/:room	Get last 100 messages
POST	/api/messages	Save a message (called by WS)
📊 Monitoring (Optional)
Install Prometheus stack:

bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
Add a ServiceMonitor for the WebSocket server (see monitoring/websocket-servicemonitor.yaml).
Grafana dashboards can show chat_connections_active and chat_messages_total.

🧠 Technologies & Tools
Containerisation: Docker

Orchestration: Kubernetes (Minikube)

Real‑time: Socket.io + Redis pub/sub

Database: MongoDB (persistent)

Load Testing: k6

Monitoring: Prometheus + Grafana

Version Control: Git + GitHub Actions 

🎯 What This Project Demonstrates
✅ Multi‑service microservice architecture on K8s

✅ Horizontal scaling of WebSocket servers via Redis pub/sub

✅ Stateful workload (MongoDB with PersistentVolumeClaim)

✅ Clean separation of static frontend, API, and WebSocket servers

✅ Production‑grade readiness (liveness/readiness probes, resource limits)

✅ Load testing and observability (metrics, logs – optional)

📄 License
MIT

👤 Author
fnaja001 – GitHub
