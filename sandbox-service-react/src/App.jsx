import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import * as monaco from "monaco-editor";

// Importations des icônes Iconify
import codeIcon from "@iconify/icons-fa-solid/code";
import plusIcon from "@iconify/icons-fa-solid/plus";
import searchIcon from "@iconify/icons-fa-solid/search";
import plugIcon from "@iconify/icons-fa-solid/plug";
import folderOpenIcon from "@iconify/icons-fa-solid/folder-open";
import saveIcon from "@iconify/icons-fa-solid/save";
import terminalIcon from "@iconify/icons-fa-solid/terminal";
import rocketIcon from "@iconify/icons-fa-solid/rocket";
import stopIcon from "@iconify/icons-fa-solid/stop";
import listIcon from "@iconify/icons-fa-solid/list";
import playIcon from "@iconify/icons-fa-solid/play";
import checkIcon from "@iconify/icons-fa-solid/check";

// Définir les styles CSS
const styles = {
  root: {
    "--primary-color": "#4a6cf7",
    "--secondary-color": "#3f51b5",
    "--background-color": "#f5f7fb",
    "--component-bg": "#ffffff",
    "--text-color": "#333333",
    "--border-color": "#e0e0e0",
    "--success-color": "#4caf50",
    "--warning-color": "#ff9800",
    "--danger-color": "#f44336",
    "--radius": "8px",
    "--shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
    fontFamily: "Roboto, sans-serif",
    backgroundColor: "var(--background-color)",
    color: "var(--text-color)",
    lineHeight: 1.6,
  },
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    backgroundColor: "var(--component-bg)",
    padding: "20px",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: {
    fontSize: "28px",
    fontWeight: 700,
    color: "var(--primary-color)",
    marginBottom: "15px",
  },
  h2: {
    fontSize: "20px",
    fontWeight: 500,
    borderBottom: "2px solid var(--primary-color)",
    paddingBottom: "5px",
    display: "inline-block",
    marginBottom: "15px",
  },
  h3: {
    fontSize: "18px",
    fontWeight: 500,
    marginBottom: "15px",
  },
  section: {
    backgroundColor: "var(--component-bg)",
    borderRadius: "var(--radius)",
    marginBottom: "20px",
    padding: "20px",
    boxShadow: "var(--shadow)",
  },
  inputGroup: {
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    marginBottom: "10px",
    outline: "none",
    transition: "border-color 0.3s",
  },
  button: {
    backgroundColor: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "10px 16px",
    margin: "5px",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background-color 0.3s, transform 0.1s",
    display: "flex",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: "5px",
  },
  secondaryButton: {
    backgroundColor: "#e0e0e0",
    color: "var(--text-color)",
  },
  successButton: {
    backgroundColor: "var(--success-color)",
  },
  warningButton: {
    backgroundColor: "var(--warning-color)",
  },
  dangerButton: {
    backgroundColor: "var(--danger-color)",
  },
  flexRow: {
    display: "flex",
    gap: "10px",
  },
  flexColumn: {
    display: "flex",
    flexDirection: "column",
  },
  flexGrow: {
    flexGrow: 1,
  },
  instanceCard: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "15px",
    marginBottom: "15px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 500,
    color: "white",
    marginLeft: "10px",
  },
  statusRunning: {
    backgroundColor: "var(--success-color)",
  },
  statusStopped: {
    backgroundColor: "var(--danger-color)",
  },
  instanceActions: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "flex-end",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "15px",
  },
  tab: {
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    fontWeight: 500,
  },
  activeTab: {
    borderBottom: "2px solid var(--primary-color)",
    color: "var(--primary-color)",
  },
  sandboxContainer: {
    display: "flex",
    height: "70vh",
    marginTop: "20px",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow)",
  },
  fileExplorer: {
    width: "20%",
    height: "100%",
    overflow: "auto",
    backgroundColor: "#f8f9fa",
    borderRight: "1px solid var(--border-color)",
    padding: "10px",
  },
  editorSection: {
    width: "50%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  editor: {
    flexGrow: 1,
  },
  terminalContainer: {
    width: "30%",
    height: "100%",
    backgroundColor: "#1e1e1e",
  },
  editorControls: {
    display: "flex",
    backgroundColor: "#f8f9fa",
    padding: "10px",
    borderBottom: "1px solid var(--border-color)",
  },
  fileList: {
    listStyleType: "none",
    padding: 0,
  },
  fileItem: {
    padding: "8px 10px",
    cursor: "pointer",
    borderRadius: "var(--radius)",
    marginBottom: "2px",
    fontSize: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileItemHover: {
    backgroundColor: "rgba(74, 108, 247, 0.1)",
  },
  fileItemActive: {
    backgroundColor: "rgba(74, 108, 247, 0.2)",
    color: "var(--primary-color)",
    fontWeight: 500,
  },
  commandOutput: {
    backgroundColor: "#f8f9fa",
    padding: "10px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border-color)",
    fontFamily: "monospace",
    maxHeight: "200px",
    overflow: "auto",
    marginTop: "10px",
  },
  textarea: {
    width: "100%",
    height: "300px",
    fontFamily: "monospace",
    resize: "vertical",
    backgroundColor: "#f8f9fa",
  },
  logsContainer: {
    backgroundColor: "#1e1e1e",
    color: "#f0f0f0",
    padding: "10px",
    borderRadius: "var(--radius)",
    fontFamily: "monospace",
    height: "400px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  npmInfo: {
    color: "#3498db",
  },
  npmError: {
    color: "#e74c3c",
  },
  npmWarn: {
    color: "#f39c12",
  },
  npmSuccess: {
    color: "#2ecc71",
  },
  previewFrameContainer: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    backgroundColor: "#fff",
    boxShadow: "var(--shadow)",
    marginTop: "10px",
  },
  previewFrame: {
    display: "block",
    backgroundColor: "white",
    width: "100%",
    height: "600px",
    border: "none",
  },
  notification: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    minWidth: "300px",
    maxWidth: "400px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationSuccess: {
    backgroundColor: "var(--success-color)",
  },
  notificationDanger: {
    backgroundColor: "var(--danger-color)",
  },
  notificationWarning: {
    backgroundColor: "var(--warning-color)",
  },
  notificationInfo: {
    backgroundColor: "var(--primary-color)",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
};

