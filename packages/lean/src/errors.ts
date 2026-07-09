/**
 * The errors this package throws.
 *
 * A caller who wants to tell a mistake in a spec from a mistake in their call to
 * us, or from a bug in us, needs the difference to survive a `catch`. A bare
 * `Error` with a prefixed message does not: matching on message text breaks the
 * moment the wording improves.
 */

/** Base class, so `catch (e) { if (e instanceof LeanError) ... }` works. */
export class LeanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Restores the prototype chain when compiled to ES5 targets, where extending
    // a builtin otherwise leaves `instanceof` false.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * The spec cannot be turned into a machine: a name that is not usable, a cell
 * nobody declared, a state nothing reaches, a table that contradicts what the
 * author said about it.
 */
export class SpecError extends LeanError {}

/**
 * The call itself is wrong, whatever the spec says: no specs to verify, two specs
 * that would land on one path.
 */
export class UsageError extends LeanError {}
