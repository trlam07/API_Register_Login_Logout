const http = require('http')
const url = require('url')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const users = [
    {email: 'user1@gmail.com', password: 'user1'},
    {email: 'user2@gmail.com', password: 'user2'},
]

const hashPassword = async (password) => {
    const saltRound = 10;
    return await bcrypt.hash(password, saltRound)
}

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword)
}

const secretKey = 'my_secret_key_@'

const generateAccessToken = (email, password) => {
    return jwt.sign({
        email, password
    },
    secretKey,
    {expiresIn: '30m'})
}

const generateRefreshToken = (email, password) => {
    return jwt.sign({email, password}, secretKey, {expiresIn: '7d'})
}

const handleApiGetUser = (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(users))
}

// const register = (req, res) => {
//     let body = '';
//     req.on('data', (chunk) => {
//         body += chunk.toString()
//     })
//     req.on('end', () => {
//         const newUser = JSON.parse(body);
//         console.log('new user:', newUser)

//         users.push(newUser)

//         res.writeHead(201, {'Content-Type': 'application/json'})
//         res.end(JSON.stringify(newUser))
//     })
// }

const register = (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString()
    })
    req.on('end', async () => {
        const newUser = JSON.parse(body)
        newUser.password = await hashPassword(newUser.password)
        console.log('new user:', newUser)
        console.log('new user password;', newUser.password)
        users.push(newUser)
        const cloneNewUser = {...newUser}
        delete cloneNewUser.password
        res.writeHead(201, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(cloneNewUser))
    })
}

// const login = (req, res) => {
//     let body = '';
//     req.on('data', (chunk) => {
//         body += chunk.toString()
//     })
//     req.on('end', () => {
//         const user = JSON.parse(body);
//         const {email, password} = user;
//         const checkUser = users.find(user => user.email === email && user.password === password)
//         console.log('check user:', checkUser)

//         if (checkUser) {
//             res.writeHead(200, {'Content-Type': 'application/json'})
//             res.end(JSON.stringify(user))
//         } else {
//             res.writeHead(401, {'Content-Type': 'text/plain'})
//             res.end('Unauthorized')
//         }
//     })
// }

const login = (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk.toString()
    })
    req.on('end', async () => {
        const user = JSON.parse(body);
        const {email, password} = user;
        const checkEmailUser = users.find(user => user.email === email)
        if (checkEmailUser) {
            const checkPasswordUser = await comparePassword(password, checkEmailUser.password)
            if (checkPasswordUser) {
                const accessToken = generateAccessToken(email, password);
                console.log('accessToken:', accessToken)

                const refreshToken = generateRefreshToken(email, password);
                console.log('refreshToken:', refreshToken)

                const cloneUser = {...user}
                delete cloneUser.password;
                res.writeHead(200, {'Content-Type': 'application/json'})
                res.end(JSON.stringify({
                    ...cloneUser,
                    accessToken,
                    refreshToken
                }))
            } else {
                res.writeHead(401, {'Content-Type': 'text/plain'})
                res.end('Unauthorized')
            }
        } else {
            res.writeHead(401, {'Content-Type': 'text/plain'})
            res.end('Unauthorized')
        }
    })
}

const refreshToken = (req, res) => {}

const server = http.createServer((req, res) => {
    const parseUrl = url.parse(req.url, true)
    if (req.method === 'GET') {
        handleApiGetUser(req, res)
    } else if (req.method === 'POST' && parseUrl.pathname === '/api/auth/register') {
        register(req, res)
    } else if (req.method === 'POST' && parseUrl.pathname === '/api/auth/login') {
        login(req, res)
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'})
        res.end('Not Found')
    }
})

const PORT = 3000
server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})