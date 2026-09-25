// The MongoDB driver's SRV handling makes Node emit a DEP0170 warning that contains the
// full connection string, password included. Mask credentials in any warning text.
// Required (for its side effect) by every entry point that connects to MongoDB.
const emitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) =>
  emitWarning.call(process, typeof warning === 'string' ? warning.replace(/\/\/[^@\s/]+@/g, '//***@') : warning, ...rest);
