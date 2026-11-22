(function () {
  "use strict";

  const query = new URLSearchParams(location.search);
  const current = AstraAuth.user();
  const handle = query.get("user") || (current && current.identifier);
  if (!handle) return;

  const earned = AstraData.achievements(handle);
  const list = document.getElementById("achievementList");
  const dialog = document.getElementById("achievementDialog");
  const notice = document.getElementById("achievementNotice");
  const own = Boolean(current && current.identifier === handle);
  document.getElementById("achievementHandle").textContent = handle;
  document.getElementById("achievementProfile").href = own ? "profile.html" : "public-profile.html?user=" + encodeURIComponent(handle);
  document.getElementById("achievementCount").textContent = earned.length + " earned";
  document.getElementById("achievementEmpty").hidden = earned.length > 0;
  document.querySelector("[data-sample-note]").hidden = handle !== AstraData.demoUser;

  function urlFor(id) {
    const url = new URL(location.href);
    url.searchParams.set("tab", "achievements");
    if (id) url.searchParams.set("achievement", id);
    else url.searchParams.delete("achievement");
    return url;
  }

  function showFromURL() {
    const id = new URLSearchParams(location.search).get("achievement");
    const badge = earned.find((item) => item.id === id);
    notice.textContent = "";
    if (!badge) {
      if (id) {
        notice.textContent = "This achievement is not in this user's earned collection.";
        history.replaceState(null, "", urlFor(null));
      }
      AstraUI.closeDialog(dialog);
      return;
    }
    const art = document.getElementById("achievementArt");
    art.src = badge.image;
    art.alt = badge.name + " badge";
    document.getElementById("achievementTitle").textContent = badge.name;
    document.getElementById("achievementDescription").textContent = badge.description;
    document.getElementById("achievementRequirement").textContent = badge.requirement;
    document.getElementById("achievementEvidence").textContent = badge.evidence;
    const date = document.getElementById("achievementDate");
    date.dateTime = badge.earnedAt;
    date.textContent = AstraData.dateTime(badge.earnedAt);
    const trigger = list.querySelector('[data-achievement="' + badge.id + '"]');
    AstraUI.openDialog(dialog, trigger);
  }

  earned.forEach((badge) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "achievement-card";
    button.dataset.achievement = badge.id;
    button.setAttribute("aria-haspopup", "dialog");
    const image = document.createElement("img");
    image.src = badge.image;
    image.alt = "";
    image.width = 128;
    image.height = 128;
    const title = document.createElement("strong");
    title.textContent = badge.name;
    const label = document.createElement("span");
    label.textContent = "Earned " + new Date(badge.earnedAt).toLocaleDateString("en-GB", { dateStyle: "medium" });
    button.append(image, title, label);
    button.addEventListener("click", () => {
      history.pushState(null, "", urlFor(badge.id));
      showFromURL();
    });
    list.appendChild(button);
  });

  dialog.addEventListener("close", () => {
    if (new URLSearchParams(location.search).has("achievement")) history.replaceState(null, "", urlFor(null));
  });
  window.addEventListener("popstate", showFromURL);
  history.replaceState(null, "", urlFor(query.get("achievement")));
  AstraUI.ready.then(showFromURL);
})();
