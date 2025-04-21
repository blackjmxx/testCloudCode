const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const auth = require("./auth");
const WebSocket = require("ws");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Créer une nouvelle instance
// Modifier la fonction de création d'instance
app.post("/instances", async (req, res) => {
  const { userId, repoUrl } = req.body;

  // Génération d'un ID unique pour l'instance
  const instanceId = `sandbox-${userId}-${Date.now()}`;

  // Utiliser un port externe fixe (8080) au lieu de 3000
  const externalPort = 8081;

  console.log(`External port: ${externalPort}`);

  // Lancement d'un conteneur pour cette instance avec publication de port
  exec(
    `podman run -d --name ${instanceId} -p ${externalPort}:3000 -v ${instanceId}:/sandbox sandboxbase:latest tail -f /dev/null`,
    (error, stdout) => {
      if (error) {
        console.error(`Erreur: ${error}`);
        return res
          .status(500)
          .json({ error: "Impossible de créer l'instance" });
      }

      // Si un repo est spécifié, le cloner dans l'instance
      if (repoUrl) {
        // Vérifier si le répertoire existe déjà et est vide
        exec(
          `podman exec ${instanceId} bash -c "mkdir -p /sandbox/project && [ -z \"\$(ls -A /sandbox/project)\" ] && echo 'empty' || echo 'not-empty'"`,
          (dirError, dirOutput) => {
            if (dirError) {
              console.error(
                `Erreur lors de la vérification du répertoire: ${dirError}`
              );
            }

            const isDirectoryEmpty = dirOutput.trim() === "empty";

            if (isDirectoryEmpty) {
              // Le répertoire est vide, on peut cloner directement
              exec(
                `podman exec ${instanceId} git clone ${repoUrl} /sandbox/project`,
                (gitError) => {
                  if (gitError) {
                    console.error(`Erreur lors du clonage: ${gitError}`);
                  }
                }
              );
            } else {
              // Le répertoire n'est pas vide, cloner dans un sous-répertoire temporaire puis déplacer
              exec(
                `podman exec ${instanceId} bash -c "git clone ${repoUrl} /tmp/repo && cp -r /tmp/repo/. /sandbox/project/ && rm -rf /tmp/repo"`,
                (gitError) => {
                  if (gitError) {
                    console.error(`Erreur lors du clonage: ${gitError}`);
                  }
                }
              );
            }
          }
        );
      }

      res.json({
        instanceId,
        status: "created",
        port: externalPort,
        accessUrl: `http://localhost:${externalPort}`,
      });
    }
  );
});

// Lister les instances d'un utilisateur
app.get("/instances/:userId", (req, res) => {
  const { userId } = req.params;

  exec(`podman ps --filter name=sandbox-${userId}`, (error, stdout) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Impossible de lister les instances" });
    }

    // Transformation de la sortie en tableau d'instances
    const lines = stdout
      .split("\n")
      .filter((line) => line.trim() !== "")
      .slice(1);
    const instances = lines.map((line) => {
      const parts = line.split(/\s+/);
      return {
        containerId: parts[0],
        instanceId: parts[parts.length - 1],
        status: "running",
      };
    });

    res.json({ instances });
  });
});

// Démarrer une instance
app.post("/instances/:instanceId/start", (req, res) => {
  const { instanceId } = req.params;

  exec(`podman start ${instanceId}`, (error) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Impossible de démarrer l'instance" });
    }

    res.json({ instanceId, status: "started" });
  });
});

// Arrêter une instance
app.post("/instances/:instanceId/stop", (req, res) => {
  const { instanceId } = req.params;

  exec(`podman stop ${instanceId}`, (error) => {
    if (error) {
      return res.status(500).json({ error: "Impossible d'arrêter l'instance" });
    }

    res.json({ instanceId, status: "stopped" });
  });
});

// Route pour trouver les projets Node.js disponibles dans l'instance
app.get("/instances/:instanceId/node-projects", (req, res) => {
  const { instanceId } = req.params;

  // Vérifier si l'instance existe
  exec(
    `podman ps -a --filter name=${instanceId} --format "{{.Names}}"`,
    (error, stdout) => {
      if (error || !stdout.includes(instanceId)) {
        return res.status(404).json({ error: "Instance non trouvée" });
      }

      // Chercher tous les package.json non liés à node_modules
      exec(
        `podman exec ${instanceId} find / -name package.json -not -path "*/node_modules/*" -not -path "*/\\..*" 2>/dev/null`,
        (findError, findStdout) => {
          if (findError) {
            return res.status(500).json({
              error: "Erreur lors de la recherche de projets Node.js",
            });
          }

          if (!findStdout.trim()) {
            return res.json({ projects: [] });
          }

          // Analyser les répertoires trouvés
          const projectPaths = findStdout
            .split("\n")
            .filter((path) => path.trim() !== "")
            .map((path) => {
              // Extraire le répertoire contenant package.json
              return path.substring(0, path.lastIndexOf("/"));
            });

          res.json({ projects: projectPaths });
        }
      );
    }
  );
});

