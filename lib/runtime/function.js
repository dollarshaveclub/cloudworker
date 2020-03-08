// We bind `Function` in from the parent for `instanceof`
// purposes, but we don't want to disallow code generation
// from strings with new Function(<string>). So, we use this Proxy!

// Security note: there may well be ways to hack around this. Enforcing
// this rule is about consistency with CF workers, not allowing for
// fully untrusted code.

module.exports.FunctionProxy = new Proxy(Function, {
  construct: () => {
    throw new EvalError('Code generation from strings disallowed for this context')
  },
})
