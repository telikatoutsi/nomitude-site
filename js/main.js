// Nomitude · small enhancements. The page works without this file;
// it adds the reel filters/arrows, auto-hiding past trips and the copy button.
(function () {
  "use strict";

  // Nav: transparent over the hero photo, solid once the page scrolls
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-top", window.scrollY < 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Journeys: one setup per trip block, so new trips work by copying the block
  document.querySelectorAll(".trip-block").forEach(function (block) {
    var reel = block.querySelector(".reel");
    if (!reel) return;
    var items = Array.prototype.slice.call(reel.querySelectorAll(".reel__item"));
    var chips = Array.prototype.slice.call(block.querySelectorAll(".chip"));
    var prev = block.querySelector('.arrow[data-dir="-1"]');
    var next = block.querySelector('.arrow[data-dir="1"]');

    // Hide filter chips that have no photos in this trip
    chips.forEach(function (chip) {
      var f = chip.dataset.filter;
      if (f !== "all" && !items.some(function (it) { return it.dataset.group === f; })) chip.hidden = true;
    });

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        items.forEach(function (it) { it.hidden = f !== "all" && it.dataset.group !== f; });
        reel.scrollTo({ left: 0, behavior: "auto" });
        updateArrows();
      });
    });

    var bar = block.querySelector(".reel-progress__bar");
    var count = block.querySelector(".reel-progress__count");
    var pad = function (n) { return String(n).padStart(2, "0"); };

    // Arrows, progress bar and the "01 / 55" counter follow the scroll position
    function updateArrows() {
      var max = reel.scrollWidth - reel.clientWidth;
      if (prev && next) {
        prev.disabled = reel.scrollLeft <= 2;
        next.disabled = reel.scrollLeft >= max - 2;
      }
      var shown = items.filter(function (it) { return !it.hidden; });
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.max(0.04, Math.min(1, (reel.scrollLeft + reel.clientWidth) / reel.scrollWidth)) : 1) + ")";
      if (count && shown.length) {
        var left = reel.getBoundingClientRect().left + (parseFloat(getComputedStyle(reel).paddingLeft) || 0);
        var first = 0;
        for (var i = 0; i < shown.length; i++) {
          if (shown[i].getBoundingClientRect().right > left + 4) { first = i; break; }
        }
        if (max > 2 && reel.scrollLeft >= max - 2) first = shown.length - 1;
        count.textContent = pad(first + 1) + " / " + pad(shown.length);
      }
    }
    [prev, next].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        reel.scrollBy({ left: Number(btn.dataset.dir) * reel.clientWidth * 0.8, behavior: still ? "auto" : "smooth" });
      });
    });
    reel.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    updateArrows();

    // Video clips in the reel play only while visible (muted, looping)
    var videos = reel.querySelectorAll("video");
    if (videos.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
          else e.target.pause();
        });
      }, { threshold: 0.5 });
      videos.forEach(function (v) { v.muted = true; io.observe(v); });
    }
  });

  // Upcoming trips: hide a trip the day after its data-end date; hide the section if none are left
  var today = new Date();
  var todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  var upcoming = document.querySelectorAll(".upcoming__item[data-end]");
  var shown = 0;
  upcoming.forEach(function (li) {
    var past = li.dataset.end < todayStr;
    li.hidden = past;
    if (!past) shown++;
  });
  if (upcoming.length && !shown) {
    var sec = document.getElementById("trips");
    if (sec) sec.hidden = true;
    var link = document.querySelector('.nav__links a[href="#trips"]');
    if (link) link.parentElement.hidden = true;
  }

  // Contact: copy email
  document.querySelectorAll(".copy[data-copy]").forEach(function (btn) {
    var status = btn.parentElement.querySelector(".copy__status");
    btn.addEventListener("click", function () {
      var text = btn.dataset.copy;
      var done = function () {
        btn.textContent = "Copied";
        if (status) status.textContent = "Email copied";
        setTimeout(function () { btn.textContent = "Copy"; if (status) status.textContent = ""; }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else fallback();
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { if (document.execCommand("copy")) done(); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
      }
    });
  });
})();
