import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";

describe("Testcontainers PostgreSQL Integration", () => {
  jest.setTimeout(60000); // Increase timeout for container startup

  let container: any;
  let client: Client;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    
    client = new Client({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    });

    await client.connect();
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
    if (container) {
      await container.stop();
    }
  });

  it("should execute a simple query", async () => {
    const res = await client.query("SELECT 1 + 1 AS result");
    expect(res.rows[0].result).toBe(2);
  });
});
