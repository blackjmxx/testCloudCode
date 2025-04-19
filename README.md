# Guide de déploiement de CodeFiddle sur différents fournisseurs cloud

Ce guide vous explique comment déployer CodeFiddle avec Kubernetes sur différents fournisseurs cloud, notamment Google Cloud Platform (GCP), Amazon Web Services (AWS), et DigitalOcean.

## Prérequis communs

Avant de commencer, assurez-vous d'avoir les éléments suivants :

- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installé sur votre machine locale
- CLI du fournisseur cloud (gcloud, aws, doctl) installé et configuré
- Git pour cloner le dépôt CodeFiddle

## 1. Google Kubernetes Engine (GKE) sur Google Cloud Platform

### Configuration du projet GCP

```bash
# Installer la CLI Google Cloud si ce n'est pas déjà fait
brew install --cask google-cloud-sdk

# Connectez-vous à votre compte Google
gcloud auth login

# Créez un projet (ou utilisez un projet existant)
gcloud projects create codefiddle-project

# Définissez le projet par défaut
gcloud config set project codefiddle-project

# Activez l'API Kubernetes Engine
gcloud services enable container.googleapis.com
```

### Création du cluster GKE

```bash
# Créez un cluster Kubernetes
gcloud container clusters create codefiddle-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-standard-2

# Obtenez les identifiants pour kubectl
gcloud container clusters get-credentials codefiddle-cluster --zone us-central1-a

# Vérifiez la connexion
kubectl get nodes
```

### Déploiement sur GKE

```bash
# Créez un namespace pour CodeFiddle
kubectl create namespace codefiddle

# Construisez et poussez les images Docker sur le Container Registry de Google
gcloud auth configure-docker
docker build -t gcr.io/codefiddle-project/codefiddle:latest -f Dockerfile.playground .
docker build -t gcr.io/codefiddle-project/codefiddle-backend:latest -f Dockerfile.backend .
docker push gcr.io/codefiddle-project/codefiddle:latest
docker push gcr.io/codefiddle-project/codefiddle-backend:latest

# Mettez à jour le fichier de déploiement pour utiliser les images du GCR
# Remplacez 'codefiddle:latest' par 'gcr.io/codefiddle-project/codefiddle:latest'
# et 'codefiddle-backend:latest' par 'gcr.io/codefiddle-project/codefiddle-backend:latest'

# Appliquez les fichiers de configuration Kubernetes
kubectl apply -f kubernetes/codefiddle-deployment.yaml -n codefiddle

# Configurez l'Ingress avec un domaine personnalisé
# (Assurez-vous d'avoir un domaine pointé vers l'adresse IP externe de l'Ingress)
kubectl apply -f kubernetes/gcp-ingress.yaml -n codefiddle
```

### Configuration du domaine sur GCP

1. Obtenez l'adresse IP externe de l'Ingress :
   ```bash
   kubectl get ingress -n codefiddle
   ```

2. Configurez votre domaine pour pointer vers cette adresse IP.
3. Configurez un certificat SSL avec Let's Encrypt ou Google-managed certificates.

## 2. Amazon EKS (Elastic Kubernetes Service) sur AWS

### Configuration AWS CLI

```bash
# Installer la CLI AWS si ce n'est pas déjà fait
brew install awscli

# Configurer AWS CLI
aws configure
```

### Création du cluster EKS

```bash
# Installer eksctl
brew tap weaveworks/tap
brew install weaveworks/tap/eksctl

# Créer un cluster EKS
eksctl create cluster \
  --name codefiddle-cluster \
  --version 1.23 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 5

# Vérifier la connexion
kubectl get nodes
```

### Déploiement sur EKS

