(() => {
  "use strict";

  const buildTimeline = (table) => {
    const section = table.closest(".band-section");
    const wrapper = table.parentElement;
    const body = table.tBodies[0];
    if (!section || !wrapper || !body || !wrapper.classList.contains("member-wrap")) return;

    const rows = Array.from(body.rows);
    if (!rows.length || rows.some((row) => row.cells.length < 5)) return;

    const bandName = section.id === "roselia" ? "Roselia" : "RAISE A SUILEN";
    const timeline = document.createElement("div");
    timeline.className = `concert-timeline concert-timeline--${section.id}`;
    timeline.setAttribute("aria-label", `${bandName} 演出時間線`);

    const heading = document.createElement("div");
    heading.className = "concert-timeline__heading";
    const headingText = document.createElement("span");
    headingText.textContent = `${bandName} / LIVE ROUTE`;
    const count = document.createElement("span");
    count.className = "concert-timeline__count";
    count.textContent = `${rows.length} 個演出站點`;
    heading.append(headingText, count);

    const list = document.createElement("ol");
    list.className = "concert-timeline__route";
    list.setAttribute("aria-label", `${bandName} 演出紀錄，共 ${rows.length} 站`);

    rows.forEach((row, index) => {
      const cells = row.cells;
      const stop = document.createElement("li");
      stop.className = "concert-timeline__stop";
      if (index === 0 || index === rows.length - 1) stop.classList.add("is-terminal");

      const node = document.createElement("span");
      node.className = "concert-timeline__node";
      node.setAttribute("aria-hidden", "true");

      const card = document.createElement("article");
      card.className = "concert-timeline__card";

      const date = document.createElement("div");
      date.className = "concert-timeline__date";
      date.setAttribute("aria-label", "日期");
      date.append(...Array.from(cells[0].childNodes, (child) => child.cloneNode(true)));

      const title = document.createElement("h4");
      title.className = "concert-timeline__title";
      title.append(...Array.from(cells[1].childNodes, (child) => child.cloneNode(true)));

      const type = document.createElement("p");
      type.className = "concert-timeline__type";
      const typeLabel = document.createElement("span");
      typeLabel.className = "concert-timeline__field-label";
      typeLabel.textContent = "分類";
      const typeValue = document.createElement("span");
      typeValue.append(...Array.from(cells[2].childNodes, (child) => child.cloneNode(true)));
      type.append(typeLabel, typeValue);

      const feature = document.createElement("p");
      feature.className = "concert-timeline__feature";
      feature.setAttribute("aria-label", "特色");
      feature.append(...Array.from(cells[3].childNodes, (child) => child.cloneNode(true)));

      const source = document.createElement("div");
      source.className = "concert-timeline__source";
      const sourceLabel = document.createElement("span");
      sourceLabel.className = "concert-timeline__field-label";
      sourceLabel.textContent = "來源";
      const sourceValue = document.createElement("span");
      sourceValue.append(...Array.from(cells[4].childNodes, (child) => child.cloneNode(true)));
      source.append(sourceLabel, sourceValue);

      card.append(date, title, type, feature, source);
      stop.append(node, card);
      list.append(stop);
    });

    timeline.append(heading, list);

    const details = document.createElement("details");
    details.className = "concert-table-details";
    const summary = document.createElement("summary");
    summary.textContent = "查看表格明細";
    wrapper.before(timeline, details);
    details.append(summary, wrapper);
  };

  const init = () => {
    document.querySelectorAll(".band-section .concert-table").forEach(buildTimeline);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
