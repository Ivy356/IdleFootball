'use strict';
(function() {
  Helpers.validateSaveVersion();

  var game = new Game.Game();
  game.load();

  var pitch = game.pitch;
  var players = game.players;
  var tactics = game.tastics;
  var prestige = game.prestige;
  var allObjects = game.allObjects;
  var lastSaved;

  var app = angular.module('footballClicker', []);

  app.filter('niceNumber', ['$filter', function($filter) {
      return Helpers.formatNumberPostfix;
  }]);

  app.filter('niceTime', ['$filter', function($filter) {
      return Helpers.formatTime;
  }]);

  app.filter('currency', ['$filter', function($filter) {
    return function(input) {
      return 'JTN ' + $filter('niceNumber')(input);
    };
  }]);

  app.filter('reverse', ['$filter', function($filter) {
    return function(items) {
      return items.slice().reverse();
    };
  }]);

  app.controller('DetectorController', function() {
    this.click = function() {
      pitch.clickDetector();
      detector.addEvent();
      UI.showUpdateValue("#update-data", lab.state.detector);
      return false;
    };
  });

  // Hack to prevent text highlighting
  document.getElementById('detector').addEventListener('mousedown', function(e) {
    e.preventDefault();
  });

  app.controller('PitchController', ['$interval', function($interval) {
    this.lab = lab;
    this.showDetectorInfo = function() {
      if (!this._detectorInfo) {
        this._detectorInfo = Helpers.loadFile('html/detector.html');
      }
      UI.showModal('Detector', this._detectorInfo);
    };
    $interval(function() {  // one tick
      var grant = pitch.getGrant();
      UI.showUpdateValue("#update-funding", grant);
      var sum = 0;
      for (var i = 0; i < players.length; i++) {
        sum += players[i].state.hired * players[i].state.rate;
      }
      if (sum > 0) {
        lab.acquireData(sum);
        UI.showUpdateValue("#update-data", sum);
        detector.addEventExternal(workers.map(function(w) {
          return w.state.hired;
        }).reduce(function(a, b){return a + b}, 0));
      }
    }, 1000);
  }]);
    this.showInfo = function(r) {
      UI.showModal(r.name, r.getInfo());
      UI.showLevels(r.state.level);
    };
  }]);

  app.controller('PlayersController', function() {
    this.players = players;
    this.isVisible = function(player) {
      return player.isVisible(pitch);
    };
    this.isAvailable = function(player) {
      return player.isAvailable(pitch);
    };
    this.hire = function(player) {
      var cost = player.hire(pitch);
      if (cost > 0) {
        UI.showUpdateValue("#update-funding", -cost);
      }
    };
  });

  app.controller('TacticsController', function() {
    this.tactics = tactics;
    this.isVisible = function(tactic) {
      return tactic.isVisible(pitch, allObjects);
    };
    this.isAvailable = function(tactic) {
      return tactic.isAvailable(pitch, allObjects);
    };
    this.tactic = function(tactic) {
      if (tactic.buy(pitch, allObjects)) {
        UI.showUpdateValue("#update-funding", tactic.cost);
      }
    }
  });

  app.controller('AchievementsController', function($scope) {
    $scope.achievements = achievements;
    $scope.progress = function() {
      return achievements.filter(function(a) { return a.validate(lab, allObjects, lastSaved); }).length;
    };
  });

  app.controller('SaveController',
      ['$scope', '$interval', function($scope, $interval) {
    lastSaved = new Date().getTime();
    $scope.lastSaved = lastSaved;
    $scope.saveNow = function() {
      var saveTime = new Date().getTime();
      game.lab.state.time += saveTime - lastSaved;
      game.save();
      lastSaved = saveTime;
      $scope.lastSaved = lastSaved;
    };
    $scope.restart = function() {
      if (window.confirm(
        'Do you really want to restart the game? All progress will be lost.'
      )) {
        ObjectStorage.clear();
        window.location.reload(true);
      }
    };
    $interval($scope.saveNow, 10000);
  }]);

  app.controller('StatsController', function($scope) {
    $scope.lab = lab;
  });

  analytics.init();
  analytics.sendScreen(analytics.screens.main);
})();