```bash
# Créer un repository ECR pour les images
aws ecr create-repository --repository-name codefiddle
aws ecr create-repository --repository-name codefiddle-backend

# Authentifier Docker avec ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Construire et pousser les images
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_URL=${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

docker build -t ${REPO_URL}/codefiddle:latest -f Dockerfile.playground .
docker build -t ${REPO_URL}/codefiddle-backend:latest -f Dockerfile.backend .

docker push ${REPO_URL}/codefiddle:latest
docker push ${REPO_URL}/codefiddle-backend:latest

# Mettre à jour le fichier de déploiement pour utiliser les images du ECR
# Remplacez 'codefiddle:latest' par '${REPO_URL}/codefiddle:latest'
# et 'codefiddle-backend:latest' par '${REPO_URL}/codefiddle-backend:latest'

# Déployer l'application
kubectl create namespace codefiddle
kubectl apply -f kubernetes/aws-deployment.yaml -n codefiddle
```

### Configuration de l'Ingress AWS

```bash
# Installer l'AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=codefiddle-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Appliquer la configuration d'Ingress AWS
kubectl apply -f kubernetes/aws-ingress.yaml -n codefiddle
```

### Configuration du domaine sur AWS

1. Obtenez le nom du Load Balancer :
   ```bash
   kubectl get ingress -n codefiddle
   ```

2. Configurez Route 53 pour créer un enregistrement A (alias) pointant vers le Load Balancer.

## 3. DigitalOcean Kubernetes

### Configuration de DigitalOcean CLI

```bash
# Installer doctl
brew install doctl

# Authentifier avec un token d'accès personnel
doctl auth init
```

### Création du cluster DO Kubernetes

```bash
# Créer un cluster Kubernetes
doctl kubernetes cluster create codefiddle-cluster \
  --region sfo2 \
  --size s-2vcpu-4gb \
  --count 3

# Configurer kubectl pour utiliser le cluster
doctl kubernetes cluster kubeconfig save codefiddle-cluster

# Vérifier la connexion
kubectl get nodes
```

### Déploiement sur DO Kubernetes

```bash
# Créer un Container Registry DigitalOcean
doctl registry create codefiddle-registry

# Configurer Docker pour pousser vers le registry
doctl registry login

# Construire et pousser les images
docker build -t registry.digitalocean.com/codefiddle-registry/codefiddle:latest -f Dockerfile.playground .
docker build -t registry.digitalocean.com/codefiddle-registry/codefiddle-backend:latest -f Dockerfile.backend .

docker push registry.digitalocean.com/codefiddle-registry/codefiddle:latest
docker push registry.digitalocean.com/codefiddle-registry/codefiddle-backend:latest

# Mettre à jour les manifestes pour utiliser les images du registry DO
# Déployer l'application
kubectl create namespace codefiddle
kubectl apply -f kubernetes/do-deployment.yaml -n codefiddle
```

### Configuration de l'Ingress DigitalOcean

```bash
# Installer nginx-ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.1.1/deploy/static/provider/do/deploy.yaml

# Appliquer la configuration d'Ingress
kubectl apply -f kubernetes/do-ingress.yaml -n codefiddle
```

### Configuration du domaine sur DigitalOcean

1. Obtenez l'adresse IP externe de l'Ingress :
   ```bash
   kubectl get ingress -n codefiddle
   ```

2. Créez un enregistrement A dans les paramètres DNS de DigitalOcean ou chez votre fournisseur de DNS.

## Déploiement multi-cloud