// Composant de notification
const Notification = ({ notification, onClose }) => {
  let bgColor;
  switch (notification.type) {
    case "success":
      bgColor = styles.notificationSuccess;
      break;
    case "danger":
      bgColor = styles.notificationDanger;
      break;
    case "warning":
      bgColor = styles.notificationWarning;
      break;
    default:
      bgColor = styles.notificationInfo;
  }

  return (
    <div style={{ ...styles.notification, ...bgColor }}>
      <span>{notification.message}</span>
      <button
        style={styles.closeButton}
        onClick={() => onClose(notification.id)}
      >
        ×
      </button>
    </div>
  );
};

// Composant principal de l'application
function App() {
  const API_URL = "http://localhost:3000";

  // États des formulaires
  const [userId, setUserId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [userIdQuery, setUserIdQuery] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [instanceIdCmd, setInstanceIdCmd] = useState("");
  const [command, setCommand] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [projectDirectory, setProjectDirectory] = useState("");
  const [editorFilePath, setEditorFilePath] = useState("");

  // États des données
  const [instances, setInstances] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [commandOutput, setCommandOutput] = useState("");
  const [projects, setProjects] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [logs, setLogs] = useState("");
  const [notifications, setNotifications] = useState([]);

  // États de l'interface
  const [activeTab, setActiveTab] = useState("dev-environment");
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [showProcessLogs, setShowProcessLogs] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRunningProcesses, setShowRunningProcesses] = useState(false);

  // Autres états
  const [currentProcessId, setCurrentProcessId] = useState(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [processLogs, setProcessLogs] = useState("");
  const [processInfo, setProcessInfo] = useState("");

  // Références DOM
  const terminalRef = useRef(null);
  const termRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const logsPollingIntervalRef = useRef(null);
  const logsContainerRef = useRef(null);

  // Effets pour initialiser les composants
  useEffect(() => {
    // Initialiser l'éditeur après un court délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      initEditor();
    }, 300);

    return () => {
      clearTimeout(timer);
      // Nettoyage lors du démontage
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, []); // Dépendances vides pour n'exécuter qu'au montage

  // Effet pour mettre à jour l'éditeur lorsque l'onglet ou l'élément DOM change
  useEffect(() => {
    if (
      activeTab === "dev-environment" &&
      editorRef.current &&
      !monacoRef.current
    ) {
      initEditor();
    }
  }, [activeTab, editorRef.current]);

  // Fonction pour afficher une notification
  const showNotification = (message, type = "info") => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }, 5000);
  };

  // Fonction pour fermer une notification
  const closeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  // Fonction pour créer une instance
  const createInstance = async () => {
    if (!userId) {
      showNotification("Veuillez entrer un ID utilisateur", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/instances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, repoUrl }),
      });

      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
      } else {
        showNotification(`Instance créée: ${data.instanceId}`, "success");
        setInstanceId(data.instanceId);
        setInstanceIdCmd(data.instanceId);
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour lister les instances
  const listInstances = async () => {
    if (!userIdQuery) {
      showNotification("Veuillez entrer un ID utilisateur", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/instances/${userIdQuery}`);
      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
        return;
      }

      if (!data.instances || data.instances.length === 0) {
        setInstances([]);
        showNotification("Aucune instance trouvée", "info");
        return;
      }

      setInstances(data.instances);
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour sélectionner une instance
  const selectInstance = (id) => {
    setInstanceId(id);
    setInstanceIdCmd(id);
    showNotification(`Instance ${id} sélectionnée`, "success");
  };

  // Fonction pour démarrer une instance
  const startInstance = async (id) => {
    try {
      const response = await fetch(`${API_URL}/instances/${id}/start`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
      } else {
        showNotification(`Instance démarrée: ${data.instanceId}`, "success");
        listInstances();
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour arrêter une instance
  const stopInstance = async (id) => {
    try {
      const response = await fetch(`${API_URL}/instances/${id}/stop`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
      } else {
        showNotification(`Instance arrêtée: ${data.instanceId}`, "success");
        listInstances();
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour exécuter une commande
  const executeCommand = async () => {
    const id = instanceIdCmd || instanceId;

    if (!id) {
      showNotification("Veuillez entrer un ID d'instance", "warning");
      return;
    }

    if (!command) {
      showNotification("Veuillez entrer une commande", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/instances/${id}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (data.error) {
        setCommandOutput(`Erreur: ${data.error}`);
      } else {
        setCommandOutput(data.output);
      }
    } catch (error) {
      setCommandOutput(`Erreur: ${error}`);
    }
  };

  // Fonction pour initialiser le terminal
  const initTerminal = () => {
    if (termRef.current) {
      termRef.current.dispose();
    }

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
        foreground: "#f0f0f0",
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      lineHeight: 1.2,
    });

    term.open(terminalRef.current);
    termRef.current = term;
    return term;
  };

  // Fonction pour connecter au WebSocket pour le terminal interactif
  const connectTerminal = (id) => {
    const term = initTerminal();
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = `${window.location.hostname}:3000`; // Utiliser le port 3000 pour WebSocket
    const ws = new WebSocket(`${wsProtocol}//${wsHost}/terminal/${id}`);

    ws.onopen = () => {
      term.writeln("Terminal connecté à l'instance " + id);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "stdout" || data.type === "stderr") {
        term.write(data.data);
      } else if (data.type === "exit") {
        term.writeln(`\r\nProcessus terminé avec le code ${data.code}`);
        setTimeout(() => connectTerminal(id), 1000);
      } else if (data.type === "error") {
        term.writeln(`\r\nErreur: ${data.data}`);
      }
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "stdin", data }));
      }
    });

    ws.onclose = () => {
      term.writeln("\r\nConnexion fermée. Tentative de reconnexion...");
      setTimeout(() => connectTerminal(id), 1000);
    };

    ws.onerror = (error) => {
      term.writeln(`\r\nErreur WebSocket: ${error.message}`);
    };
  };

  // Fonction pour initialiser l'éditeur Monaco
  const initEditor = () => {
    // Nettoyons d'abord toute instance existante
    if (monacoRef.current) {
      monacoRef.current.dispose();
      monacoRef.current = null;
    }

    // Assurons-nous que l'élément DOM existe
    if (!editorRef.current) return;

    // Créons une nouvelle instance avec des options minimales
    monacoRef.current = monaco.editor.create(editorRef.current, {
      value: "// Sélectionnez un fichier pour commencer à éditer",
      language: "javascript",
      theme: "vs-dark",
      readOnly: false,
      automaticLayout: true,
    });

    // Vérifions que l'éditeur est bien créé
    if (monacoRef.current) {
      console.log("Éditeur Monaco initialisé avec succès");

      // Ajoutons un événement pour détecter les changements
      monacoRef.current.onDidChangeModelContent(() => {
        console.log("Contenu modifié dans l'éditeur");
      });

      // Forçons le focus
      setTimeout(() => {
        monacoRef.current.focus();
        console.log("Focus appliqué à l'éditeur");
      }, 200);
    } else {
      console.error("Échec de l'initialisation de l'éditeur Monaco");
    }
  };

  // Fonction pour se connecter à une instance
  const connectToInstance = async () => {
    if (!instanceId) {
      showNotification("Veuillez spécifier un ID d'instance", "warning");
      return;
    }

    connectTerminal(instanceId);

    // Charger la structure de fichiers de l'instance
    try {
      const response = await fetch(`${API_URL}/instances/${instanceId}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: 'find /sandbox -type f | grep -v "node_modules" | sort',
        }),
      });

      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
        return;
      }

      if (!data.output || data.output.trim() === "") {
        setFiles([]);
        showNotification("Aucun fichier trouvé", "warning");
        return;
      }

      const fileList = data.output.split("\n").filter((f) => f);
      setFiles(fileList);

      showNotification(`Connecté à l'instance ${instanceId}`, "success");
    } catch (error) {
      showNotification(
        `Erreur lors du chargement des fichiers: ${error}`,
        "danger"
      );
    }
  };

  // Fonction pour charger un fichier dans l'éditeur Monaco
  const loadFileToMonaco = async (filePath) => {
    try {
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/read-file?path=${encodeURIComponent(
          filePath
        )}`
      );
      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
        return;
      }

      // Définir le langage en fonction de l'extension du fichier
      const extension = filePath.split(".").pop().toLowerCase();
      let language = "plaintext";

      switch (extension) {
        case "js":
          language = "javascript";
          break;
        case "html":
          language = "html";
          break;
        case "css":
          language = "css";
          break;
        case "py":
          language = "python";
          break;
        case "json":
          language = "json";
          break;
        case "md":
          language = "markdown";
          break;
        case "ts":
          language = "typescript";
          break;
        case "jsx":
          language = "javascript";
          break;
        case "tsx":
          language = "typescript";
          break;
        default:
          language = "plaintext";
      }

      // Mettre à jour l'éditeur en vérifiant que le modèle existe
      setEditorFilePath(filePath);

      if (monacoRef.current) {
        // Vérifier si un modèle existe déjà
        const model = monacoRef.current.getModel();

        if (model) {
          // Si un modèle existe, mettre à jour son contenu et son langage
          monaco.editor.setModelLanguage(model, language);
          monacoRef.current.setValue(data.content);
        } else {
          // Si aucun modèle n'existe, en créer un nouveau avec le bon langage
          const newModel = monaco.editor.createModel(data.content, language);
          monacoRef.current.setModel(newModel);
        }
      }

      // Sauvegarder le fichier actif
      setActiveFile(filePath);

      showNotification(`Fichier ${filePath} chargé`, "success");
    } catch (error) {
      showNotification(
        `Erreur lors du chargement du fichier: ${error}`,
        "danger"
      );
    }
  };

  // Fonction pour sauvegarder un fichier depuis Monaco
  const saveFileWithMonaco = async () => {
    if (!instanceId || !editorFilePath) {
      showNotification(
        "Veuillez spécifier une instance et un chemin de fichier",
        "warning"
      );
      return;
    }

    try {
      // S'assurer que monacoRef.current existe
      if (!monacoRef.current) {
        throw new Error("L'éditeur n'est pas initialisé");
      }

      const content = monacoRef.current.getValue();

      const response = await fetch(
        `${API_URL}/instances/${instanceId}/write-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: editorFilePath,
            content,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      showNotification(`Fichier ${editorFilePath} sauvegardé!`, "success");
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour sauvegarder un fichier depuis l'éditeur simple
  const saveFile = async () => {
    if (!instanceId) {
      showNotification("Veuillez entrer un ID d'instance", "warning");
      return;
    }

    if (!filePath) {
      showNotification("Veuillez entrer un chemin de fichier", "warning");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/write-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: filePath,
            content: fileContent,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
      } else {
        showNotification(
          `Fichier ${data.path} sauvegardé avec succès`,
          "success"
        );
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour trouver les projets Node.js
  const findNodeProjects = async () => {
    if (!instanceId) {
      showNotification("Veuillez entrer un ID d'instance", "warning");
      return;
    }

    showNotification("Recherche des projets Node.js...", "info");

    try {
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/node-projects`
      );
      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
        return;
      }

      if (!data.projects || data.projects.length === 0) {
        setProjects([]);
        showProjectSelection(true);
        showNotification("Aucun projet Node.js détecté", "info");
        return;
      }

      setProjects(data.projects);
      setShowProjectSelection(true);
      showNotification(
        `${data.projects.length} projet(s) Node.js trouvé(s)`,
        "success"
      );
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour sélectionner un projet
  const selectProject = (projectPath) => {
    setProjectDirectory(projectPath);
    showNotification(`Projet ${projectPath} sélectionné`, "success");
  };

  // Fonction pour configurer et démarrer un projet
  const setupAndStartProject = async () => {
    if (!instanceId) {
      showNotification("Veuillez entrer un ID d'instance", "warning");
      return;
    }

    const directory = projectDirectory.trim() || "/sandbox/project";

    showNotification(`Préparation du projet dans ${directory}...`, "info");

    try {
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/setup-and-start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ directory }),
        }
      );

      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
      } else {
        showNotification(
          `Installation et démarrage du projet en cours dans ${data.directory}...`,
          "success"
        );

        // Afficher la section des logs explicitement
        setShowProcessLogs(true);

        // Réinitialiser les logs
        setLogs("");

        // Mettre à jour les informations du processus
        setProcessInfo(`Processus dans ${data.directory}`);

        // Commencer à récupérer les logs
        setCurrentProcessId(data.processId);
        setCurrentOffset(0);

        // Démarrer le polling immédiatement
        const processId = data.processId;
        console.log(`Démarrage du polling pour le processus ${processId}`);

        // Arrêter tout intervalle existant
        if (logsPollingIntervalRef.current) {
          clearInterval(logsPollingIntervalRef.current);
          logsPollingIntervalRef.current = null;
        }

        // Fonction de récupération des logs spécifique à ce processus
        const fetchLogsForProcess = async () => {
          try {
            console.log(
              `Récupération des logs pour ${processId}, offset: ${currentOffset}`
            );
            const logsResponse = await fetch(
              `${API_URL}/processes/${processId}/logs?offset=${currentOffset}`
            );

            if (!logsResponse.ok) {
              console.error(`Erreur HTTP: ${logsResponse.status}`);
              return;
            }

            const logsData = await logsResponse.json();

            if (logsData.logs) {
              setLogs((prev) => prev + logsData.logs);
              setCurrentOffset(logsData.nextOffset);

              // Faire défiler jusqu'en bas
              if (logsContainerRef.current) {
                logsContainerRef.current.scrollTop =
                  logsContainerRef.current.scrollHeight;
              }
            }

            if (logsData.status === "completed") {
              console.log("Processus terminé");
              clearInterval(logsPollingIntervalRef.current);
              logsPollingIntervalRef.current = null;
            }
          } catch (error) {
            console.error("Erreur lors de la récupération des logs:", error);
          }
        };

        // Récupérer les logs immédiatement
        fetchLogsForProcess();

        // Puis configurer l'intervalle
        logsPollingIntervalRef.current = setInterval(fetchLogsForProcess, 2000);

        // Afficher la preview après un délai
        setTimeout(() => {
          setShowPreview(true);
        }, 5000);
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour lister les processus en cours
  const listRunningProcesses = async () => {
    if (!instanceId) {
      showNotification("Veuillez entrer un ID d'instance", "warning");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/processes`
      );
      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
        return;
      }

      setProcesses(data.processes || []);
      setShowRunningProcesses(true);

      if (!data.processes || data.processes.length === 0) {
        showNotification("Aucun processus en cours d'exécution", "info");
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour charger un fichier dans l'éditeur simple
  const loadFile = async () => {
    if (!instanceId) {
      showNotification("Veuillez entrer un ID d'instance", "warning");
      return;
    }

    if (!filePath) {
      showNotification("Veuillez entrer un chemin de fichier", "warning");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/read-file?path=${encodeURIComponent(
          filePath
        )}`
      );
      const data = await response.json();

      if (data.error) {
        showNotification(`Erreur: ${data.error}`, "danger");
      } else {
        setFileContent(data.content);
        showNotification(`Fichier ${filePath} chargé avec succès`, "success");
      }
    } catch (error) {
      showNotification(`Erreur: ${error}`, "danger");
    }
  };

  // Fonction pour récupérer les logs
  const fetchLogs = async () => {
    if (!currentProcessId) {
      console.log("Aucun processId défini, impossible de récupérer les logs");
      return;
    }

    console.log(
      `Récupération des logs pour le processus ${currentProcessId}, offset: ${currentOffset}`
    );

    try {
      const response = await fetch(
        `${API_URL}/processes/${currentProcessId}/logs?offset=${currentOffset}`
      );

      if (!response.ok) {
        console.error(
          `Erreur HTTP: ${response.status} - ${response.statusText}`
        );
        return;
      }

      const data = await response.json();
      console.log("Données de logs reçues:", data);

      if (data.logs) {
        console.log(`Logs reçus: ${data.logs.length} caractères`);
        setLogs((prevLogs) => prevLogs + data.logs);
        setCurrentOffset(data.nextOffset);

        // Faire défiler jusqu'en bas
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop =
            logsContainerRef.current.scrollHeight;
        }
      }

      if (data.status === "completed") {
        console.log("Processus terminé, arrêt du polling");
        if (logsPollingIntervalRef.current) {
          clearInterval(logsPollingIntervalRef.current);
          logsPollingIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des logs:", error);
    }
  };

  // Fonction pour récupérer les logs du processus
  const fetchProcessLogs = async () => {
    if (!instanceId) {
      showNotification("Veuillez spécifier une instance", "warning");
      return;
    }

    try {
      // Vérifier l'URL correcte pour les logs dans votre API
      // Il semble que l'URL actuelle ne soit pas valide
      console.log(
        "Tentative de récupération des logs pour l'instance:",
        instanceId
      );

      // Essayons avec un endpoint différent - vérifiez la documentation de votre API
      // pour connaître l'URL correcte
      const response = await fetch(
        `${API_URL}/instances/${instanceId}/process-logs`
      );

      // Si cette URL ne fonctionne pas non plus, essayez ces alternatives:
      // `${API_URL}/instances/${instanceId}/stdout`
      // `${API_URL}/instances/logs/${instanceId}`

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP: ${response.status} - ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (data.error) {
          showNotification(`Erreur: ${data.error}`, "danger");
          return;
        }

        setProcessLogs(data.logs || "Aucun log disponible");
      } else {
        const textData = await response.text();

        if (textData.includes("<!DOCTYPE") || textData.includes("<html>")) {
          console.error(
            "Réponse HTML reçue au lieu de JSON:",
            textData.substring(0, 100)
          );
          setProcessLogs(
            "Erreur: Le serveur a renvoyé une page HTML au lieu des logs"
          );
          showNotification(
            "Erreur de format dans la réponse du serveur",
            "danger"
          );
        } else {
          setProcessLogs(textData || "Aucun log disponible");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des logs:", error);
      setProcessLogs(`Erreur: ${error.message}`);
      showNotification(
        `Erreur lors de la récupération des logs: ${error.message}`,
        "danger"
      );
    }
  };

  // Désactivons temporairement l'intervalle automatique pour éviter les erreurs répétées
  useEffect(() => {
    if (instanceId) {
      // Récupérer les logs une seule fois au démarrage
      fetchProcessLogs();

      // Commentons l'intervalle jusqu'à ce que nous trouvions l'URL correcte
      // const logsInterval = setInterval(fetchProcessLogs, 5000);
      // return () => clearInterval(logsInterval);
    }
  }, [instanceId]);

  // Ajoutons un bouton pour vérifier les endpoints disponibles
  const checkAvailableEndpoints = async () => {
    if (!instanceId) return;

    const endpoints = [
      `/instances/${instanceId}/logs`,
      `/instances/${instanceId}/process-logs`,
      `/instances/${instanceId}/stdout`,
      `/instances/logs/${instanceId}`,
      `/logs/${instanceId}`,
    ];

    setProcessLogs("Vérification des endpoints disponibles...\n");

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_URL}${endpoint}`);
        setProcessLogs(
          (prev) =>
            `${prev}\n${endpoint}: ${response.status} ${response.statusText}`
        );
      } catch (error) {
        setProcessLogs(
          (prev) => `${prev}\n${endpoint}: Erreur - ${error.message}`
        );
      }
    }
  };

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (logsPollingIntervalRef.current) {
        console.log("Nettoyage de l'intervalle de polling lors du démontage");
        clearInterval(logsPollingIntervalRef.current);
      }
    };
  }, []);

  // Rendu de l'interface utilisateur
  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.h1}>
          <Icon icon={codeIcon} /> Sandbox Service
        </h1>
      </header>

      <div style={styles.container}>
        {/* Section de création d'instance */}
        <div style={styles.section}>
          <h2 style={styles.h2}>Créer une nouvelle instance</h2>
          <div style={styles.flexRow}>
            <div style={{ ...styles.flexColumn, ...styles.flexGrow }}>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="ID Utilisateur"
                  style={styles.input}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="URL du dépôt GitHub (optionnel)"
                  style={styles.input}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button style={styles.button} onClick={createInstance}>
                <Icon icon={plusIcon} style={styles.buttonIcon} /> Créer
                Instance
              </button>
            </div>
          </div>
        </div>

        {/* Section des instances existantes */}
        <div style={styles.section}>
          <h2 style={styles.h2}>Mes instances</h2>
          <div style={styles.flexRow}>
            <div style={{ ...styles.inputGroup, ...styles.flexGrow }}>
              <input
                type="text"
                placeholder="ID Utilisateur"
                style={styles.input}
                value={userIdQuery}
                onChange={(e) => setUserIdQuery(e.target.value)}
              />
            </div>
            <button style={styles.button} onClick={listInstances}>
              <Icon icon={searchIcon} style={styles.buttonIcon} /> Lister les
              instances
            </button>
          </div>
          <div>
            {instances.length === 0 ? (
              <p>Aucune instance trouvée</p>
            ) : (
              instances.map((instance) => (
                <div key={instance.instanceId} style={styles.instanceCard}>
                  <p>
                    <strong>Instance ID:</strong> {instance.instanceId}
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(instance.status === "running"
                          ? styles.statusRunning
                          : styles.statusStopped),
                      }}
                    >
                      {instance.status === "running"
                        ? "En cours d'exécution"
                        : "Arrêtée"}
                    </span>
                  </p>
                  <div style={styles.instanceActions}>
                    <button
                      style={{ ...styles.button, ...styles.successButton }}
                      onClick={() => startInstance(instance.instanceId)}
                    >
                      <Icon icon={playIcon} style={styles.buttonIcon} />{" "}
                      Démarrer
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.dangerButton }}
                      onClick={() => stopInstance(instance.instanceId)}
                    >
                      <Icon icon={stopIcon} style={styles.buttonIcon} /> Arrêter
                    </button>
                    <button
                      style={styles.button}
                      onClick={() => selectInstance(instance.instanceId)}
                    >
                      <Icon icon={checkIcon} style={styles.buttonIcon} />{" "}
                      Sélectionner
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section des onglets */}
        <div style={styles.section}>
          <div style={styles.tabContainer}>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "dev-environment" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("dev-environment")}
            >
              Environnement de développement
            </div>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "simple-editor" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("simple-editor")}
            >
              Éditeur simple
            </div>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "command-execution" ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab("command-execution")}
            >
              Exécution de commandes
            </div>
          </div>

          {/* Contenu de l'onglet "Environnement de développement" */}
          {activeTab === "dev-environment" && (
            <div>
              <div style={styles.flexRow}>
                <div style={{ ...styles.inputGroup, ...styles.flexGrow }}>
                  <input
                    type="text"
                    placeholder="ID de l'instance"
                    style={styles.input}
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                  />
                </div>
                <button style={styles.button} onClick={connectToInstance}>
                  <Icon icon={plugIcon} style={styles.buttonIcon} /> Se
                  connecter
                </button>
              </div>

              <div style={styles.sandboxContainer}>
                <div style={styles.fileExplorer}>
                  <h3 style={styles.h3}>Fichiers</h3>
                  <ul style={styles.fileList}>
                    {files.length === 0 ? (
                      <li>Aucun fichier trouvé</li>
                    ) : (
                      files.map((file, index) => (
                        <li
                          key={index}
                          style={{
                            ...styles.fileItem,
                            ...(activeFile === file
                              ? styles.fileItemActive
                              : {}),
                          }}
                          onClick={() => loadFileToMonaco(file)}
                        >
                          {file}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div style={styles.editorSection}>
                  <div style={styles.editorControls}>
                    <input
                      type="text"
                      placeholder="Chemin du fichier"
                      style={{
                        ...styles.input,
                        marginBottom: 0,
                        marginRight: "10px",
                      }}
                      value={editorFilePath}
                      onChange={(e) => setEditorFilePath(e.target.value)}
                    />
                    <button style={styles.button} onClick={saveFileWithMonaco}>
                      <Icon icon={saveIcon} style={styles.buttonIcon} />{" "}
                      Sauvegarder
                    </button>
                  </div>
                  <div
                    className="editor-container"
                    style={{ width: "100%", height: "100%" }}
                  >
                    <div
                      ref={editorRef}
                      style={{
                        width: "100%",
                        height: "500px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                </div>
                <div ref={terminalRef} style={styles.terminalContainer} />
              </div>
            </div>
          )}

          {/* Contenu de l'onglet "Éditeur simple" */}
          {activeTab === "simple-editor" && (
            <div>
              <h3 style={styles.h3}>Éditeur de fichiers simple</h3>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Chemin du fichier (ex: /sandbox/index.js)"
                  style={styles.input}
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                />
              </div>
              <div style={{ ...styles.flexRow, marginBottom: "10px" }}>
                <button style={styles.button} onClick={loadFile}>
                  <Icon icon={folderOpenIcon} style={styles.buttonIcon} />{" "}
                  Charger
                </button>
                <button style={styles.button} onClick={saveFile}>
                  <Icon icon={saveIcon} style={styles.buttonIcon} /> Sauvegarder
                </button>
              </div>
              <textarea
                style={styles.textarea}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
              />
            </div>
          )}

          {/* Contenu de l'onglet "Exécution de commandes" */}
          {activeTab === "command-execution" && (
            <div>
              <h3 style={styles.h3}>Exécuter une commande</h3>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="ID de l'instance"
                  style={styles.input}
                  value={instanceIdCmd}
                  onChange={(e) => setInstanceIdCmd(e.target.value)}
                />
              </div>
              <div style={styles.flexRow}>
                <div style={{ ...styles.inputGroup, ...styles.flexGrow }}>
                  <input
                    type="text"
                    placeholder="Commande à exécuter"
                    style={styles.input}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                  />
                </div>
                <button style={styles.button} onClick={executeCommand}>
                  <Icon icon={terminalIcon} style={styles.buttonIcon} />{" "}
                  Exécuter
                </button>
              </div>
              <pre style={styles.commandOutput}>{commandOutput}</pre>
            </div>
          )}

          {/* Section des projets Node.js */}
          {showProjectSelection && (
            <div style={styles.section}>
              <h2 style={styles.h2}>Projets Node.js détectés</h2>
              <p>Sélectionnez un projet pour l'installer et le démarrer :</p>
              <div>
                {projects.length === 0 ? (
                  <p>Aucun projet Node.js détecté</p>
                ) : (
                  projects.map((project, index) => (
                    <div key={index} style={styles.instanceCard}>
                      <div>{project}</div>
                      <div style={styles.instanceActions}>
                        <button
                          style={{
                            ...styles.button,
                            ...styles.secondaryButton,
                          }}
                          onClick={() => selectProject(project)}
                        >
                          <Icon icon={checkIcon} style={styles.buttonIcon} />{" "}
                          Sélectionner
                        </button>
                        <button
                          style={{ ...styles.button, ...styles.successButton }}
                          onClick={() => setupAndStartProject(project)}
                        >
                          <Icon icon={rocketIcon} style={styles.buttonIcon} />{" "}
                          Installer et démarrer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div
            style={{
              ...styles.flexRow,
              marginTop: "10px",
              marginBottom: "10px",
            }}
          >
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={findNodeProjects}
            >
              <Icon icon={searchIcon} style={styles.buttonIcon} /> Trouver les
              projets Node.js
            </button>
            <div style={{ ...styles.inputGroup, ...styles.flexGrow }}>
              <input
                type="text"
                placeholder="Répertoire du projet (optionnel)"
                style={styles.input}
                value={projectDirectory}
                onChange={(e) => setProjectDirectory(e.target.value)}
              />
            </div>
            <button
              style={{ ...styles.button, ...styles.successButton }}
              onClick={setupAndStartProject}
            >
              <Icon icon={rocketIcon} style={styles.buttonIcon} /> Installer et
              démarrer le projet
            </button>
          </div>
        </div>

        {/* Section des logs de processus */}
        {showProcessLogs && (
          <div className="section">
            <h2>Logs du processus</h2>
            <div id="current-process-info">{processInfo}</div>
            <pre
              ref={logsContainerRef}
              id="process-logs-content"
              style={{
                height: "300px",
                overflowY: "auto",
                backgroundColor: "#1e1e1e",
                color: "#f0f0f0",
                padding: "10px",
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                marginTop: "10px",
              }}
            >
              {logs || "En attente des logs..."}
            </pre>
          </div>
        )}

        {/* Section de preview */}
        {showPreview && (
          <div className="section">
            <h2>Preview de l'application</h2>
            <iframe
              src="http://localhost:8081"
              style={{
                width: "100%",
                height: "500px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              title="Application Preview"
            />
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={listRunningProcesses}
          >
            <Icon icon={listIcon} style={styles.buttonIcon} /> Voir les
            processus en cours
          </button>
        </div>

        {/* Section des processus en cours */}
        {showRunningProcesses && (
          <div style={styles.section}>
            <h2 style={styles.h2}>Processus en cours</h2>
            <div>
              {processes.length === 0 ? (
                <p>Aucun processus en cours d'exécution</p>
              ) : (
                processes.map((process, index) => (
                  <div key={index} style={styles.instanceCard}>
                    <p>
                      <strong>ID:</strong> {process.id}
                    </p>
                    <p>
                      <strong>Commande:</strong> {process.command}
                    </p>
                    <p>
                      <strong>PID:</strong> {process.pid}
                    </p>
                    <p>
                      <strong>État:</strong> {process.status}
                    </p>
                    <div style={styles.instanceActions}>
                      <button
                        style={{ ...styles.button, ...styles.dangerButton }}
                        onClick={() => {
                          setCurrentProcessId(process.id);
                          setCurrentOffset(0);
                          setLogs("");
                          setShowProcessLogs(true);
                          setupAndStartProject();
                        }}
                      >
                        <Icon icon={terminalIcon} style={styles.buttonIcon} />{" "}
                        Voir les logs
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={closeNotification}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
