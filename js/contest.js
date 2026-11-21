document.addEventListener("DOMContentLoaded", () => {
  const CONTEST_ID = "round-118";
  const REGISTERED_KEY = "astra-registered-contests";

  // main.js đặt data-auth="in" khi đã login (key astra-session)
  const isLoggedIn = () => document.documentElement.dataset.auth === "in";

  const getRegistered = () => {
    try { return JSON.parse(localStorage.getItem(REGISTERED_KEY)) || []; }
    catch (e) { return []; }
  };
  const saveRegistered = (list) => {
    try { localStorage.setItem(REGISTERED_KEY, JSON.stringify(list)); }
    catch (e) { /* storage blocked */ }
  };

  const btn = document.getElementById("registerBtn");
  const modal = document.getElementById("registerModal");
  const cancelBtn = document.getElementById("registerCancel");
  const confirmBtn = document.getElementById("registerConfirm");
  const toast = document.getElementById("registerToast");
  if (!btn || !modal) return;

  function markRegistered() {
    btn.textContent = "Registered ✓";
    btn.disabled = true;
  }

  if (isLoggedIn() && getRegistered().includes(CONTEST_ID)) markRegistered();

  const openModal = () => { modal.hidden = false; };
  const closeModal = () => { modal.hidden = true; };

  btn.addEventListener("click", () => {
    if (!isLoggedIn()) {
      // chưa login -> sang login, login xong quay lại trang này
      const here = location.pathname.split("/").pop() || "contest.html";
      location.href = "login.html?next=" + encodeURIComponent(here);
      return;
    }
    openModal();
  });

  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  confirmBtn.addEventListener("click", () => {
    const list = getRegistered();
    if (!list.includes(CONTEST_ID)) list.push(CONTEST_ID);
    saveRegistered(list);

    closeModal();
    markRegistered();
    toast.hidden = false;
    setTimeout(() => (toast.hidden = true), 2500);
  });
});