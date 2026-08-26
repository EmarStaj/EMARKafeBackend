import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";

describe("Testcontainers PostgreSQL Integration", () => {
  jest.setTimeout(60000); // Increase timeout for container startup

  let container: any;
  let client: Client;

  let isAvailable = false;

  beforeAll(async () => {
    try {
      container = await new PostgreSqlContainer().start();
      client = new Client({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
      });
      await client.connect();
      isAvailable = true;
    } catch (err) {
      console.warn("Container runtime not available, skipping testcontainers integration test.");
      isAvailable = false;
    }
  });

  afterAll(async () => {
    if (client) {
      await client.end().catch(() => {});
    }
    if (container) {
      await container.stop().catch(() => {});
    }
  });

  it("should execute a simple query", async () => {
    if (!isAvailable) {
      return; // gracefully skip if docker daemon is not present
    }
    const res = await client.query("SELECT 1 + 1 AS result");
    expect(res.rows[0].result).toBe(2);
  });
});
