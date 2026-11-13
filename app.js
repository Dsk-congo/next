/* =========================================================
   NextGenIT – Application installable et notifications
   ========================================================= */
(function () {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  var invite = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); invite = e; maj(); });
  window.addEventListener("appinstalled", function () { invite = null; maj(); try { localStorage.setItem("app_installee_ng", "1"); } catch (x) {} });
  var installee = function () { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; };
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  function maj() { document.querySelectorAll("[data-installer]").forEach(function (b) { b.hidden = installee() || (!invite && !ios); }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-installer]"); if (!b) return;
    if (invite) { invite.prompt(); invite.userChoice.then(function () { invite = null; maj(); }); }
    else if (ios) alert("Sur iPhone : touchez le bouton Partager (carré avec une flèche) puis « Sur l’écran d’accueil ».");
  });
  document.addEventListener("DOMContentLoaded", maj); maj();
  /* Notifications (espace client ou étudiant ouvert, même en arrière-plan) */
  window.NGApp = {
    activerNotifications: function () { if (!("Notification" in window)) { alert("Votre navigateur ne gère pas les notifications."); return Promise.resolve(false); } return Notification.requestPermission().then(function (p) { return p === "granted"; }); },
    notifier: function (titre, texte, url) {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      var opts = { body: texte, icon: "assets/img/app-192.png", badge: "assets/img/app-192.png", data: { url: url || location.href } };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { r.showNotification(titre, opts); }).catch(function () { new Notification(titre, opts); });
      else new Notification(titre, opts);
    }
  };
})();
