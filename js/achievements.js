(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const query = new URLSearchParams(location.search);
  const requested = query.get("u") || query.get("user");
  const list = $("#achievementList");
  const dialog = $("#achievementDialog");
  const notice = $("#achievementNotice");
  const safeImage = (path) => {
    if (!path || !/^(?:https:\/\/[^\s]+|images\/[A-Za-z0-9_./-]+)$/.test(path)) {
      return "images/logo.svg";
    }
    return path;
  };
  const date = (value) => new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" });
  function urlFor(id) {
    const url = new URL(location.href);
    if (id) url.searchParams.set("achievement", id);
    else url.searchParams.delete("achievement");
    return url;
  }
  async function init() {
    await AstraAuth.ready;
    const current = AstraAuth.user();
    const own = !requested || current && current.username.toLowerCase() === requested.toLowerCase();
    if (own && !current) return;
    let profile;
    try {
      profile = await AstraAPI.request(own ? "/api/v1/me" :
        "/api/v1/users/" + encodeURIComponent(requested));
    } catch (error) {
      $("#achievementContent").hidden = true;
      $("#achievementNotfound").hidden = false;
      $("#achievementSubtitle").textContent = error.status === 404
        ? "We could not find that competitor." : error.message;
      return;
    }
    const handle = profile.username;
    const earned = profile.achievements || [];
    const profileUrl = own ? "profile.html" : "public-profile.html?u=" + encodeURIComponent(handle);
    const parent = $("#achievementParent");
    parent.href = profileUrl;
    parent.textContent = own ? "Account" : handle;
    $("#achievementSubtitle").textContent = "Achievements for " + handle + ".";
    $("#achievementHandle").textContent = handle;
    $("#achievementProfile").href = profileUrl;
    $("#achievementCount").textContent = earned.length + " earned";
    $("#achievementEmpty").hidden = earned.length > 0;
    $("[data-sample-note]").hidden = true;
    if (!own) {
      $("#achievementOwnAvatar").hidden = true;
      const avatar = $("#achievementPublicAvatar");
      avatar.textContent = handle.slice(0, 2).toUpperCase();
      avatar.hidden = false;
      const back = $("#achievementBack");
      back.dataset.href = profileUrl;
      back.dataset.label = "to " + handle + "'s profile";
    } else if (profile.avatarUrl) {
      $("#achievementOwnAvatar").src = profile.avatarUrl;
    }
    document.title = handle + " · Achievements · Astra";
    function showFromURL() {
      const id = new URLSearchParams(location.search).get("achievement");
      const badge = earned.find((item) => item.code === id);
      notice.textContent = "";
      if (!badge) {
        if (id) {
          notice.textContent = "This achievement is not in this user's earned collection.";
          history.replaceState(null, "", urlFor(null));
        }
        AstraUI.closeDialog(dialog);
        return;
      }
      $("#achievementArt").src = safeImage(badge.imagePath);
      $("#achievementArt").alt = badge.name + " badge";
      $("#achievementTitle").textContent = badge.name;
      $("#achievementDescription").textContent = badge.description;
      $("#achievementRequirement").textContent = badge.requirement;
      $("#achievementEvidence").textContent = "Earned on Astra";
      $("#achievementDate").dateTime = badge.earnedAt;
      $("#achievementDate").textContent = date(badge.earnedAt);
      AstraUI.openDialog(dialog, list.querySelector('[data-achievement="' + badge.code + '"]'));
    }
    earned.forEach((badge) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "achievement-card";
      button.dataset.achievement = badge.code;
      button.setAttribute("aria-haspopup", "dialog");
      const image = document.createElement("img");
      image.src = safeImage(badge.imagePath);
      image.alt = "";
      image.width = 128;
      image.height = 128;
      const title = document.createElement("strong");
      title.textContent = badge.name;
      const label = document.createElement("span");
      label.textContent = "Earned " + date(badge.earnedAt);
      button.append(image, title, label);
      button.addEventListener("click", () => {
        history.pushState(null, "", urlFor(badge.code));
        showFromURL();
      });
      list.appendChild(button);
    });
    dialog.addEventListener("close", () => {
      if (new URLSearchParams(location.search).has("achievement")) {
        history.replaceState(null, "", urlFor(null));
      }
    });
    window.addEventListener("popstate", showFromURL);
    await AstraUI.ready;
    showFromURL();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