// Route pour installer les dépendances et démarrer le projet en une seule commande
// Route pour installer les dépendances et démarrer le projet en une seule commande
// Ajouter cette structure pour suivre les processus en cours d'exécution
const runningProcesses = new Map();

app.post("/instances/:instanceId/setup-and-start", (req, res) => {
  const { instanceId } = req.params;
  const { directory } = req.body;

  // Forcer le démarrage du conteneur, peu importe son état actuel
  exec(`podman start ${instanceId}`, (startError) => {
    if (startError) {
      console.error(`Error starting container: ${startError}`);
      return res.status(500).json({ error: "Failed to start container" });
    }

    // Attendre un court instant pour s'assurer que le conteneur est bien démarré
    setTimeout(() => {
      // Vérifier si le conteneur est maintenant en cours d'exécution
      exec(
        `podman ps --filter name=${instanceId} --format "{{.Names}}"`,
        (checkError, checkStdout) => {
          if (checkError || !checkStdout.includes(instanceId)) {
            return res
              .status(500)
              .json({ error: "Container failed to start properly" });
          }

          // Le conteneur est maintenant en cours d'exécution, continuer avec le reste du code
          const projectDir = directory || "/sandbox/project";

          // Check if package.json exists
          exec(
            `podman exec ${instanceId} bash -c "[ -f ${projectDir}/package.json ] && echo 'exists'"`,
            (packageError, packageStdout) => {
              if (packageError || !packageStdout.includes("exists")) {
                return res
                  .status(400)
                  .json({ error: `No package.json found in ${projectDir}` });
              }

              // Vérifier et tuer les processus qui utilisent le port 3000
              exec(
                `podman exec ${instanceId} bash -c "lsof -i :3000 -t | xargs -r kill -9 && lsof -i :3001 -t | xargs -r kill -9 && lsof -i :3002 -t | xargs -r kill -9 && lsof -i :3003 -t | xargs -r kill -9"`,
                (killError) => {
                  if (killError) {
                    console.log(
                      `Note: Aucun processus à tuer ou erreur: ${killError}`
                    );
                    // On continue même s'il y a une erreur, car il est possible qu'aucun processus n'utilise ces ports
                  }

                  // Unique ID for this process
                  const processId = `${instanceId}-${Date.now()}`;
                  const logFile = path.join(logsDir, `${processId}.log`);

                  console.log(
                    `Starting process ${processId} with logs at ${logFile}`
                  );

                  // Create a log stream
                  const logStream = fs.createWriteStream(logFile, {
                    flags: "a",
                  });

                  // Execute the command directly with streaming output
                  // Forcer Next.js à utiliser le port 3000
                  const command = `cd ${projectDir} && echo 'Working directory: $(pwd)' && npm install && npm run dev -- -H 0.0.0.0 -p 3000`;
                  const podProcess = spawn("podman", [
                    "exec",
                    instanceId,
                    "bash",
                    "-c",
                    command,
                  ]);

                  // Capture and write stdout and stderr to the log file
                  podProcess.stdout.on("data", (data) => {
                    const output = data.toString();
                    logStream.write(output);
                    console.log(`[${processId}] ${output.trim()}`);
                  });

                  podProcess.stderr.on("data", (data) => {
                    const output = data.toString();
                    logStream.write(output);
                    console.error(`[${processId}] ERROR: ${output.trim()}`);
                  });

                  // Store process information
                  runningProcesses.set(processId, {
                    instanceId,
                    directory: projectDir,
                    logFile,
                    process: podProcess,
                    startTime: new Date(),
                    status: "running",
                  });

                  podProcess.on("close", (code) => {
                    const status = code === 0 ? "completed" : "failed";
                    console.log(
                      `Process ${processId} ${status} with code ${code}`
                    );

                    if (runningProcesses.has(processId)) {
                      const processInfo = runningProcesses.get(processId);
                      processInfo.status = status;
                      runningProcesses.set(processId, processInfo);
                    }

                    logStream.end();
                  });

                  res.json({
                    success: true,
                    message: "Installing and starting project",
                    directory: projectDir,
                    processId,
                  });
                }
              );
            }
          );
        }
      );
    }, 1000); // Attendre 1 seconde pour s'assurer que le conteneur est bien démarré
  });
});

// Route pour obtenir les logs d'un processus
app.get("/processes/:processId/logs", (req, res) => {
  const { processId } = req.params;
  const { offset } = req.query;

  const process = runningProcesses.get(processId);

  if (!process) {
    return res.status(404).json({ error: "Process not found" });
  }

  try {
    // Read log file stats to get size
    const stats = fs.statSync(process.logFile);
    const fileSize = stats.size;

    // Calculate how much to read
    const offsetValue = offset ? parseInt(offset) : 0;
    const length = fileSize - offsetValue;

    if (length <= 0) {
      // No new data
      return res.json({
        logs: "",
        nextOffset: fileSize,
        status: process.status,
      });
    }

    // Read from file
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(process.logFile, "r");
    fs.readSync(fd, buffer, 0, length, offsetValue);
    fs.closeSync(fd);

    const logs = buffer.toString("utf8");

    return res.json({
      logs,
      nextOffset: fileSize,
      status: process.status,
    });
  } catch (error) {
    console.error(`Error reading logs: ${error}`);
    return res.status(500).json({ error: "Unable to read logs" });
  }
});

