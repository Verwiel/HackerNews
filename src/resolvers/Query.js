async function feed (root, args, context, info) {
  const where = args.filter ? {
    OR: [
      { description_contains: args.filter },
      { url_contains: args.filter }
    ]
  } : {}

  // pagination, skip is start index, first is the limit
  // sorting is orderBy. it comes from the enum type in the schema
  const links = await context.prisma.links({
    where,
    skip: args.skip,
    first: args.first,
    orderBy: args.orderBy
  })
  // below is for counting total links
  const count = await context.prisma
    .linksConnection({
      where
    })
    .aggregate()
    .count()
  return {
    links,
    count
  }
}

module.exports = {
  feed
}
