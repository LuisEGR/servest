import {runIfMain, test} from "https://deno.land/std@v0.3.1/testing/mod.ts";
import {readRequest, readResponse} from "./serveio.ts";
import {assert, assertEquals} from "https://deno.land/std@v0.3.1/testing/asserts.ts";
import Reader = Deno.Reader;
import Buffer = Deno.Buffer;

async function readString(r: Reader) {
  const buf = new Buffer();
  await Deno.copy(buf, r);
  return buf.toString();
}

test(async function serveioReadRequestGet() {
  const f = await Deno.open("./fixtures/request_get.txt");
  const req = await readRequest(f);
  assertEquals(req.method, "GET");
  assertEquals(req.url, "/index.html?deno=land&msg=gogo");
  assertEquals(req.proto, "HTTP/1.1");
  assertEquals(req.headers.get("host"), "deno.land");
  assertEquals(req.headers.get("content-type"), "text/plain")
  assert(req.body === void 0);
  assert(req.trailers === void 0);
});

test(async function serveioReadRequestPost() {
  const f = await Deno.open("./fixtures/request_post.txt");
  const req = await readRequest(f);
  assertEquals(req.method, "POST");
  assertEquals(req.url, "/index.html");
  assertEquals(req.proto, "HTTP/1.1");
  assertEquals(req.headers.get("host"), "deno.land");
  assertEquals(req.headers.get("content-type"), "text/plain")
  assertEquals(req.headers.get("content-length"), "69")
  assertEquals(await readString(req.body), "A secure JavaScript/TypeScript runtime built with V8, Rust, and Tokio");
  assert(req.trailers === void 0);
});

test(async function serveioReadRequestPostChunked() {
  const f = await Deno.open("./fixtures/request_post_chunked.txt");
  const req = await readRequest(f);
  assertEquals(req.method, "POST");
  assertEquals(req.url, "/index.html");
  assertEquals(req.proto, "HTTP/1.1");
  assertEquals(req.headers.get("host"), "deno.land");
  assertEquals(req.headers.get("content-type"), "text/plain")
  assertEquals(req.headers.get("transfer-encoding"), "chunked")
  assertEquals(await readString(req.body), "A secure JavaScript/TypeScript runtime built with V8, Rust, and Tokio");
  assertEquals(req.trailers, void 0);
});

test(async function serveioReadRequestPostChunkedWithTrailers() {
  const f = await Deno.open("./fixtures/request_post_chunked_trailers.txt");
  const req = await readRequest(f);
  assertEquals(req.method, "POST");
  assertEquals(req.url, "/index.html");
  assertEquals(req.proto, "HTTP/1.1");
  assertEquals(req.headers.get("host"), "deno.land");
  assertEquals(req.headers.get("content-type"), "text/plain")
  assertEquals(req.headers.get("transfer-encoding"), "chunked")
  assertEquals(await readString(req.body), "A secure JavaScript/TypeScript runtime built with V8, Rust, and Tokio");
  assertEquals(req.trailers, void 0);
  assertEquals(typeof req.finalize, "function");
  await req.finalize();
  assertEquals(req.trailers.constructor, Headers);
  assertEquals(req.trailers.get("x-deno"), "land");
  assertEquals(req.trailers.get("x-node"), "js");
});

test(async function serveioReadResponse() {
  const f = await Deno.open("./fixtures/response.txt");
  const res = await readResponse(f);
  assertEquals(res.proto, "HTTP/1.1");
  assertEquals(res.status, 200)
  assertEquals(res.statusText, "OK");
  assertEquals(res.headers.get("content-type"), "text/plain")
  assertEquals(res.headers.get("content-length"), "69")
  assertEquals(await readString(res.body), "A secure JavaScript/TypeScript runtime built with V8, Rust, and Tokio");
  assertEquals(res.trailers, void 0);
  assertEquals(typeof res.finalize, "function")
});

test(async function serveioReadResponseChunked() {
  const f = await Deno.open("./fixtures/response_chunked.txt");
  const res = await readResponse(f);
  assertEquals(res.proto, "HTTP/1.1");
  assertEquals(res.status, 200)
  assertEquals(res.statusText, "OK");
  assertEquals(res.headers.get("content-type"), "text/plain")
  assertEquals(res.headers.get("transfer-encoding"), "chunked")
  assertEquals(await readString(res.body), "A secure JavaScript/TypeScript runtime built with V8, Rust, and Tokio");
  assertEquals(res.trailers, void 0);
  await res.finalize();
  assertEquals(res.trailers.get("x-deno"), "land");
  assertEquals(res.trailers.get("x-node"), "js");
  assert(typeof res.finalize === "function")
});

runIfMain(import.meta);