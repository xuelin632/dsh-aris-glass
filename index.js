/**
 * dsh-aris-glass - host half.
 *
 * Nothing to do on the host: the browser half injects one stylesheet that gives
 * assistant messages a liquid-glass bubble. The host file exists because a
 * bundle row is mounted from the package entry.
 */
export const name = 'dsh-aris-glass'

/** No host services needed. */
export const inject = []

/** No-op: the browser half owns the whole feature. */
export function apply() {}
