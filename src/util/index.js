function parseStringIfNumber(input) {
  if (typeof input === 'string' && !isNaN(input) && !isNaN(parseFloat(input))) {
	return parseFloat(input);
  }
  return input;
}

export {parseStringIfNumber};