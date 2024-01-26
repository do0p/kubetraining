# Setup Kubernetes and Argocd on WSL2
This guide should help getting a kubernetes installation running locally on a Windows machine and accessible via WSL.

## Install Docker and Minikube on WSL
### Install Docker on WSL
* Follow the instructions at [Docker.com](https://docs.docker.com/engine/install/ubuntu/).
* Make sure `net.ipv4.ip_forward=1` is set in `/etc/sysctl.conf`.
* Execute `sudo update-alternatives --set iptables /usr/sbin/iptables-legacy`.
* Start via `sudo service docker start`.

### Install Minikube on WSL
* Install [Minikube](https://minikube.sigs.k8s.io/docs/start/).

## Install Docker and Minikube on Windows
Alternatively docker and minikube can also be installed on Windows and then used from WSL.

This is taken from [carmencinotti.com - How to Use Kubernetes For Free On WSL](https://carmencincotti.com/2023-03-06/how-to-use-kubernetes-for-free-on-wsl/). See there for more details.

### Install Docker on Windows
* Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
* Go to settings -> General and tick 'Use the WSL 2 based engine'.

### Install Minikube on Windows
* Install [Minikube](https://minikube.sigs.k8s.io/docs/start/).

## Install kubectl on WSL
* Install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).

### If you have installed Docker and Minikube on Windows
* Copy the kube config: 
```
cp /mnt/c/Users/{USER_ACCOUNT}/.kube/config ~/.kube
```
* Replace all Windows path with WSL paths, you might want to use:
```    
wslpath -u "C:\Users\carmencincotti\.minikube\profiles\minikube\client.key"
```
* Copy the Docker environment with:
```
eval $(sh /usr/local/bin/minikube docker-env --shell=bash)
export DOCKER_CERT_PATH=$(wslpath -u "${DOCKER_CERT_PATH}")
```
### Test access
```
kubectl config use-context minikube
kubectl get nodes
```

## Install nginx-ingress in Kubernetes
```
# Install nginx-ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Expose ingress
kubectl port-forward svc/ingress-nginx-controller -n ingress-nginx 8085:80
```

## Install ArgoCd 
### Install ArgoCd in Kubernetes
```
# Create argocd namespace
kubectl create namespace argocd

# Install argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get deployment -n argocd
kubectl get statefulset -n argocd
kubectl get all -n argocd

# After Deployment is complete
# Updated the argocd-cm configmap
kubectl apply -f application/argocd/configmap.yaml

# Expose argocd-server
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'
kubectl port-forward svc/argocd-server -n argocd 8080:443 

# Retreive argocd admin password from kubernetes secrets
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# Use this password to login as admin to argocd at https://localhost:8080.

```
### Install argocd client in WSL
```
# Dowload argocd client
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64

# Install argocd client
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Test argocd
argocd version
argocd version --client
```


# Deploy via argocd 
```
kubectl apply -f application/argocd/application.yaml
```