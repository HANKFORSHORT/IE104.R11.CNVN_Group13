document.addEventListener("DOMContentLoaded", () => {
  const selectedContest = AstraProblemSets.getSet("contest", new URLSearchParams(location.search).get("contest"));
  if (!selectedContest) return;
  const CONTEST_ID = selectedContest.id;
  const REGISTERED_KEY = AstraAuth.userKey("astra-registered-contests");

  const isLoggedIn = () => AstraAuth.isLoggedIn();

  const getRegistered = () => {
    try {
      const list = JSON.parse(localStorage.getItem(REGISTERED_KEY));
      return Array.isArray(list) ? list : [];
    }
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

  const openModal = () => { AstraUI.openDialog(modal, btn); };
  const closeModal = () => { AstraUI.closeDialog(modal); };

  btn.addEventListener("click", () => {
    if (!AstraAuth.requireLogin()) return;
    openModal();
  });

  cancelBtn.addEventListener("click", closeModal);

  confirmBtn.addEventListener("click", () => {
    if (!AstraAuth.requireLogin()) return;
    const list = getRegistered();
    if (!list.includes(CONTEST_ID)) list.push(CONTEST_ID);
    saveRegistered(list);

    closeModal();
    markRegistered();
    toast.hidden = false;
    setTimeout(() => (toast.hidden = true), 2500);
  });
});