Si vous souhaitez déployer CodeFiddle sur plusieurs fournisseurs cloud pour la redondance et la haute disponibilité, vous pouvez utiliser des outils comme [Terraform](https://www.terraform.io/) pour gérer l'infrastructure et [Fleet](https://github.com/rancher/fleet) ou [ArgoCD](https://argoproj.github.io/argo-cd/) pour synchroniser les déploiements Kubernetes à travers plusieurs clusters.

## Considérations de sécurité

Voici quelques considérations de sécurité importantes pour votre déploiement :

1. **Isolation des conteneurs** : Configurez des [Pod Security Policies](https://kubernetes.io/docs/concepts/policy/pod-security-policy/) ou [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) pour limiter les privilèges des pods.

2. **Chiffrement des données** : Utilisez des volumes chiffrés pour stocker les données des utilisateurs.

3. **Authentification et autorisation** : Mettez en place un système d'authentification pour les utilisateurs et limitez l'accès aux ressources.

4. **Mise à jour régulière** : Maintenez à jour les images de conteneurs et les composants Kubernetes pour corriger les vulnérabilités de sécurité.

5. **Surveillance** : Mettez en place une surveillance des logs et des métriques pour détecter les comportements anormaux.

## Optimisation des coûts

Pour optimiser les coûts de votre déploiement cloud :

1. **Autoscaling** : Configurez l'autoscaling horizontal des pods et des nœuds pour ne payer que ce dont vous avez besoin.

2. **Spot Instances/Preemptible VMs** : Utilisez des instances à prix réduit (EC2 Spot, Preemptible VMs) pour les workloads non critiques.

3. **Limites de ressources** : Définissez des limites de ressources appropriées pour les conteneurs afin d'éviter une surconsommation.

4. **Nettoyage automatique** : Mettez en place un mécanisme pour nettoyer automatiquement les ressources inutilisées.

## Recommandations

- **DigitalOcean** : Option la plus simple et la plus économique pour démarrer. Interface utilisateur conviviale.
- **GCP/GKE** : Excellente intégration avec les autres services Google et bon équilibre coût/performances.
- **AWS/EKS** : Offre l'écosystème le plus complet mais peut être plus complexe à configurer et un peu plus coûteux.

# Guide de dépannage et d'optimisation pour CodeFiddle sur Kubernetes

Ce guide vous aidera à résoudre les problèmes courants que vous pourriez rencontrer lors du déploiement et de l'utilisation de CodeFiddle sur Kubernetes, ainsi que des conseils pour optimiser les performances.

## Dépannage

### Problèmes de déploiement

#### Les pods restent en état "Pending"

**Symptôme** : Les pods ne démarrent pas et restent en état "Pending".

**Solutions possibles** :
1. Vérifiez les ressources disponibles dans le cluster :
   ```bash
   kubectl describe nodes
   ```
   Regardez les sections "Allocated resources" pour voir si le cluster a assez de ressources CPU/mémoire.

2. Vérifiez si le PersistentVolumeClaim est provisionné :
   ```bash
   kubectl get pvc -n codefiddle
   ```
   Si l'état est "Pending", il y a peut-être un problème avec la classe de stockage ou l'approvisionnement de volumes.

#### Les pods crashent au démarrage

**Symptôme** : Les pods démarrent mais crashent immédiatement.

**Solutions possibles** :
1. Consultez les logs du pod :
   ```bash
   kubectl logs <pod-name> -n codefiddle
   ```

2. Décrivez le pod pour voir les événements :
   ```bash
   kubectl describe pod <pod-name> -n codefiddle
   ```

3. Vérifiez que les variables d'environnement nécessaires sont définies dans le déploiement.

### Problèmes d'Ingress

#### L'Ingress ne route pas le trafic correctement

**Symptôme** : Vous ne pouvez pas accéder à l'application via le domaine configuré.

**Solutions possibles** :
1. Vérifiez l'état de l'Ingress :
   ```bash
   kubectl get ingress -n codefiddle
   kubectl describe ingress <ingress-name> -n codefiddle
   ```

2. Assurez-vous que le contrôleur Ingress est installé et en cours d'exécution :
   ```bash
   kubectl get pods -n ingress-nginx
   ```

3. Vérifiez que votre DNS est configuré correctement pour pointer vers l'adresse IP de l'Ingress.

### Problèmes de WebSocket

#### Les connexions WebSocket se déconnectent de façon aléatoire

**Symptôme** : L'éditeur ou le terminal perdent la connexion.

**Solutions possibles** :
1. Assurez-vous que votre Ingress est configuré pour supporter les WebSockets :
   ```yaml
   annotations:
     nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
     nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
     nginx.ingress.kubernetes.io/websocket-services: "codefiddle-backend-service"
   ```

2. Vérifiez les logs du service backend et du contrôleur Ingress pour détecter des erreurs liées aux WebSockets.

### Problèmes de création de conteneurs utilisateur

#### Les pods utilisateur ne démarrent pas

**Symptôme** : Les environnements de playground ne sont pas créés correctement.

**Solutions possibles** :
1. Vérifiez les permissions RBAC du service backend :
   ```bash
   kubectl get clusterrole codefiddle-backend-role
   kubectl get clusterrolebinding codefiddle-backend-binding
   ```

2. Assurez-vous que le ServiceAccount utilisé par le backend a les permissions nécessaires pour créer des ressources Kubernetes.

3. Examinez les logs du backend pour trouver des erreurs lors de la création des ressources Kubernetes.

## Optimisation des performances

### Optimisation des ressources

1. **Ajustez les requêtes et limites de ressources** : Surveillez l'utilisation réelle des ressources et ajustez les requêtes/limites en conséquence.
   ```yaml
   resources:
     requests:
       cpu: "100m"
       memory: "256Mi"
     limits:
       cpu: "500m"
       memory: "512Mi"
   ```

2. **Utilisation de l'HPA (Horizontal Pod Autoscaler)** : Configurez l'autoscaling pour gérer les pics de charge.
   ```bash
   kubectl autoscale deployment codefiddle-backend --cpu-percent=80 --min=1 --max=10 -n codefiddle
   ```

3. **Optimisation du stockage** : Utilisez la classe de stockage appropriée en fonction des besoins de performance.
   - Pour le développement local : hostPath
   - Pour la production : SSD ou stockage performant

### Optimisation du réseau

1. **Mise en cache des images Docker** :
   ```bash
   # Sur GKE
   gcloud container clusters update codefiddle-cluster --enable-image-streaming
   
   # Sur AWS EKS
   # Utilisez ECR avec pull-through cache
   ```

2. **Réseau entre pods** : Utilisez un CNI (Container Network Interface) plus performant comme Calico ou Cilium.

3. **CDN pour les actifs statiques** : Déployez un CDN pour servir les actifs statiques de l'interface utilisateur.

### Optimisation de Kubernetes

1. **Autoscaling des nœuds** : Configurez l'autoscaling des nœuds pour gérer la demande.
   ```bash
   # Sur GKE
   gcloud container clusters update codefiddle-cluster --enable-autoscaling --min-nodes=1 --max-nodes=5
   
   # Sur EKS
   eksctl scale nodegroup --cluster=codefiddle-cluster --nodes-min=1 --nodes-max=5 --name=standard-workers
   ```

2. **Affinité des pods** : Utilisez l'affinité des pods pour regrouper les pods qui communiquent fréquemment.
   ```yaml
   affinity:
     podAffinity:
       preferredDuringSchedulingIgnoredDuringExecution:
       - weight: 100
         podAffinityTerm:
           labelSelector:
             matchExpressions:
             - key: app
               operator: In
               values:
               - codefiddle-backend
           topologyKey: "kubernetes.io/hostname"
   ```

3. **Monitors et caches locaux** : Utilisez des caches locaux comme Redis pour les données fréquemment accédées.

## Optimisation spécifique à l'environnement macOS

Lorsque vous exécutez Kubernetes sur macOS, que ce soit avec Minikube, Docker Desktop ou Podman Machine, vous pouvez rencontrer des problèmes de performance liés à la virtualisation. Voici quelques optimisations :

1. **Augmentez les ressources allouées à la VM** :
   ```bash
   # Pour Podman
   podman machine stop
   podman machine set --cpus 4 --memory 8192 --disk-size 40
   podman machine start
   
   # Pour Minikube
   minikube stop
   minikube config set memory 8192
   minikube config set cpus 4
   minikube start
   ```

2. **Montage efficace des volumes** :
   - Utilisez des montages de type 9p ou NFS qui fonctionnent mieux sous macOS que les montages bind standard.
   - Minimisez le nombre de fichiers synchronisés entre l'hôte et la VM.

3. **Utilisez des hôtes mutables pour des DNS plus rapides** :
   ```bash
   # Pour Minikube
   minikube addons enable ingress-dns
   ```

4. **Optimisation de Docker et Podman sur macOS** :
   - Activez la fonctionnalité VirtioFS dans Docker Desktop qui améliore les performances de volume
   - Pour Podman, utilisez les options `--volume` avec des montages de type 9p ou virtiofs

## Surveillance et diagnostics

### Outils de surveillance

1. **Prometheus et Grafana** : Déployez ces outils pour surveiller les métriques du cluster.
   ```bash
   # Installation avec Helm
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
   ```

2. **Logging centralisé** : Utilisez Elasticsearch, Fluentd et Kibana (EFK) pour la gestion des logs.

3. **Tracing distribué** : Ajoutez Jaeger ou Zipkin pour suivre les requêtes à travers les différents services.

### Commandes de diagnostic utiles

```bash
# Récupérer tous les pods avec leur statut
kubectl get pods -n codefiddle

# Obtenir les logs d'un pod
kubectl logs <pod-name> -n codefiddle

# Vérifier les événements du cluster
kubectl get events -n codefiddle --sort-by='.lastTimestamp'

# Exécuter un shell dans un pod pour le diagnostic
kubectl exec -it <pod-name> -n codefiddle -- /bin/bash

# Vérifier les services et leurs endpoints
kubectl get services -n codefiddle
kubectl get endpoints -n codefiddle

# Inspecter l'utilisation des ressources
kubectl top nodes
kubectl top pods -n codefiddle
```

## Nettoyage et maintenance

### Nettoyage automatique des ressources inutilisées

Créez un CronJob pour nettoyer les environnements non utilisés :

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-environments
  namespace: codefiddle
spec:
  schedule: "0 * * * *"  # Exécution toutes les heures
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: codefiddle-cleanup-sa
          containers:
          - name: cleanup
            image: bitnami/kubectl
            command:
            - /bin/sh
            - -c
            - |
              # Supprimer les environnements inactifs depuis plus de 24 heures
              kubectl get pods -n codefiddle -l type=user-environment --no-headers | 
              awk '{print $1, $5}' | 
              while read pod age; do
                if [[ $age == *d ]]; then
                  days=$(echo $age | tr -d 'd')
                  if (( days > 1 )); then
                    kubectl delete pod $pod -n codefiddle
                    echo "Deleted pod $pod - inactive for $age"
                  fi
                fi
              done
          restartPolicy: OnFailure
```

### Mises à jour régulières

1. **Mises à jour des images** : Automatisez la construction et la mise à jour des images Docker avec CI/CD.

2. **Mises à jour de Kubernetes** : Planifiez des mises à jour régulières de la version de Kubernetes.

3. **Gestion de la configuration** : Utilisez GitOps avec des outils comme Flux ou ArgoCD pour synchroniser la configuration entre Git et Kubernetes.

## Conclusion

En suivant ce guide, vous devriez être en mesure de résoudre la plupart des problèmes courants et d'optimiser les performances de votre déploiement CodeFiddle sur Kubernetes. N'oubliez pas que chaque environnement cloud a ses propres particularités, donc certaines optimisations peuvent être plus efficaces que d'autres selon votre fournisseur.

Pour une assistance supplémentaire, consultez la documentation officielle de Kubernetes et de votre fournisseur cloud, ou rejoignez la communauté Kubernetes sur Slack ou les forums en ligne.