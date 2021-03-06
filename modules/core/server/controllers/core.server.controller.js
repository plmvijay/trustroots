'use strict';

var path = require('path'),
    errorHandler = require('./errors.server.controller'),
    usersHandler = require(path.resolve('./modules/users/server/controllers/users.server.controller')),
    textProcessor = require(path.resolve('./modules/core/server/controllers/text-processor.server.controller')),
    config = require(path.resolve('./config/config')),
    log = require(path.resolve('./config/lib/logger'));

/**
 * Render the main application page
 */
exports.renderIndex = function(req, res) {

  var renderVars = {
    user: null
  };

  // Expose user
  if (req.user) {
    renderVars.user = usersHandler.sanitizeProfile(req.user, req.user);
  }

  // Expose tribe (when browsing `/tribes/tribe-name`)
  if (req.tribe) {
    renderVars.tribe = req.tribe;
  }

  // Show different `og:` tags for signup pages
  // https://expressjs.com/en/api.html#req.path
  if (req.path === '/signup') {
    renderVars.invite = true;
  }

  res.render('modules/core/server/views/index', renderVars);
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function(req, res) {
  res.status(404).format({
    'text/html': function() {
      res.render('modules/core/server/views/404');
    },
    'application/json': function() {
      res.json({ message: errorHandler.getErrorMessageByKey('not-found') });
    },
    'default': function() {
      res.send(errorHandler.getErrorMessageByKey('not-found'));
    }
  });
};

/**
 * Log received CSP violation report
 * See `config/lib/express.js` and `initHelmetHeaders()` for more
 */
exports.receiveCSPViolationReport = function(req, res) {
  if (process.env.NODE_ENV !== 'test') {
    log('warn', 'CSP violation report #ljeanw', {
      report: req.body ? textProcessor.html(req.body) : 'No report available.'
    });
  }
  res.status(204).json();
};

/**
 * Log received CT report
 * See `config/lib/express.js` and `initHelmetHeaders()` for more
 * @link https://helmetjs.github.io/docs/expect-ct/
 * @link https://scotthelme.co.uk/a-new-security-header-expect-ct/
 */
exports.receiveExpectCTViolationReport = function(req, res) {
  if (process.env.NODE_ENV !== 'test') {
    log('warn', 'Expect-CT violation report #3hg8ha', {
      report: req.body ? textProcessor.html(req.body) : 'No report available.'
    });
  }
  res.status(204).json();
};

/**
* Render javascript content containing service worker config.
*/
exports.renderServiceWorkerConfig = function(req, res) {
  res.set('Content-Type', 'text/javascript')
     .send('var FCM_SENDER_ID = ' + JSON.stringify(config.fcm.senderId) + ';\n');
};
