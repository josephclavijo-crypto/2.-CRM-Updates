const library = {
  name: "Meta - Lead Updates - CRM Updates",
  children: [
    {
      type: "file",
      title: "Primary Funnel",
      path: "01. Meta - Lead Updates - CRM Updates/01. CRM Update - Lead Update - Primary Funnel.html",
      tags: ["Meta", "Primary Funnel", "Lead Update"],
    },
    {
      type: "file",
      title: "Simplified VSL Funnel Only",
      path: "01. Meta - Lead Updates - CRM Updates/CRM Update - Lead Update - Simplified VSL Funnel Only.html",
      tags: ["Meta", "Simplified VSL", "Funnel Only"],
    },
    {
      type: "folder",
      name: "5-Minute Opt In Funnel Variant",
      children: [
        {
          type: "file",
          title: "Meta - Video-Form Opt In",
          path: "01. Meta - Lead Updates - CRM Updates/5-Minute Opt In Funnel Variant/CRM Update - Lead Update - Meta - Video-Form Opt In.html",
          tags: ["Meta", "Video Form", "Opt In"],
        },
        {
          type: "file",
          title: "Meta - Video-Form Opt In - Page View Only",
          path: "01. Meta - Lead Updates - CRM Updates/5-Minute Opt In Funnel Variant/CRM Update - Lead Update - Meta - Video-Form Opt In - Page View Only.html",
          tags: ["Meta", "Page View Only", "Opt In"],
        },
      ],
    },
  ],
};

const state = {
  selectedPath: "",
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
};

function flatten(node, trail = []) {
  const folders = [];
  const files = [];

  for (const child of node.children || []) {
    if (child.type === "folder") {
      const nextTrail = [...trail, child.name];
      folders.push({ ...child, trail: nextTrail });
      const nested = flatten(child, nextTrail);
      folders.push(...nested.folders);
      files.push(...nested.files);
    } else {
      files.push({
        ...child,
        trail,
        searchable: `${child.title} ${child.path} ${(child.tags || []).join(" ")}`.toLowerCase(),
      });
    }
  }

  return { folders, files };
}

const flat = flatten(library, [library.name]);

function iconSvg(name) {
  const paths = {
    folder: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"></path>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M8 13h8"></path><path d="M8 17h5"></path>',
    chevron: '<path d="m6 9 6 6 6-6"></path>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function buildTree(node, root = false) {
  const group = document.createElement("div");
  group.className = "tree-group";

  const button = document.createElement("button");
  button.className = "tree-toggle";
  button.type = "button";
  button.innerHTML = `${iconSvg("chevron")} ${iconSvg("folder")} <span>${root ? node.name : node.name}</span>`;
  button.querySelector("svg").classList.add("chevron");
  button.addEventListener("click", () => group.classList.toggle("collapsed"));
  group.appendChild(button);

  const children = document.createElement("div");
  children.className = "tree-children";

  for (const child of node.children || []) {
    if (child.type === "folder") {
      children.appendChild(buildTree(child));
    } else {
      const fileButton = document.createElement("button");
      fileButton.className = "tree-file";
      fileButton.type = "button";
      fileButton.dataset.path = child.path;
      fileButton.innerHTML = `${iconSvg("file")} <span>${child.title}</span>`;
      fileButton.addEventListener("click", () => selectFile(child.path));
      children.appendChild(fileButton);
    }
  }

  group.appendChild(children);
  return group;
}

function filteredFiles() {
  const query = state.query.trim().toLowerCase();
  if (!query) return flat.files;
  return flat.files.filter((file) => file.searchable.includes(query));
}

function tagClass(tag) {
  if (/meta|lead/i.test(tag)) return "source";
  if (/variant|vsl|primary|funnel/i.test(tag)) return "variant";
  return "mode";
}

function renderList() {
  const files = filteredFiles();
  els.resultCount.textContent = `${files.length} result${files.length === 1 ? "" : "s"}`;
  els.list.innerHTML = "";

  if (!files.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No matches found.";
    els.list.appendChild(empty);
    return;
  }

  for (const file of files) {
    const card = document.createElement("button");
    card.className = `automation-card${file.path === state.selectedPath ? " active" : ""}`;
    card.type = "button";
    card.addEventListener("click", () => selectFile(file.path));
    card.innerHTML = `
      <div class="card-main">
        <span class="file-mark">${iconSvg("file")}</span>
        <span class="card-copy">
          <span class="card-title">${file.title}</span>
          <span class="card-path">${file.trail.join(" / ")}</span>
        </span>
      </div>
      <span class="tag-row">
        ${(file.tags || []).map((tag) => `<span class="tag ${tagClass(tag)}">${tag}</span>`).join("")}
      </span>
    `;
    els.list.appendChild(card);
  }
}

function renderTree() {
  els.tree.innerHTML = "";
  els.tree.appendChild(buildTree(library, true));
}

function updateActiveTreeItem() {
  document.querySelectorAll(".tree-file").forEach((button) => {
    button.classList.toggle("active", button.dataset.path === state.selectedPath);
  });
}

function getFile(path) {
  return flat.files.find((file) => file.path === path);
}

function selectFile(path) {
  const file = getFile(path);
  if (!file) return;

  state.selectedPath = path;
  els.pageTitle.textContent = file.title;
  els.previewTitle.textContent = file.title;
  els.previewPath.textContent = file.trail.join(" / ");
  els.previewFrame.src = file.path;
  els.previewOpenLink.href = file.path;
  els.openCurrentLink.href = file.path;

  updateActiveTreeItem();
  renderList();
}

function renderStats() {
  els.folderCount.textContent = String(flat.folders.length + 1);
  els.flowCount.textContent = String(flat.files.length);
  els.variantCount.textContent = String(flat.folders.filter((folder) => /variant/i.test(folder.name)).length);
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderList();
});

els.togglePreviewBtn.addEventListener("click", () => {
  document.body.classList.toggle("preview-hidden");
});

renderTree();
renderStats();
selectFile(flat.files[0].path);
