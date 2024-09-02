const express = require('express')
const path = require('path')
const bycrpt = require('bcrypt')
const app = express()
app.use(express.json())
const jwt = require('jsonwebtoken')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbpath = path.join(__dirname, 'covid19IndiaPortal.db')

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

const authentication = (request, response, next) => {
  let jwtToken
  const authheader = request.headers['authorization']
  if (authheader !== undefined) {
    jwtToken = authheader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', (error, user) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const getUserQuery = `
    select * From user WHERE username='${username}';`
  const userReponse = await db.get(getUserQuery)
  if (userReponse === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordCorrect = await bycrpt.compare(
      password,
      userReponse.password,
    )
    if (isPasswordCorrect === true) {
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.get('/states/', authentication, async (request, response) => {
  const getStatesQuery = `
    select
        *
    From
        state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray)
})

app.get('/states/:stateId/', authentication, async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  select 
    *
  from
      state
  where
   state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  const {state_id, state_name, population} = state
  const dbResponse = {
    stateId: state_id,
    stateName: state_name,
    population: population,
  }
  response.send(dbResponse)
})

app.post('/districts/', authentication, async (request, response) => {
  const getDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getDetails
  const addPlayerQuery = `
  INSERT INTO 
      district (district_name,state_id,cases,cured,active,deaths)
  values(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  const dbResponse = await db.run(addPlayerQuery)
  response.send('District Successfully Added')
})

app.get(
  '/districts/:districtId/',
  authentication,
  async (request, response) => {
    const {districtId} = request.params
    const getPlayerQuery = `
  select 
    *
  from
      district 
  where
   district_id = ${districtId};`
    const district = await db.get(getPlayerQuery)
    const {district_name, state_id, cases, cured, active, deaths} = district
    const dbResponse = {
      districtName: district_name,
      stateId: state_id,
      cases: cases,
      cured: cured,
      active: active,
      deaths: deaths,
    }
    response.send(dbResponse)
  },
)

app.put(
  '/districts/:districtId/',
  authentication,
  async (request, response) => {
    const {districtId} = request.params
    const getbody = request.body
    const {districtName, stateId, cases, cured, active, deaths} = getbody
    const updateQuery = `
        UPDATE district
        SET 
          district_name="${districtName}",
          state_id=${stateId},
          cases=${cases},
          cured=${cured},
          active= ${active},
          deaths= ${deaths}
          WHERE district_id=${districtId};`
    await db.run(updateQuery)
    response.send('District Details Updated')
  },
)



