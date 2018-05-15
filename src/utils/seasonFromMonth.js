const SUMMER = 'summer'
const AUTUMN = 'autumn'
const WINTER = 'winter'
const SPRING = 'spring'

const seasons = {
  1:SUMMER,
  2:SUMMER,

  3:AUTUMN,
  4:AUTUMN,
  5:AUTUMN,

  6:WINTER,
  7:WINTER,
  8:WINTER,

  9:SPRING,
  10:SPRING,
  11:SPRING,

  12:SUMMER
}

export const seasonFromMonth = (month) => seasons[parseInt(month,10)] || ''