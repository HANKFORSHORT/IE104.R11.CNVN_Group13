// js/config.js
(function () {
  // Thêm ?local=1 vào URL nếu muốn gọi backend dưới máy.
  const useLocalBackend = new URLSearchParams(location.search).get("local") === "1";

  const CONFIG = {
    API_BASE_URL: useLocalBackend
      ? "http://localhost:3000"
      : "https://ie104-r11-cnvn-group13-be.onrender.com",

    TOKEN_KEY: "token",
    USER_KEY: "user",

    REQUEST_TIMEOUT: 60000,
  };

  window.CONFIG = Object.freeze(CONFIG);
  window.API_BASE_URL = CONFIG.API_BASE_URL;
})();
