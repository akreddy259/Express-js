const express = require('express')
const path = require('path')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbpath = path.join(__dirname, 'cricketTeam.db')

let db = null

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB error is ${e.message}`)
    process.exit(1)
  }
  app.listen(3000, () => {
    console.log(`Server Running at http://localhost:3000`)
  })
}

InitializeDBAndServer()

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    select
        *
    From
        cricket_team;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(playersArray)
})
