import { INestApplication } from "@nestjs/common";
import { buildOpenApiDocument, createTestingApp } from "./testing-app";

describe("OpenAPI /docs parity", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("documents time-off, request alias, employee-balances, hcm-sync, and validation responses", () => {
    const doc = buildOpenApiDocument(app) as unknown as {
      paths: Record<string, Record<string, unknown>>;
    };

    expect(doc.paths["/time-off"]?.post).toBeDefined();
    expect(doc.paths["/time-off/request"]?.post).toBeDefined();
    expect(doc.paths["/time-off"]?.get).toBeDefined();
    expect(doc.paths["/employee-balances/{employeeId}/{locationId}"]?.get).toBeDefined();
    expect(doc.paths["/hcm-sync/batch"]?.post).toBeDefined();

    const postTimeOff = doc.paths["/time-off/request"]?.post as {
      requestBody?: unknown;
      responses?: Record<string, unknown>;
    };
    expect(postTimeOff?.requestBody).toBeDefined();
    expect(postTimeOff?.responses?.["400"]).toBeDefined();
    expect(postTimeOff?.responses?.["409"]).toBeDefined();
    expect(postTimeOff?.responses?.["422"]).toBeDefined();
  });
});
