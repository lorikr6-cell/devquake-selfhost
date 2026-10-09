// The browser library served at /api/v1/client (ADR 0023). Plain ES5-style JavaScript so it
// runs in every browser without a build step. __BASE__ is replaced with the app's address.
//
//   <script src="https://pulse.devquake.com/api/v1/client"></script>
//   var pulse = DevQuakePulse.connect({
//     key: 'pk_…',                       // or token: 'eyJ…' / function () { return fetch(…) }
//     channels: ['demo'],
//     onEvent: function (event) { … },  // { id, app, channel, event, data, source, sender, at }
//     onStatus: function (status) { … } // 'connecting' | 'live' | 'polling' | 'closed' | 'error:<code>'
//   });
//   pulse.send('demo', 'hello', { text: 'Hi' });   // → Promise of { id, at }
//   pulse.close();

const SOURCE = `(function () {
  'use strict';
  var BASE = '__BASE__';
  var FATAL = ['invalid_key', 'invalid_token', 'origin_not_allowed', 'subscription_required',
    'app_paused', 'channel_not_allowed', 'invalid_channels', 'unauthorized', 'secret_in_browser'];

  function connect(opts) {
    var channels = (opts.channels || []).join(',');
    var onEvent = opts.onEvent || function () {};
    var onStatus = opts.onStatus || function () {};
    var lastId = null;
    var es = null;
    var closed = false;
    var pollTimer = null;
    var helloTimer = null;
    var failures = 0;

    function token() {
      if (typeof opts.token === 'function') return Promise.resolve(opts.token());
      return Promise.resolve(opts.token || null);
    }

    function auth(t) {
      return t ? { token: t } : { key: opts.key };
    }

    function query(extra) {
      var parts = [];
      for (var k in extra) {
        if (extra[k] !== null && extra[k] !== undefined) {
          parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(extra[k]));
        }
      }
      return parts.join('&');
    }

    function deliver(text) {
      try {
        var e = JSON.parse(text);
        lastId = e.id;
        onEvent(e);
      } catch (err) {}
    }

    function openStream() {
      if (closed) return;
      onStatus('connecting');
      token().then(function (t) {
        if (closed) return;
        var params = auth(t);
        params.channels = channels;
        params.after = lastId;
        var hello = false;
        es = new EventSource(BASE + '/api/v1/stream?' + query(params));
        helloTimer = setTimeout(function () { if (!hello) startPolling(); }, 8000);
        es.addEventListener('hello', function () {
          hello = true;
          failures = 0;
          clearTimeout(helloTimer);
          onStatus('live');
        });
        es.onmessage = function (m) { deliver(m.data); };
        // The server closes the connection after a while: reconnect with a fresh token.
        es.addEventListener('bye', function () {
          es.close();
          setTimeout(openStream, 250);
        });
        es.onerror = function () {
          if (hello) return; // the browser reconnects by itself
          failures++;
          if (failures >= 2) startPolling();
        };
      });
    }

    function stopStream() {
      clearTimeout(helloTimer);
      if (es) es.close();
      es = null;
    }

    // Fallback without live connections; also tells why a connection is refused.
    function startPolling() {
      stopStream();
      if (closed || pollTimer) return;
      onStatus('polling');
      var polls = 0;
      function poll() {
        pollTimer = null;
        if (closed) return;
        token().then(function (t) {
          var params = auth(t);
          params.channels = channels;
          params.after = lastId;
          return fetch(BASE + '/api/v1/poll?' + query(params)).then(function (res) {
            return res.json().then(function (body) { return { res: res, body: body }; });
          });
        }).then(function (r) {
          var wait = 5000;
          if (r.res.ok) {
            r.body.events.forEach(function (e) { onEvent(e); });
            lastId = r.body.next;
            wait = r.body.retryAfterMs || wait;
            onStatus('polling');
          } else {
            var code = r.body && r.body.error ? r.body.error.code : 'error';
            onStatus('error:' + code);
            if (FATAL.indexOf(code) >= 0) return;
            wait = (Number(r.res.headers.get('Retry-After')) || 5) * 1000;
          }
          polls++;
          // Every few minutes, try the live connection again.
          if (polls % 40 === 0) { pollTimer = null; openStream(); return; }
          pollTimer = setTimeout(poll, wait);
        }).catch(function () {
          onStatus('error:network');
          pollTimer = setTimeout(poll, 10000);
        });
      }
      pollTimer = setTimeout(poll, 0);
    }

    function send(channel, event, data) {
      return token().then(function (t) {
        var headers = { 'Content-Type': 'application/json' };
        if (t) headers.Authorization = 'Bearer ' + t;
        else headers['X-Pulse-Key'] = opts.key;
        return fetch(BASE + '/api/v1/events', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ channel: channel, event: event, data: data || {} })
        });
      }).then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw body.error || { code: 'error' };
          return body;
        });
      });
    }

    function close() {
      closed = true;
      stopStream();
      if (pollTimer) clearTimeout(pollTimer);
      onStatus('closed');
    }

    if (typeof EventSource === 'undefined') startPolling();
    else openStream();
    return { send: send, close: close };
  }

  window.DevQuakePulse = { connect: connect };
})();
`;

/** The library with the app's own address filled in. */
export function clientScript(baseUrl: string): string {
  return SOURCE.replace('__BASE__', baseUrl.replace(/'/g, ''));
}
