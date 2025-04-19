#!/bin/bash
# deploy.sh - Script pour déployer CodeFiddle sur Kubernetes

# Vérifier que les outils nécessaires sont installés
command -v kubectl >/dev/null 2>&1 || { echo "kubectl est requis mais n'est pas installé. Abandon."; exit 1; }
command -v podman >/dev/null 2>&1 || { echo "podman est requis mais n'est pas installé. Abandon."; exit 1; }
command -v minikube >/dev/null 2>&1 || { echo "minikube est requis mais n'est pas installé. Abandon."; exit 1; }

# Fonction pour vérifier si minikube est en cours d'exécution
check_minikube() {
  if ! minikube status | grep -q "host: Running"; then
    echo "Minikube n'est pas en cours d'exécution. Démarrage..."
    minikube start --driver=podman
  else
    echo "Minikube est en cours d'exécution."
  fi
}

# Fonction pour construire les images Docker
build_images() {
  echo "Construction de l'image de base CodeFiddle..."
  podman build -t codefiddle:latest -f Dockerfile.playground .
  
  echo "Construction de l'image du backend CodeFiddle..."
  podman build -t codefiddle-backend:latest -f Dockerfile.backend .
  
  echo "Importation des images dans minikube..."
  minikube image load codefiddle:latest
  minikube image load codefiddle-backend:latest
}

# Fonction pour créer le namespace si nécessaire
create_namespace() {
  if ! kubectl get namespace codefiddle >/dev/null 2>&1; then
    echo "Création du namespace codefiddle..."
    kubectl create namespace codefiddle
  fi
}

# Fonction pour créer les secrets Kubernetes
create_secrets() {
  echo "Création du secret pour la configuration Kubernetes..."
  # Copier le fichier config de l'utilisateur actuel
  if [ -f ~/.kube/config ]; then
    kubectl create secret generic kube-config-secret --from-file=config=~/.kube/config -n codefiddle --dry-run=client -o yaml | kubectl apply -f -
  else
    echo "Fichier ~/.kube/config non trouvé. Veuillez configurer kubectl."
    exit 1
  fi
}

# Fonction pour déployer l'application
deploy_app() {
  echo "Déploiement de l'application CodeFiddle..."
  kubectl apply -f kubernetes/codefiddle-deployment.yaml -n codefiddle
  
  # Activer ingress si ce n'est pas déjà fait
  if ! minikube addons list | grep -q "ingress: enabled"; then
    echo "Activation de l'addon Ingress..."
    minikube addons enable ingress
  fi
}

# Fonction pour configurer les DNS locaux
setup_local_dns() {
  MINIKUBE_IP=$(minikube ip)
  echo "L'adresse IP de minikube est: $MINIKUBE_IP"
  
  echo "Ajout des entrées DNS dans /etc/hosts..."
  echo "Les entrées suivantes doivent être ajoutées à votre fichier /etc/hosts:"
  echo "$MINIKUBE_IP codefiddle.local"
  echo "$MINIKUBE_IP playground-example.codefiddle.local"
  
  # Demander la confirmation avant de modifier /etc/hosts
  read -p "Voulez-vous ajouter automatiquement ces entrées à /etc/hosts? (o/n) " confirm
  if [[ $confirm == [oO] ]]; then
    sudo sh -c "echo '\n# CodeFiddle Local Development' >> /etc/hosts"
    sudo sh -c "echo '$MINIKUBE_IP codefiddle.local' >> /etc/hosts"
    sudo sh -c "echo '$MINIKUBE_IP playground-example.codefiddle.local' >> /etc/hosts"
    echo "Entrées ajoutées à /etc/hosts."
  else
    echo "Veuillez ajouter manuellement ces entrées à votre fichier /etc/hosts."
  fi
}

# Fonction pour afficher les informations d'accès
show_access_info() {
  echo "=== CodeFiddle est déployé! ==="
  echo "Vous pouvez y accéder à l'adresse:"
  echo "http://codefiddle.local"
  echo ""
  echo "Les environnements de playground seront accessibles à:"
  echo "http://<playground-id>.codefiddle.local"
}

# Exécution principale
echo "=== Déploiement de CodeFiddle sur Kubernetes avec Podman ==="
check_minikube
build_images
create_namespace
create_secrets
deploy_app
setup_local_dns
show_access_info