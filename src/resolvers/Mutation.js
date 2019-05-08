const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

async function signup (root, args, context, info) {
  // need to encrypt passwords
  const password = await bcrypt.hash(args.password, 10)

  // storing new user into db
  const user = await context.prisma.createUser({ ...args, password })

  // using jwt to create an app secret
  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  // returning token and user to adhere to AuthPayload schema
  return {
    token,
    user
  }
}
// ---------------------------------------------------
async function login (root, args, context, info) {
  // retrieves user by email, if none throw err
  const user = await context.prisma.user({ email: args.email })
  if (!user) {
    throw new Error('No user found')
  }

  // compare passwords stored to make sure its the same
  const valid = await bcrypt.compare(args.password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  return {
    token,
    user
  }
}
// ---------------------------------------------
function post (root, args, context, info) {
  const userId = getUserId(context)
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId } }
  })
}
// ---------------------------------------------
async function vote (parent, args, context, info) {
  const userId = getUserId(context)

  const linkExists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: args.linkId }
  })
  if (linkExists) {
    throw new Error(`Already voted for link: ${args.linkId}`)
  }

  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: args.linkId } }
  })
}

module.exports = {
  signup,
  login,
  post,
  vote
}
