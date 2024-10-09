export const TimePeriodEnum = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "thisweek",
  THIS_MONTH: "thismonth",
  LAST_WEEK: "lastweek",
  LAST_MONTH: "lastmonth",
};

export const QUERY_TEMPLATE = `
  query GetPosts($postedAfter: DateTime!, $postedBefore: DateTime, $featured: Boolean!, $first: Int!) {
    posts(order: VOTES, postedAfter: $postedAfter, postedBefore: $postedBefore, featured: $featured, first: $first) {
      nodes {
        id
        name
        tagline
        description
        votesCount
        createdAt
        featuredAt
        website
        url
        slug
        media {
          url
        }
        topics {
          nodes {
            id
            name
            description
            slug
            url
          }
        }
      }
    }
  }
`;
