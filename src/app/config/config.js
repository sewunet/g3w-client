var plugins = {
  iternet:  require('plugins/g3w-iternet/plugin')
};

var tools = {
  tools:  []
};

var mapcontrols = ['zoom','zoombox'];
//var mapcontrols = ['zoom','zoombox','zoomtoextent','query'];

var i18n = {
  resources: require('./locales/app.js')
};

var client =  {
  debug:  true,
  local:  false
};

var server =  {
    urls:  {
      ows:  '/ows',
      api:  '/api',
      config:  '/api/config',
      staticurl:  ''
    }
};

var templates =  {
  app:  require('../templates/app.html'),
  sidebar:  require('../templates/sidebar.html'),
  floatbar:  require('../templates/floatbar.html'),
};

module.exports = {
  client: client,
  server: server,
  templates: templates,
  plugins:  plugins,
  tools:  tools,
  map: {
    controls: mapcontrols
  },
  i18n: i18n
};