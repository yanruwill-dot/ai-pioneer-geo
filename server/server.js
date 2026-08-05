import { createApp } from './app.js'

const port = Number(process.env.PORT || 3306)
const app = createApp()

app.listen(port, '127.0.0.1', () => {
  console.log(`AI Pioneer GEO API listening at http://127.0.0.1:${port}`)
})
