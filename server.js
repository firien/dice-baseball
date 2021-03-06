import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';

http.createServer((request, response) => {
  let uri = url.parse(request.url).pathname
  //serve docs, like github
  let filePath = path.join(process.cwd(), 'docs', uri.replace('/dice-baseball', ''))
  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html")
      let stat = fs.statSync(filePath)
      response.writeHead(200, {
        'Content-Type': "text/html",
        'Content-Length': stat.size
      })
      let readStream = fs.createReadStream(filePath);
      readStream.pipe(response);
    } else {
      let stat = fs.statSync(filePath)
      let mime;
      if ((/js$/).test(filePath)) {
        mime = "text/javascript"
      } else if  ((/html$/).test(filePath)) {
        mime = "text/html"
      } else if  ((/css$/).test(filePath)) {
        mime = "text/css"
      } else if  ((/svg$/).test(filePath)) {
        mime = "image/svg+xml"
      } else if  ((/ttf$/).test(filePath)) {
        mime = "application/x-font-ttf"
      } else if  ((/webmanifest$/).test(filePath)) {
        mime = "application/manifest+json"
      } else if  ((/json$/).test(filePath)) {
        mime = "application/json"
      } else if  ((/pdf$/).test(filePath)) {
        mime = "application/pdf"
      } else {
        mime = 'text/plain'
      }
      response.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size
      })
      let readStream = fs.createReadStream(filePath);
      readStream.pipe(response);
    }
  }
}).listen(3009)

