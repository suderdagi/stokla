/**
 * The tests delete every organization before each test, so they must never point at a real database.
 * Only database names that contain the word "test" (stokla_test, ci-test, test ...) are accepted.
 */
export function assertTestDatabase(url: string): void {
  const name = decodeURIComponent(new URL(url).pathname.slice(1))
  if (!/(^|[_-])test($|[_-])/i.test(name)) {
    throw new Error(
      `Refusing to run the tests against "${name}": the database name must contain "test", because the tests delete all data.`
    )
  }
}
