// CloudFront Function (viewer-request, runtime cloudfront-js-2.0).
// O "default root object" só vale para a raiz; aqui resolvemos /en/ -> /en/index.html
// (e /en -> /en/index.html), inclusive sob prefixos como /staging/.
function handler(event) {
  var request = event.request
  var uri = request.uri

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html'
  } else if (uri.indexOf('.', uri.lastIndexOf('/')) === -1) {
    request.uri = uri + '/index.html'
  }

  return request
}
