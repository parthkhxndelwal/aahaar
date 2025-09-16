const { createServer: createHttpsServer } = require('https')
const { createServer: createHttpServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, turbo: true })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.crt')),
}

const port = process.env.PORT || 3000
const hostname = '0.0.0.0'

app.prepare().then(() => {
  const server = createHttpsServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  server.listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> Ready on https://${hostname}:${port}`)
    console.log(`> Local: https://localhost:${port}`)
    console.log(`> Network: https://192.168.1.2:${port}`)
  })
})
