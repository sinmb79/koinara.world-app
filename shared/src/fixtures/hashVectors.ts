import type { HashVectorFixture } from "../types.js";

export const hashVectors: HashVectorFixture[] = [
  {
    name: "hello-world-vector",
    manifestBody: {
      prompt: "Hello",
      contentType: "text/plain",
      schema: { type: "text" },
      metadata: { createdBy: "tester" }
    },
    requestHash: "0x7541010805dea1dedbb19631d8ba6d3e8b984a82ab458d1e529e072aa964396d",
    schemaHash: "0x6cf9631b5759f411843917fd3acb630147445c3b18c928528ec496f289192e77",
    receiptBody: {
      contentType: "application/json",
      output: { text: "World" },
      metadata: { backend: "ollama" }
    },
    responseHash: "0x122e977a0b31ccb682ca2e98a0a7167cf3c482d58d18b57cc15613cbea5462a1"
  }
];
