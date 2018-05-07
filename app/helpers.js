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

function validateDate(dateStr) {
  let datePattern = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;
  if (dateStr.match(datePattern)) {
    return true;
  }
  return false;
}

function validateTime(timeStr) {
  let timePattern = /^(0?[1-9]|1[0-9]|2[0-3])[\:](0?[1-9]|[1-5][0-9])$/;
  if (timeStr.match(timePattern)) {
    return true;
  }
  return false;
}

module.exports = { prependZero, parseDate, validateDate, validateTime };
