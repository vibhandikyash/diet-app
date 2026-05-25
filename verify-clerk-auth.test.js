/**
 * Verification tests for Clerk authentication with organization support.
 */

const fs = require("fs");

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function modelBlock(schema, modelName) {
  return schema.match(new RegExp(`model ${modelName}\\s*{[^}]+}`, "s"))?.[0] || "";
}

test("package.json includes Clerk Next.js SDK", () => {
  const pkg = JSON.parse(read("package.json"));
  assert(pkg.dependencies?.["@clerk/nextjs"], "@clerk/nextjs dependency missing");
});

test("root layout wraps the app with ClerkProvider", () => {
  const layout = read("src/app/layout.tsx");
  assert(layout.includes("ClerkProvider"), "Root layout does not use ClerkProvider");
  assert(layout.includes("@clerk/nextjs"), "Root layout does not import ClerkProvider from Clerk");
});

test("middleware protects every non-public route with Clerk", () => {
  const middleware = read("middleware.ts");
  assert(middleware.includes("clerkMiddleware"), "Middleware does not use clerkMiddleware");
  assert(middleware.includes("createRouteMatcher"), "Middleware does not use createRouteMatcher");
  assert(middleware.includes("/sign-in(.*)") && middleware.includes("/sign-up(.*)"), "Sign-in/sign-up are not public routes");
  assert(middleware.includes("auth.protect()"), "Middleware does not protect matched routes");
  assert(middleware.includes("!isPublicRoute"), "Middleware does not invert public routes to protect everything else");
});

test("sign-in page renders Clerk SignIn component", () => {
  assert(fs.existsSync("src/app/sign-in/[[...sign-in]]/page.tsx"), "Clerk sign-in route is missing");
  const page = read("src/app/sign-in/[[...sign-in]]/page.tsx");
  assert(page.includes("SignIn") && page.includes("@clerk/nextjs"), "Sign-in page does not render Clerk SignIn");
});

test("sign-up page renders Clerk SignUp component", () => {
  assert(fs.existsSync("src/app/sign-up/[[...sign-up]]/page.tsx"), "Clerk sign-up route is missing");
  const page = read("src/app/sign-up/[[...sign-up]]/page.tsx");
  assert(page.includes("SignUp") && page.includes("@clerk/nextjs"), "Sign-up page does not render Clerk SignUp");
});

test("User model stores Clerk IDs for synced users", () => {
  const user = modelBlock(read("prisma/schema.prisma"), "User");
  assert(/clerkId\s+String\?\s+@unique/.test(user), "User model clerkId should be optional and unique");
  assert(user.includes("@unique"), "User clerkId must be unique");
});

test("Team model stores Clerk organization IDs", () => {
  const team = modelBlock(read("prisma/schema.prisma"), "Team");
  assert(/clerkId\s+String\?\s+@unique/.test(team), "Team model clerkId should be optional and unique");
  assert(team.includes("@unique"), "Team clerkId must be unique");
});

test("Clerk webhook route verifies Clerk signatures", () => {
  assert(fs.existsSync("src/app/api/webhooks/clerk/route.ts"), "Clerk webhook route is missing");
  const route = read("src/app/api/webhooks/clerk/route.ts");
  assert(route.includes("verifyWebhook") && route.includes("@clerk/nextjs/webhooks"), "Webhook route does not verify Clerk webhooks");
});

test("Clerk user.created webhook upserts database users by clerkId", () => {
  assert(fs.existsSync("src/app/api/webhooks/clerk/route.ts"), "Clerk webhook route is missing");
  const route = read("src/app/api/webhooks/clerk/route.ts");
  assert(route.includes("user.created"), "Webhook route does not handle user.created");
  assert(route.includes("prisma.user.upsert"), "Webhook route does not upsert users");
  assert(route.includes("clerkId: evt.data.id"), "User sync does not store Clerk user ID");
});

test("Clerk organization.created webhook syncs organizations to teams", () => {
  assert(fs.existsSync("src/app/api/webhooks/clerk/route.ts"), "Clerk webhook route is missing");
  const route = read("src/app/api/webhooks/clerk/route.ts");
  assert(route.includes("organization.created"), "Webhook route does not handle organization.created");
  assert(route.includes("prisma.team.upsert"), "Webhook route does not upsert teams");
  assert(route.includes("clerkId: evt.data.id"), "Team sync does not store Clerk organization ID");
});

test("client navigation exposes current user and organization context through Clerk hooks", () => {
  const nav = read("src/components/Navigation.tsx");
  assert(nav.includes("useUser") && nav.includes("useOrganization"), "Navigation does not use Clerk user and organization hooks");
  assert(nav.includes("@clerk/nextjs"), "Navigation does not import Clerk hooks/components");
});

console.log("\n" + "=".repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log("=".repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