// Add a route to stop a running process
app.post("/processes/:processId/stop", (req, res) => {
  const { processId } = req.params;

  const processInfo = runningProcesses.get(processId);
  if (!processInfo) {
    return res.status(404).json({ error: "Process not found" });
  }

  try {
    // Kill the process
    if (processInfo.process && processInfo.process.kill) {
      processInfo.process.kill();
      processInfo.status = "stopped";
      runningProcesses.set(processId, processInfo);

      return res.json({
        success: true,
        message: "Process stopped",
        processId,
      });
    } else {
      return res.status(400).json({ error: "Process cannot be stopped" });
    }
  } catch (error) {
    console.error(`Error stopping process: ${error}`);
    return res.status(500).json({ error: "Failed to stop process" });
  }
});

// Route pour obtenir tous les processus en cours d'exécution pour une instance
app.get("/instances/:instanceId/processes", (req, res) => {
  const { instanceId } = req.params;

  const processes = [];

  runningProcesses.forEach((process, processId) => {
    if (process.instanceId === instanceId) {
      processes.push({
        processId,
        directory: process.directory,
        startTime: process.startTime,
        status: process.status,
      });
    }
  });

  res.json({ processes });
});
// Exécuter une commande dans une instance
app.post("/instances/:instanceId/exec", (req, res) => {
  const { instanceId } = req.params;
  const { command } = req.body;

  exec(`podman exec ${instanceId} ${command}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        error: "Erreur d'exécution",
        details: stderr,
      });
    }

    res.json({
      instanceId,
      command,
      output: stdout,
    });
  });
});

// Route pour écrire un fichier dans l'instance
app.post("/instances/:instanceId/write-file", (req, res) => {
  const { instanceId } = req.params;
  const { path, content } = req.body;

  if (!path || content === undefined) {
    return res.status(400).json({ error: "Chemin et contenu requis" });
  }

  // Échapper le contenu pour éviter les problèmes avec les caractères spéciaux
  const escapedContent = content.replace(/"/g, '\\"');

  // Créer les répertoires si nécessaire
  exec(
    `podman exec ${instanceId} mkdir -p $(dirname "${path}")`,
    (dirError) => {
      if (dirError) {
        console.error(`Erreur lors de la création du répertoire: ${dirError}`);
        // On continue même si la création du répertoire échoue (il existe peut-être déjà)
      }

      // Écrire le contenu dans un fichier à l'aide d'une méthode plus fiable
      exec(
        `podman exec ${instanceId} bash -c 'cat > "${path}" << "EOF"
${content}
EOF'`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Erreur lors de l'écriture du fichier: ${error}`);
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({
              error: "Impossible d'écrire le fichier",
              details: stderr,
            });
          }

          res.json({
            success: true,
            instanceId,
            path,
            message: `Fichier ${path} sauvegardé avec succès`,
          });
        }
      );
    }
  );
});

// Route pour lire un fichier depuis l'instance
app.get("/instances/:instanceId/read-file", (req, res) => {
  const { instanceId } = req.params;
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Chemin requis" });
  }

  exec(`podman exec ${instanceId} cat "${path}"`, (error, stdout, stderr) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Impossible de lire le fichier", details: stderr });
    }

    res.json({
      success: true,
      content: stdout,
      path,
    });
  });
});

// Créer un serveur WebSocket pour le terminal interactif
const wss = new WebSocket.Server({ noServer: true });

// Gestion des connexions WebSocket
wss.on("connection", (ws, req) => {
  const instanceId = req.url.split("/")[2]; // Extraire l'ID d'instance de l'URL

  if (!instanceId) {
    ws.send(JSON.stringify({ error: "Instance ID manquant" }));
    ws.close();
    return;
  }

  // Lancer un shell interactif dans le conteneur
  const shell = spawn("podman", ["exec", "-it", instanceId, "/bin/bash"]);

  // Envoyer la sortie du shell au client WebSocket
  shell.stdout.on("data", (data) => {
    ws.send(JSON.stringify({ type: "stdout", data: data.toString() }));
  });

  shell.stderr.on("data", (data) => {
    ws.send(JSON.stringify({ type: "stderr", data: data.toString() }));
  });

  // Recevoir les commandes du client et les envoyer au shell
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "stdin") {
        shell.stdin.write(data.data + "\n");
      }
    } catch (error) {
      ws.send(
        JSON.stringify({ type: "error", data: "Format de message invalide" })
      );
    }
  });

  // Gérer la fermeture de la connexion
  ws.on("close", () => {
    shell.kill();
  });

  shell.on("close", (code) => {
    ws.send(JSON.stringify({ type: "exit", code }));
    ws.close();
  });
});

// Remplacer le app.listen par un serveur HTTP explicite pour supporter WebSocket
const server = require("http").createServer(app);

// Intégrer le serveur WebSocket au serveur HTTP
server.on("upgrade", (request, socket, head) => {
  if (request.url.startsWith("/terminal/")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  console.log(`API en cours d'exécution sur le port ${port}`);
});
