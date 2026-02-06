(async function () {
  const width = 1400;
  const dx = 18;
  const dy = 220;

  const data = await fetch("assets/data/family-tree.json").then(r => r.json());

  // D3 loaded globally via script tag
  const root = d3.hierarchy(data);
  root.x0 = 0;
  root.y0 = 0;

  // Collapse nodes by default (optional)
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth >= 2) d.children = null; // collapse deeper levels initially
  });

  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  const svg = d3.select("#tree")
    .append("svg")
    .attr("viewBox", [-80, -40, width, 900])
    .style("font", "13px Aptos, Segoe UI, system-ui, sans-serif")
    .style("user-select", "none");

  const g = svg.append("g");

  // Zoom / pan
  svg.call(
    d3.zoom()
      .scaleExtent([0.35, 2.5])
      .on("zoom", (event) => g.attr("transform", event.transform))
  );

  function update(source) {
    tree(root);

    const nodes = root.descendants();
    const links = root.links();

    // Compute height dynamically
    let left = root;
    let right = root;
    root.eachBefore(node => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });
    const height = right.x - left.x + 120;

    svg.transition().duration(250)
      .attr("viewBox", [-80, left.x - 60, width, height]);

    // Links
    const link = g.selectAll("path.link")
      .data(links, d => d.target.id);

    link.enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#93c5fd")
      .attr("stroke-width", 2)
      .attr("d", d => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      })
      .merge(link)
      .transition().duration(250)
      .attr("d", diagonal);

    link.exit().remove();

    // Nodes
    const node = g.selectAll("g.node")
      .data(nodes, d => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;
        update(d);
      });

    nodeEnter.append("circle")
      .attr("r", 7)
      .attr("fill", d => d._children ? "#1d4ed8" : "#60a5fa")
      .attr("stroke", "#0b2a6f")
      .attr("stroke-width", 1.5);

    nodeEnter.append("text")
      .attr("dy", "0.32em")
      .attr("x", d => d._children ? -12 : 12)
      .attr("text-anchor", d => d._children ? "end" : "start")
      .attr("fill", "#0f172a")
      .text(d => d.data.name);

    nodeEnter.append("title")
      .text(d => d.data.name);

    nodeEnter.merge(node)
      .transition().duration(250)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.exit()
      .transition().duration(250)
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .remove();

    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
  }

  update(root);
})();