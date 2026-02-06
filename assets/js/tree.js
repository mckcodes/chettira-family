(async function () {
  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);

  const BRANCH_COLORS = {
    "Sri Bopaiah":  "#1d4ed8", // deep blue
    "Sri Subbaiah": "#0ea5e9", // sky blue
    "Sri Chengappa":"#6366f1", // indigo
    "ROOT":         "#2563eb"
  };

  function getBranchName(d) {
    if (!d) return "ROOT";
    if (d.depth === 0) return "ROOT";
    let cur = d;
    while (cur.depth > 1) cur = cur.parent;
    return cur?.data?.name || "ROOT";
  }

  function getBranchColor(d) {
    const b = getBranchName(d);
    return BRANCH_COLORS[b] || BRANCH_COLORS["ROOT"];
  }

  function extractSpouseChildren(d) {
    const rawChildren = (d.children || d._children || []).map(c => c.data?.name || "");
    const spouseNodes = rawChildren.filter(n => /^(wife|husband)\s*:/i.test(n));
    const spouse = spouseNodes.map(s => s.replace(/^(wife|husband)\s*:\s*/i, ""));
    const children = rawChildren.filter(n => !/^(wife|husband)\s*:/i.test(n));
    return { spouse, children };
  }

  function setDetails(d) {
    const panel = $("details");
    if (!d) {
      panel.innerHTML = `
        <h3>Node Details</h3>
        <p class="meta">Select a person’s name in the tree to view spouse/children and notes.</p>
        <p class="kicker">Tip: Add photos via <code>assets/images/people/</code> + JSON field <code>"photo"</code>.</p>
      `;
      return;
    }

    const branch = getBranchName(d);
    const { spouse, children } = extractSpouseChildren(d);
    const notes = d.data?.notes || "";
    const photo = d.data?.photo || "";

    panel.innerHTML = `
      <h3>${d.data.name}</h3>
      <div class="meta">
        <span class="pill">Branch: ${branch.replace("Sri ","")}</span>
        ${photo ? `<span class="pill">Photo</span>` : ``}
      </div>

      ${spouse.length ? `
        <strong>Spouse</strong>
        <ul>${spouse.map(s => `<li>${s}</li>`).join("")}</ul>
      ` : `<p class="kicker">Spouse: (not recorded here)</p>`}

      ${children.length ? `
        <strong>Children</strong>
        <ul>${children.map(c => `<li>${c}</li>`).join("")}</ul>
      ` : `<p class="kicker">Children: (none listed / not recorded)</p>`}

      ${notes ? `<hr /><strong>Notes</strong><p>${notes}</p>` : ``}
    `;
  }

  // Collapse / expand helpers
  function collapseAll(node) {
    if (node.children) {
      node._children = node.children;
      node._children.forEach(collapseAll);
      node.children = null;
    }
  }

  function expandAll(node) {
    if (node._children) {
      node.children = node._children;
      node._children = null;
    }
    if (node.children) node.children.forEach(expandAll);
  }

  function collapseToDepth(node, depth) {
    // depth means: keep nodes expanded up to < depth
    if (!node) return;
    if (depth === 999) {
      expandAll(node);
      return;
    }
    if (node.depth >= depth) {
      collapseAll(node);
      return;
    }
    // ensure expanded then recurse
    if (node._children) {
      node.children = node._children;
      node._children = null;
    }
    if (node.children) node.children.forEach(child => collapseToDepth(child, depth));
  }

  function expandToNode(d) {
    // expand ancestors so node is visible
    let cur = d;
    while (cur) {
      if (cur._children) {
        cur.children = cur._children;
        cur._children = null;
      }
      cur = cur.parent;
    }
  }

  // ---------- Load data ----------
  const data = await fetch("assets/data/family-tree.json").then(r => r.json());
  const root = d3.hierarchy(data);

  // ---------- SVG Setup ----------
  const treeContainer = $("tree");
  const width = () => treeContainer.clientWidth || 1200;
  const height = () => treeContainer.clientHeight || 700;

  const dx = 20;
  const dy = 220;

  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  const svg = d3.select("#tree")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .style("font", '13px Aptos, Segoe UI, system-ui, sans-serif')
    .style("user-select", "none");

  const defs = svg.append("defs");
  const g = svg.append("g");

  // Zoom/Pan
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.35, 2.8])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoomBehavior);

  // Initialize ids
  let i = 0;
  root.each(d => { d.id = ++i; });

  // Default: collapse to depth 2 (recommended)
  collapseToDepth(root, 2);

  // Current selection/search state
  let selectedId = null;
  let currentQuery = "";

  setDetails(null);

  // ---------- Render ----------
  function buildPhotoPatterns(nodes) {
    // Clear existing patterns
    defs.selectAll("*").remove();

    nodes.forEach(d => {
      if (d.data && d.data.photo) {
        const pid = `p-${d.id}`;
        defs.append("pattern")
          .attr("id", pid)
          .attr("patternUnits", "objectBoundingBox")
          .attr("width", 1)
          .attr("height", 1)
          .append("image")
          .attr("href", d.data.photo)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("width", 40)
          .attr("height", 40)
          .attr("x", 0)
          .attr("y", 0);
      }
    });
  }

  function update(source) {
    tree(root);

    const nodes = root.descendants();
    const links = root.links();

    buildPhotoPatterns(nodes);

    // Compute bounds for viewBox
    let left = root, right = root;
    root.eachBefore(n => {
      if (n.x < left.x) left = n;
      if (n.x > right.x) right = n;
    });
    const vbW = Math.max(width(), 1100);
    const vbH = (right.x - left.x) + 180;

    svg.attr("viewBox", [-80, left.x - 80, vbW, vbH]);

    // Links
    const link = g.selectAll("path.link")
      .data(links, d => d.target.id);

    link.enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#93c5fd")
      .attr("stroke-width", 2)
      .attr("d", d => {
        const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
        return diagonal({ source: o, target: o });
      })
      .merge(link)
      .transition().duration(250)
      .attr("d", diagonal);

    link.exit().remove();

    // Nodes
    const node = g.selectAll("g.node")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${source.y0 ?? 0},${source.x0 ?? 0})`);

    // Circle: expand/collapse on click
    nodeEnter.append("circle")
      .attr("r", 8)
      .attr("fill", d => {
        if (d.data && d.data.photo) return `url(#p-${d.id})`;
        return d._children ? getBranchColor(d) : "#60a5fa";
      })
      .attr("stroke", d => getBranchColor(d))
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        // toggle expand/collapse
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else if (d._children) {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      });

    // Name text: show details on click (node cards)
    nodeEnter.append("text")
      .attr("dy", "0.32em")
      .attr("x", d => (d._children ? -14 : 14))
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .attr("fill", "#0f172a")
      .style("cursor", "pointer")
      .text(d => d.data.name)
      .on("click", (event, d) => {
        event.stopPropagation();
        selectedId = d.id;
        setDetails(d);
        update(d);
      });

    // Tooltip
    nodeEnter.append("title").text(d => d.data.name);

    // Merge + position
    const nodeMerge = nodeEnter.merge(node);

    nodeMerge
      .classed("selected", d => d.id === selectedId)
      .classed("match", d => {
        if (!currentQuery) return false;
        return (d.data.name || "").toLowerCase().includes(currentQuery);
      });

    nodeMerge.transition().duration(250)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.exit().remove();

    // Save old positions for transitions
    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
  }

  update(root);

  // ---------- Search ----------
  function findMatches(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return root.descendants().filter(d => (d.data.name || "").toLowerCase().includes(q));
  }

  function centerOnNode(d) {
    const w = width();
    const h = height();
    const scale = 1.0; // keep consistent; can adjust if you prefer auto-zoom
    const x = d.x;
    const y = d.y;

    const transform = d3.zoomIdentity
      .translate(w / 2 - y * scale, h / 2 - x * scale)
      .scale(scale);

    svg.transition().duration(350).call(zoomBehavior.transform, transform);
  }

  function runSearch() {
    currentQuery = ($("searchInput").value || "").trim().toLowerCase();
    if (!currentQuery) {
      update(root);
      return;
    }

    const matches = findMatches(currentQuery);
    if (!matches.length) {
      setDetails(null);
      update(root);
      return;
    }

    // Expand ancestors of first match so it becomes visible
    const first = matches[0];
    expandToNode(first);

    // Select the first match and center on it
    selectedId = first.id;
    setDetails(first);

    update(first);
    centerOnNode(first);
  }

  // ---------- Toggle controls ----------
  $("searchBtn").addEventListener("click", (e) => { e.preventDefault(); runSearch(); });
  $("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); runSearch(); }
  });

  $("clearBtn").addEventListener("click", (e) => {
    e.preventDefault();
    $("searchInput").value = "";
    currentQuery = "";
    selectedId = null;
    setDetails(null);
    // collapse back to selected depth
    const depth = parseInt($("depthSelect").value, 10);
    collapseToDepth(root, depth);
    update(root);
  });

  $("collapseBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const depth = parseInt($("depthSelect").value, 10);
    collapseToDepth(root, depth);
    update(root);
  });

  $("expandBtn").addEventListener("click", (e) => {
    e.preventDefault();
    expandAll(root);
    update(root);
  });

  $("depthSelect").addEventListener("change", () => {
    const depth = parseInt($("depthSelect").value, 10);
    collapseToDepth(root, depth);
    update(root);
  });

  // Background click clears selection
  svg.on("click", () => {
    selectedId = null;
    setDetails(null);
    update(root);
  });

})();