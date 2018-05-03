function prependZero(value) {
  if (value < 10) {
    return '0' + value;
  } else {
    return value;
  }
}

function parseDate(dateStr) {
  let tmpDate = new Date(dateStr);
  return tmpDate.getFullYear() + '-' + prependZero(tmpDate.getMonth() + 1) + '-' + prependZero(tmpDate.getDate());
}

module.exports = { prependZero, parseDate };
