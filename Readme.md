# How to setup Kubernetes and Argocd on WSL2
This guide should help getting a kubernetes installation running locally on a Windows machine and accessible via WSL.

## Install Docker and Minikube and Setup WSL
This is taken from [carmencinotti.com - How to Use Kubernetes For Free On WSL](https://carmencincotti.com/2023-03-06/how-to-use-kubernetes-for-free-on-wsl/). See there for more details.

### Install Docker on Windows
* Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
* Go to settings -> General and tick 'Use the WSL 2 based engine'.

### Install Minikube on Windows
* Install [Minikube](https://minikube.sigs.k8s.io/docs/start/).
* In WSL create a little shell script in /usr/local/bin/minikube to access the windows installation:
```
#!/bin/sh
/mnt/c/Program\ Files/Kubernetes/Minikube/minikube.exe $@
```

### Install kubectl on WSL
* Install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).
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
* Test access:
```
kubectl config use-context minikube
kubectl get nodes
```

## Install ArgoCd 
### Install ArgoCd in Kubernetes
```
# Create argocd namespace
kubectl create namespace argocd
kubectl get ns

# Install argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get deployment -n argocd
kubectl get statefulset -n argocd
kubectl get all -n argocd

# After Deployment is complete
# Expose argocd-server
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

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