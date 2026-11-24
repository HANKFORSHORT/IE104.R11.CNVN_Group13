(function () {
  "use strict";

  const query = new URLSearchParams(location.search);
  const current = AstraAuth.user();
  const hasRequestedUser = query.has("user");
  const requested = hasRequestedUser ? query.get("user") : current && current.identifier;
  const user = AstraData.user(requested);

  if (!user) {
    if (hasRequestedUser) {
      document.getElementById("achievementContent").hidden = true;
      document.getElementById("achievementNotfound").hidden = false;
      document.getElementById("achievementSubtitle").textContent = "We could not find that competitor.";
    }
    return;
  }

  const handle = user.handle;
  const own = Boolean(current && current.identifier.toLowerCase() === handle.toLowerCase());
  const earned = user.detailsAvailable ? AstraData.achievements(handle) : [];
  const list = document.getElementById("achievementList");
  const dialog = document.getElementById("achievementDialog");
  const notice = document.getElementById("achievementNotice");
  const profileUrl = own ? "profile.html" : "public-profile.html?user=" + encodeURIComponent(handle);
  const parent = document.getElementById("achievementParent");
  parent.href = profileUrl;
  parent.textContent = own ? "Account" : handle;
  document.getElementById("achievementSubtitle").textContent = own
    ? "Small milestones. A collection of your progress."
    : "Achievements for " + handle + ".";
  document.getElementById("achievementHandle").textContent = handle;
  document.getElementById("achievementProfile").href = profileUrl;
  document.getElementById("achievementCount").textContent = user.detailsAvailable
    ? earned.length + " earned" : "Details unavailable";
  document.getElementById("achievementEmpty").hidden = earned.length > 0;
  document.querySelector("[data-sample-note]").hidden = handle !== AstraData.demoUser;

  if (!own) {
    document.getElementById("achievementOwnAvatar").hidden = true;
    const avatar = document.getElementById("achievementPublicAvatar");
    avatar.textContent = handle.slice(0, 2).toUpperCase();
    avatar.hidden = false;
    const back = document.getElementById("achievementBack");
    back.dataset.href = profileUrl;
    back.dataset.label = "to " + handle + "'s profile";
  }

  if (!user.detailsAvailable) {
    document.getElementById("achievementEmptyTitle").textContent = "Achievement details unavailable";
    document.getElementById("achievementEmptyText").textContent =
      "This profile has no public badge history yet.";
    document.getElementById("achievementEmptyAction").hidden = true;
  }
  document.title = handle + " · Achievements · Astra";

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
        notice.textContent = user.detailsAvailable
          ? "This achievement is not in this user's earned collection."
          : "Achievement details are unavailable for this competitor.";
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
