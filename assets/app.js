const storageKey = "crm-updates-organization-v1";

const initialLibrary = {
  id: "root",
  name: "Meta - Lead Updates - CRM Updates",
  children: [
    {
      type: "file",
      id: "primary-funnel",
      title: "Primary Funnel",
      path: "01. Meta - Lead Updates - CRM Updates/01. CRM Update - Lead Update - Primary Funnel.html",
      tags: ["Meta", "Primary Funnel", "Lead Update"],
    },
    {
      type: "file",
      id: "simplified-vsl",
      title: "Simplified VSL Funnel Only",
      path: "01. Meta - Lead Updates - CRM Updates/CRM Update - Lead Update - Simplified VSL Funnel Only.html",
      tags: ["Meta", "Simplified VSL", "Funnel Only"],
    },
    {
      type: "folder",
      id: "five-minute-variant",
      name: "5-Minute Opt In Funnel Variant",
      children: [
        {
          type: "file",
          id: "video-form-opt-in",
          title: "Meta - Video-Form Opt In",
          path: "01. Meta - Lead Updates - CRM Updates/5-Minute Opt In Funnel Variant/CRM Update - Lead Update - Meta - Video-Form Opt In.html",
          tags: ["Meta", "Video Form", "Opt In"],
        },
        {
          type: "file",
          id: "page-view-only",
          title: "Meta - Video-Form Opt In - Page View Only",
          path: "01. Meta - Lead Updates - CRM Updates/5-Minute Opt In Funnel Variant/CRM Update - Lead Update - Meta - Video-Form Opt In - Page View Only.html",
          tags: ["Meta", "Page View Only", "Opt In"],
        },
      ],
    },
  ],
};

const state = {
  library: loadLibrary(),
  selectedId: "",
  query: "",
};

const els = {
  tree: document.querySelector("#folderTree"),
  list: document.querySelector("#automationList"),
  search: document.querySelector("#searchInput"),
  pageTitle: document.querySelector("#pageTitle"),
  resultCount: document.querySelector("#resultCount"),
  folderCount: document.querySelector("#folderCount"),
  flowCount: document.querySelector("#flowCount"),
  variantCount: document.querySelector("#variantCount"),
  previewFrame: document.querySelector("#previewFrame"),
  previewTitle: document.querySelector("#previewTitle"),
  previewPath: document.querySelector("#previewPath"),
  previewOpenLink: document.querySelector("#previewOpenLink"),
  openCurrentLink: document.querySelector("#openCurrentLink"),
  togglePreviewBtn: document.querySelector("#togglePreviewBtn"),
  addFolderBtn: document.querySelector("#addFolderBtn"),
  resetLayoutBtn: document.querySelector("#resetLayoutBtn"),
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLibrary() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : clone(initialLibrary);
  } catch {
    return clone(initialLibrary);
  }
}

function saveLibrary() {
  localStorage.setItem(storageKey, JSON.stringify(state.library));
}

function flatten(node = state.library, trail = [state.library.name]) {
  const folders = [{ ...node, type: "folder", trail }];
  const files = [];

  for (const child of node.children || []) {
    if (child.type === "folder") {
      const nested = flatten(child, [...trail, child.name]);
      folders.push(...nested.folders);
      files.push(...nested.files);
    } else {
      files.push({
        ...child,
        folderId: node.id,
        trail,
        searchable: `${child.title} ${child.path} ${(child.tags || []).join(" ")} ${trail.join(" ")}`.toLowerCase(),
      });
    }
  }

  return { folders, files };
}

