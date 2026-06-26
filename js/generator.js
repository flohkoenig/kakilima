/* =========================================================================
   Kaki Lima — recipe markdown generator
   Turns the form into a ready-to-commit Markdown file (front matter + body).
   ========================================================================= */
(function () {
  const form = document.getElementById("genForm");
  const out = document.getElementById("genOut");
  const fileNameEl = document.getElementById("fileName");
  if (!form || !out) return;

  const $ = id => document.getElementById(id);

  /* slugify: lowercase, umlauts spelled out, only a–z 0–9 and dashes */
  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /* quote a YAML scalar only when needed (colon, #, leading special char …) */
  function yamlValue(v) {
    const s = String(v);
    if (s === "") return '""';
    if (/[:#\[\]{}",&*!|>%@`]/.test(s) || /^[\s'-]/.test(s) || /\s$/.test(s)) {
      return `"${s.replace(/"/g, '\\"')}"`;
    }
    return s;
  }

  function splitLines(v) {
    return String(v || "")
      .split("\n")
      .map(l => l.trim().replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "")) // tolerate pasted bullets / numbering
      .filter(Boolean);
  }

  function build() {
    const title = $("f-title").value.trim();
    const slug = slugify(title) || "rezept";
    fileNameEl.textContent = `${slug}.md`;

    /* ---- front matter ---- */
    const fm = [];
    const push = (k, v) => fm.push(`${k}: ${v}`);
    if (title) push("title", yamlValue(title));
    const desc = $("f-description").value.trim();
    if (desc) push("description", yamlValue(desc));
    const cat = $("f-category").value.trim();
    if (cat) push("category", yamlValue(cat));
    const cuisine = $("f-cuisine").value.trim();
    if (cuisine) push("cuisine", yamlValue(cuisine));
    const image = $("f-image").value.trim();
    if (image) push("image", yamlValue(image));
    const prep = $("f-prep").value.trim();
    if (prep !== "") push("prep_time", Number(prep));
    const cook = $("f-cook").value.trim();
    if (cook !== "") push("cook_time", Number(cook));
    const servings = $("f-servings").value.trim();
    if (servings !== "") push("servings", Number(servings));
    const diff = $("f-difficulty").value.trim();
    if (diff) push("difficulty", yamlValue(diff));
    const tags = $("f-tags").value.split(",").map(t => t.trim()).filter(Boolean);
    if (tags.length) push("tags", `[${tags.join(", ")}]`);
    const author = $("f-author").value.trim();
    if (author) push("author", yamlValue(author));
    const date = $("f-date").value.trim();
    if (date) push("date", date);
    if ($("f-featured").checked) push("featured", "true");

    /* ---- body ---- */
    const body = [];
    const intro = $("f-intro").value.trim();
    if (intro) body.push(intro);

    const ingredients = splitLines($("f-ingredients").value);
    if (ingredients.length) {
      body.push("## Zutaten\n\n" + ingredients.map(l => `- ${l}`).join("\n"));
    }

    const steps = splitLines($("f-steps").value);
    if (steps.length) {
      body.push("## Zubereitung\n\n" + steps.map((l, i) => `${i + 1}. ${l}`).join("\n"));
    }

    const tips = splitLines($("f-tips").value);
    if (tips.length) {
      body.push("## Tipps\n\n" + tips.map(l => `> ${l}`).join("\n>\n"));
    }

    const md = `---\n${fm.join("\n")}\n---\n\n${body.join("\n\n")}\n`;
    out.textContent = md;
    return { md, slug };
  }

  function toast(msg) {
    let t = document.getElementById("klToast");
    if (!t) { t = document.createElement("div"); t.id = "klToast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  form.addEventListener("input", build);

  $("btnCopy").addEventListener("click", async () => {
    const { md } = build();
    try { await navigator.clipboard.writeText(md); toast("Markdown kopiert"); }
    catch { out.focus(); toast("Kopieren nicht möglich – bitte manuell markieren"); }
  });

  $("btnDownload").addEventListener("click", () => {
    const { md, slug } = build();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${slug}.md`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* default date = today, then first build */
  const d = $("f-date");
  if (d && !d.value) d.value = new Date().toISOString().slice(0, 10);
  build();
})();
