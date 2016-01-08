'use strict';

window.addEventListener('WebComponentsReady', function () {

  // We use Page.js for routing. This is a Micro
  // client-side router inspired by the Express router
  // More info: https://visionmedia.github.io/page.js/

  // Middleware
  function scrollToTop(ctx, next) {
    app.scrollPageToTop();
    next();
  }

  // Routes
  page('/', scrollToTop, function () {
    app.route = 'home';
  });

  page('/users', scrollToTop, function () {
    app.route = 'users';
  });

  page('/users/:name', scrollToTop, function (data) {
    app.route = 'user-info';
    app.params = data.params;
  });

  page('/contact', scrollToTop, function () {
    app.route = 'contact';
  });

  // add #! before urls
  page({
    hashbang: true
  });
});