function iconSvg(name) {
  const paths = {
    folder: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"></path>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M8 13h8"></path><path d="M8 17h5"></path>',
    chevron: '<path d="m6 9 6 6 6-6"></path>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function findFolder(folderId, node = state.library) {
  if (node.id === folderId) return node;
  for (const child of node.children || []) {
    if (child.type === "folder") {
      const found = findFolder(folderId, child);
      if (found) return found;
    }
  }
  return null;
}

function findFile(fileId) {
  return flatten().files.find((file) => file.id === fileId);
}

function removeFile(fileId, node = state.library) {
  const index = (node.children || []).findIndex((child) => child.type === "file" && child.id === fileId);
  if (index >= 0) return node.children.splice(index, 1)[0];

  for (const child of node.children || []) {
    if (child.type === "folder") {
      const removed = removeFile(fileId, child);
      if (removed) return removed;
    }
  }

  return null;
}

function moveFile(fileId, folderId) {
  const file = findFile(fileId);
  const target = findFolder(folderId);
  if (!file || !target || file.trail.at(-1) === target.name) return;

  const removed = removeFile(fileId);
  if (!removed) return;

  target.children = target.children || [];
  target.children.push(removed);
  saveLibrary();
  render();
  selectFile(fileId);
}

function filteredFiles(files) {
  const query = state.query.trim().toLowerCase();
  if (!query) return files;
  return files.filter((file) => file.searchable.includes(query));
}

function tagClass(tag) {
  if (/meta|lead/i.test(tag)) return "source";
  if (/variant|vsl|primary|funnel/i.test(tag)) return "variant";
  return "mode";
}

function folderOptions(folders, currentFolderId) {
  return folders
    .map((folder) => {
      const selected = folder.id === currentFolderId ? " selected" : "";
      return `<option value="${folder.id}"${selected}>${folder.trail.join(" / ")}</option>`;
    })
    .join("");
}

function createAutomationCard(file, folders) {
  const card = document.createElement("div");
  card.className = `automation-card${file.id === state.selectedId ? " active" : ""}`;
  card.draggable = true;
  card.dataset.fileId = file.id;
  card.addEventListener("dragstart", (event) => {
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", file.id);
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  card.innerHTML = `
    <button class="card-main" type="button">
      <span class="file-mark">${iconSvg("file")}</span>
      <span class="card-copy">
        <span class="card-title">${file.title}</span>
        <span class="card-path">${file.trail.join(" / ")}</span>
      </span>
    </button>
    <span class="tag-row">
      ${(file.tags || []).map((tag) => `<span class="tag ${tagClass(tag)}">${tag}</span>`).join("")}
    </span>
    <label class="move-control">
      <span>Move to</span>
      <select aria-label="Move ${file.title} to folder">
        ${folderOptions(folders, file.folderId)}
      </select>
    </label>
  `;
  card.querySelector(".card-main").addEventListener("click", () => selectFile(file.id));
  card.querySelector("select").addEventListener("change", (event) => {
    moveFile(file.id, event.target.value);
  });
  return card;
}

function buildTree(node = state.library, root = false) {
  const group = document.createElement("div");
  group.className = "tree-group";
  group.dataset.folderId = node.id;

  const button = document.createElement("button");
  button.className = "tree-toggle";
  button.type = "button";
  button.innerHTML = `${iconSvg("chevron")} ${iconSvg("folder")} <span>${root ? node.name : node.name}</span>`;
  button.querySelector("svg").classList.add("chevron");
  button.addEventListener("click", () => group.classList.toggle("collapsed"));
  group.appendChild(button);

  group.addEventListener("dragover", (event) => {
    event.preventDefault();
    group.classList.add("drop-target");
  });
  group.addEventListener("dragleave", () => group.classList.remove("drop-target"));
  group.addEventListener("drop", (event) => {
    event.preventDefault();
    group.classList.remove("drop-target");
    moveFile(event.dataTransfer.getData("text/plain"), node.id);
  });

  const children = document.createElement("div");
  children.className = "tree-children";

  for (const child of node.children || []) {
    if (child.type === "folder") {
      children.appendChild(buildTree(child));
    } else {
      const fileButton = document.createElement("button");
      fileButton.className = `tree-file${child.id === state.selectedId ? " active" : ""}`;
      fileButton.type = "button";
      fileButton.dataset.fileId = child.id;
      fileButton.draggable = true;
      fileButton.innerHTML = `${iconSvg("file")} <span>${child.title}</span>`;
      fileButton.addEventListener("click", () => selectFile(child.id));
      fileButton.addEventListener("dragstart", (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", child.id);
      });
      children.appendChild(fileButton);
    }
  }

  group.appendChild(children);
  return group;
}

function createFolderSection(folder, allFiles) {
  const section = document.createElement("section");
  section.className = "folder-section";
  section.dataset.folderId = folder.id;
  const files = filteredFiles(allFiles.filter((file) => file.folderId === folder.id));

  section.innerHTML = `
    <div class="folder-section-header">
      <div class="folder-title">${iconSvg("folder")}<span>${folder.name}</span></div>
      <span class="folder-count">${files.length} item${files.length === 1 ? "" : "s"}</span>
    </div>
    <div class="folder-dropzone"></div>
  `;

  const dropzone = section.querySelector(".folder-dropzone");
  section.addEventListener("dragover", (event) => {
    event.preventDefault();
    section.classList.add("drag-over");
  });
  section.addEventListener("dragleave", () => section.classList.remove("drag-over"));
  section.addEventListener("drop", (event) => {
    event.preventDefault();
    section.classList.remove("drag-over");
    moveFile(event.dataTransfer.getData("text/plain"), folder.id);
  });

  if (!files.length) {
    const empty = document.createElement("div");
    empty.className = "folder-empty";
    empty.textContent = state.query ? "No matching automations in this folder." : "Drop automations here.";
    dropzone.appendChild(empty);
  } else {
    const folders = flatten().folders;
    files.forEach((file) => dropzone.appendChild(createAutomationCard(file, folders)));
  }

  return section;
}

function renderList() {
  const flat = flatten();
  const filtered = filteredFiles(flat.files);
  els.resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
  els.list.innerHTML = "";
  flat.folders.forEach((folder) => els.list.appendChild(createFolderSection(folder, flat.files)));
}

function renderTree() {
  els.tree.innerHTML = "";
  els.tree.appendChild(buildTree(state.library, true));
}

function renderStats() {
  const flat = flatten();
  els.folderCount.textContent = String(flat.folders.length);
  els.flowCount.textContent = String(flat.files.length);
  els.variantCount.textContent = String(flat.folders.filter((folder) => /variant/i.test(folder.name)).length);
}

function render() {
  renderTree();
  renderList();
  renderStats();
}

function selectFile(fileId) {
  const file = findFile(fileId);
  if (!file) return;

  state.selectedId = fileId;
  els.pageTitle.textContent = file.title;
  els.previewTitle.textContent = file.title;
  els.previewPath.textContent = file.trail.join(" / ");
  els.previewFrame.src = file.path;
  els.previewOpenLink.href = file.path;
  els.openCurrentLink.href = file.path;

  render();
}

function addFolder() {
  const name = window.prompt("Folder name");
  if (!name || !name.trim()) return;

  state.library.children.push({
    type: "folder",
    id: `folder-${Date.now()}`,
    name: name.trim(),
    children: [],
  });
  saveLibrary();
  render();
}

function resetLayout() {
  const confirmed = window.confirm("Reset the visual organization to the original folder structure?");
  if (!confirmed) return;

  state.library = clone(initialLibrary);
  saveLibrary();
  state.selectedId = "";
  render();
  selectFile(flatten().files[0].id);
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderList();
});

els.togglePreviewBtn.addEventListener("click", () => {
  document.body.classList.toggle("preview-hidden");
});

els.addFolderBtn.addEventListener("click", addFolder);
els.resetLayoutBtn.addEventListener("click", resetLayout);

render();
selectFile(flatten().files[0].id);
