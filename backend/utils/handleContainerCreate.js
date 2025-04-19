// backend/utils/handleContainerCreate.js - Version Kubernetes
const k8s = require('@kubernetes/client-node');
const path = require('path');
const fs = require('fs');

// Initialiser le client Kubernetes
const kc = new k8s.KubeConfig();
kc.loadFromDefault(); // Charge la config depuis ~/.kube/config en local

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

// Fonction pour créer un pod et un service pour un utilisateur
const handleContainerCreate = async (playgroundId, wsForShell, req, socket, head) => {
  try {
    const playgroundPath = path.resolve(__dirname, `../playgrounds/${playgroundId}/code`);
    
    // S'assurer que le répertoire du playground existe
    if (!fs.existsSync(playgroundPath)) {
      console.error(`Playground path does not exist: ${playgroundPath}`);
      return;
    }

    // Créer un volume persistant pour stocker les fichiers du playground
    const pvName = `pv-${playgroundId}`;
    const pvcName = `pvc-${playgroundId}`;
    
    // Définir un volume persistant (en environnement local uniquement)
    const persistentVolume = {
      apiVersion: 'v1',
      kind: 'PersistentVolume',
      metadata: {
        name: pvName,
      },
      spec: {
        capacity: {
          storage: '1Gi',
        },
        accessModes: ['ReadWriteOnce'],
        persistentVolumeReclaimPolicy: 'Delete',
        hostPath: {
          path: playgroundPath,
        },
      },
    };

    // Créer une demande de volume persistant
    const persistentVolumeClaim = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: pvcName,
        namespace: 'default',
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        // Optionnel : sélecteur pour lier au PV spécifique
        selector: {
          matchLabels: {
            app: `codefiddle-${playgroundId}`,
          },
        },
      },
    };

    // Créer le volume et sa demande
    await k8sCoreApi.createPersistentVolume(persistentVolume);
    await k8sCoreApi.createNamespacedPersistentVolumeClaim('default', persistentVolumeClaim);

    // Définir le déploiement pour le playground
    const deploymentName = `codefiddle-${playgroundId}`;
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: deploymentName,
        namespace: 'default',
        labels: {
          app: `codefiddle-${playgroundId}`,
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: `codefiddle-${playgroundId}`,
          },
        },
        template: {
          metadata: {
            labels: {
              app: `codefiddle-${playgroundId}`,
            },
          },
          spec: {
            containers: [
              {
                name: 'codefiddle',
                image: 'codefiddle:latest', // Utiliser l'image que nous avons build
                ports: [
                  {
                    containerPort: 5173,
                    name: 'http',
                  },
                ],
                volumeMounts: [
                  {
                    mountPath: '/home/codefiddle/code',
                    name: 'code-volume',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'code-volume',
                persistentVolumeClaim: {
                  claimName: pvcName,
                },
              },
            ],
          },
        },
      },
    };

    // Créer le déploiement
    await k8sAppsApi.createNamespacedDeployment('default', deployment);

    // Définir le service pour exposer le playground
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `service-${playgroundId}`,
        namespace: 'default',
      },
      spec: {
        selector: {
          app: `codefiddle-${playgroundId}`,
        },
        ports: [
          {
            port: 5173,
            targetPort: 5173,
            name: 'http',
          },
        ],
      },
    };

    // Créer le service
    await k8sCoreApi.createNamespacedService('default', service);

    // Définir l'Ingress pour accéder via un sous-domaine
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `ingress-${playgroundId}`,
        namespace: 'default',
        annotations: {
          'nginx.ingress.kubernetes.io/rewrite-target': '/',
        },
      },
      spec: {
        rules: [
          {
            host: `${playgroundId}.codefiddle.local`, // sous-domaine local
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: `service-${playgroundId}`,
                      port: {
                        number: 5173,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    // Créer l'Ingress
    await k8sNetworkingApi.createNamespacedIngress('default', ingress);

    // Attendre que le pod soit prêt
    let podReady = false;
    let pod = null;
    
    while (!podReady) {
      const podsResponse = await k8sCoreApi.listNamespacedPod(
        'default',
        undefined,
        undefined,
        undefined,
        undefined,
        `app=codefiddle-${playgroundId}`
      );
      
      if (podsResponse.body.items.length > 0) {
        pod = podsResponse.body.items[0];
        if (pod.status.phase === 'Running') {
          podReady = true;
        }
      }
      
      // Attendre avant de vérifier à nouveau
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Configurer le WebSocket pour se connecter au pod
    const exec = new k8s.Exec(kc);
    const podName = pod.metadata.name;
    
    // Établir la connexion WebSocket avec le pod
    exec.exec(
      'default',
      podName,
      'codefiddle',
      ['/bin/bash'],
      socket,
      socket,
      socket,
      true,
      (status) => {
        console.log(`Shell session ended with status: ${status}`);
      }
    );

    // Gérer la mise à niveau WebSocket
    wsForShell.handleUpgrade(req, socket, head, (ws) => {
      wsForShell.emit('connection', ws, req, {
        id: playgroundId,
        remove: async () => {
          // Nettoyer les ressources lors de la fermeture
          try {
            await k8sNetworkingApi.deleteNamespacedIngress(`ingress-${playgroundId}`, 'default');
            await k8sCoreApi.deleteNamespacedService(`service-${playgroundId}`, 'default');
            await k8sAppsApi.deleteNamespacedDeployment(deploymentName, 'default');
            await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(pvcName, 'default');
            await k8sCoreApi.deletePersistentVolume(pvName);
            console.log(`Cleaned up resources for playground ${playgroundId}`);
          } catch (err) {
            console.error(`Error cleaning up resources: ${err}`);
          }
        }
      });
    });
  } catch (err) {
    console.error(`Error creating Kubernetes resources: ${err}`);
    socket.destroy();
  }
};

module.exports = handleContainerCreate;