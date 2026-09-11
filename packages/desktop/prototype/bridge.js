/* Local, fictional desktop spike adapter. The reviewed HTML source remains unchanged. */
(() => {
  const U = window.ESGUI;
  if (!U || window.parent === window) return;
  const host = "oc://renderer";
  const original = U.handlers.context;
  U.handlers.context = (payload) => {
    original(payload);
    const dialog = document.querySelector("dialog[open]");
    if (!dialog?._contextPack) return;
    const button = document.createElement("button");
    button.className = "btn btn-primary";
    button.textContent = "在 OpenCode 中讨论 · 仅预填";
    button.onclick = () => {
      const pack = dialog._contextPack;
      const project = window.ESG.state().project;
      window.parent.postMessage({
        kind: "openesg.context", version: 1, requestId: crypto.randomUUID(),
        href: location.href,
        title: pack.input_snapshot.selected.map(item => item.title || item.name || item.filename || item.id).join(" / ").slice(0, 200),
        projectName: project.id === pack.project_id ? project.name : undefined, pack,
      }, host);
      U.closeDialog();
    };
    dialog.append(button);
  };
  const button = document.createElement("button");
  button.textContent = "讨论选中对象 ↗";
  button.className = "btn btn-primary";
  button.style.cssText = "position:fixed;right:28px;bottom:18px;z-index:80;box-shadow:0 4px 20px #102a3b30";
  button.onclick = () => U.handlers.context({});
  document.body.append(button);
  window.addEventListener("message", (event) => {
    if (event.origin !== host || event.source !== window.parent) return;
    if (event.data?.kind !== "openesg.return" || event.data.version !== 1) return;
    // Keep this document mounted. Do not rewrite the hash or re-render unsaved inputs.
    U.toast("已回到原工作现场；未应用模型结果。");
  });
})();
