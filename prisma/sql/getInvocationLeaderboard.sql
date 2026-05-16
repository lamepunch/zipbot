select
  b."displayName",
  count(*) as "count"
from
  "Invocation" a
  join "User" b on a."userId" = b."id"
group by
  b."displayName"
order by "count" desc
limit 5
