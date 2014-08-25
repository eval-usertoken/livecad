var glnow = require('gl-now');
var glslify = require('glslify');
var skateboard = require('skateboard');

var createProgram = glslify({
  fragment: "./static/shaders/basic.frag",
  vertex: "./static/shaders/basic.vert"
});

var createClient = require('./core');

require('domready')(function() {

  var renderMesh = require('./3d');

  // setup editor
  var jse = require('javascript-editor')({
    container: document.querySelector('#editor'),
    value: "verts(cube(50).cut(cylinder(10, 50).translate(10, 0, 0)))"
  });

  // Hack around protocol-buffers and their magical
  // function generation.
  window.Buffer = Buffer;

  skateboard(function(stream) {

    stream.on('close', function() {
      console.log('reloading');
      window.location.reload();
    });

    createClient(stream, function(err, methods) {
      var header = Object.keys(methods).map(function(name) {
        return 'var ' + name + ' = ' + 'ops.' + name + ';';
      });


      // hijack extract_verts
      var _verts = methods.verts;
      methods.verts = function() {
        var p = _verts.apply(null, arguments)
        p(function(e, r) {
          renderMesh(e, r[0], r[1]);
        });
        return p;
      };

      function evaluate() {
        methods.reset(function() {
          var fn = new Function('ops', header.join('\n') + '\n' + jse.getValue());
          fn(methods);
        });
      }

      evaluate();

      jse.on('valid', function(valid) {
        if (valid) {
          evaluate();
        }
      });

      window.methods = methods;
    });
  });
});
