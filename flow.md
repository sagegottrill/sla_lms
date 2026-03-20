# CONNECTA_DATA_FLOW_ARCHITECTUR

# E.md

## System Architecture and Refactoring Directives

The following document serves as the absolute, non-negotiable architectural blueprint for
refactoring the "Connecta" Enterprise Learning Management System (LMS) frontend. The
target system is a multi-portal application built on React 18, Tailwind CSS, and Supabase,
encompassing four distinct access tiers: Student, Instructor, Program Manager, and Super
Admin.
The executing Agentic AI (Cursor/Windsurf) must adhere strictly to these architectural
paradigms. Deviations from these patterns, particularly regarding state management, data
fetching, real-time synchronization, and client-side isolation, are expressly prohibited. The core
directive is the complete elimination of spaghetti state management, manual page reloads, and
mixed-concern component architectures.
When observing elite enterprise platforms such as Canvas LMS or Reforge, their architectures
rely heavily on deterministic data flow, robust caching mechanisms, and horizontal data
separation to manage immense scale.^1 Canvas, for instance, segregates customer data
through database sharding and utilizes sophisticated diffing synchronization modes to ensure
that user data is updated efficiently without overwriting concurrent changes.^2 To achieve a
similar level of enterprise resilience within the Connecta frontend, the Agentic AI must architect
a client-side environment that natively supports local-first synchronization, transactional
mutations, and robust multi-tenant data isolation. Global server state must strictly be managed
by TanStack Query (React Query) v5, acting as the definitive bridge between the local cache
and the Supabase PostgreSQL backend.^4 Global client state, which encompasses ephemeral UI
toggles or local session preferences, may utilize lightweight state managers like Zustand, but
the AI must never manage server data, such as fetched courses, user profiles, or dashboard
statistics, within client-state stores.^6 Furthermore, Supabase client calls must never occur
directly within React UI components; they must be entirely abstracted behind centralized,
modular React Query Custom Hooks.^7

## 1. The "Single Source of Truth" Data Layer (React

## Query)

The Connecta architecture demands a centralized, highly deterministic data fetching layer.
TanStack Query serves as the sole intermediary between the React component tree and the
Supabase PostgreSQL database. The AI must architect this layer to guarantee cache
consistency, prevent redundant network requests, and ensure that mutations in one sector of


the application deterministically invalidate and refresh dependent data across all dashboards
without manual intervention.

### 1.1 Strict Decoupling of API Calls and UI Components

The AI coder must meticulously extract all direct Supabase SDK calls out of the React UI
components. UI components are strictly responsible for consuming data and rendering the
interface. Data fetching logic must be encapsulated within modular Custom Hooks, such as
specific implementations for courses, enrollments, and dashboard statistics.^6
Every Custom Hook must utilize the TanStack Query queryOptions API pattern. As identified in
advanced React Query architectures, the queryOptions object abstraction provides a single
source of truth for query definitions, allowing these options to be shared seamlessly between
standard useQuery calls, imperative prefetching operations via queryClient.prefetchQuery, and
cache invalidation routines.^8 Passing a single object is universally superior to passing multiple
arguments because it creates a highly extensible abstraction layer for re-using query
configurations across deeply nested component trees.^4
The AI must enforce a strict hook structure. First, the AI must define a pure, asynchronous
fetching function interacting with Supabase, appending the .throwOnError() method to every
query chain. By enforcing .throwOnError() on all Supabase queries, the AI ensures that
Supabase's default object-returning error pattern is converted into thrown exceptions, which
TanStack Query requires to catch errors and expose them natively via the isError and error
properties.^6 Second, the AI must establish a queryOptions factory function returning the Query
Key, the Query Function, and specific cache configurations. Third, the exported React Hook
must simply wrap these standardized queryOptions. Any attempt by the AI to utilize useEffect
hooks to fetch data from Supabase and dump it into useState variables is strictly forbidden, as
this pattern tears down cache integrity and creates race conditions.^9

### 1.2 The Query Key Factory Strategy

React Query manages caching internally via a deterministic serialization of Query Keys.^11 To
achieve cross-dashboard synchronization, the AI must implement a strict, centralized "Query
Key Factory" strategy.^7 If an Instructor uploads a new course module, the Program Manager's
analytics and the Student's catalog must update instantaneously. This cross-pollination of data
is only possible if the caching layer's keys are perfectly structured to allow targeted, cascading
invalidations.
The AI must construct a centralized TypeScript object defining hierarchical arrays for every
entity in the system. Array Query Keys must transition strictly from the general to the specific,
allowing the query client to invalidate entire domains or hyper-specific data points.^11


**Key Segment Description Example Implementation
Entity** The root domain object
representing the PostgreSQL
table or logical group.
'courses', 'enrollments', 'users'
**Portal/Role** The dashboard context
isolating the cache to ensure
multi-tenant RBAC at the
query level.
'student', 'instructor', 'manager',
'admin'
**Scope** The specific view or
operation within the portal
context.
'list', 'detail', 'stats', 'analytics'
**Variables** An object containing all
dynamic filters, pagination
parameters, or specific
database IDs.
{ category: 'science', status:
'published', id: '123' }
When the AI implements a mutation, such as an Instructor publishing a course, the onSuccess
callback of the useMutation hook must trigger queryClient.invalidateQueries(), targeting the
specific root or sub-keys affected by the mutation.^6 Because the keys are strictly hierarchical,
instructing the query client to invalidate ['courses'] will cascade and instantly refresh the
Student's catalog located at ['courses', 'student', 'list'] and the Admin's analytics located at
['courses', 'admin', 'stats'], entirely eliminating the need for manual browser reloads.^12
Furthermore, the AI must rigidly separate the query keys used for standard pagination and
infinite scroll mechanisms. The AI must never share query keys between useQuery and
useInfiniteQuery hooks, as infinite queries possess a fundamentally different internal data
structure within the Query Cache, and sharing keys will inevitably result in cache corruption
and fatal rendering errors.^11

### 1.5 Cache Configuration and Stale Time Management


The AI must configure the global QueryClient outside of the React render tree, typically at the
application entry point. Instantiating the QueryClient inside the main application component or
on every render pass forces the cache of query keys to be torn down and rebuilt continuously,
leading to severe performance degradation and UI freezing.^15
The default configuration must abandon React Query's default staleTime of zero milliseconds.
Setting data to instantly stale forces the application to aggressively refetch data in the
background upon every window refocus or component remount, leading to immense and
unnecessary database load.^6 Instead, the AI is directed to implement a tiered staleTime
architecture based entirely on the volatility of the underlying data.
**Data Volatility Tier Recommended staleTime Application Context
Highly Volatile** 0 milliseconds Live analytics, active chat
channels, collaborative editing
environments. Relies primarily
on WebSockets for updates.
**Standard Dashboard** 60000 (1 minute) Course lists, enrollment tables,
user directories. Provides a
snappy user experience while
allowing background refetches
during standard navigation.
**Static Reference** Infinity System taxonomies, category
lists, platform configurations.
Data never automatically
refetches during the active
session.
By adhering to this tiered caching strategy, the AI ensures that the Connecta platform scales
gracefully, preserving database compute resources while delivering a seamless, instantaneous
user experience.^6 The AI must explicitly document these stale times within the queryOptions
factory to maintain a single source of truth for caching logic.

## 2. Real-Time Dashboard Synchronization (Supabase


## WebSockets)

While TanStack Query expertly handles caching and optimistic updates for the active user
performing a mutation, an enterprise LMS requires live synchronization for passive users
viewing entirely different dashboards. For example, if a Student completes a module
assignment, the Program Manager's tracking dashboard must reflect this progress instantly
without requiring the Program Manager to interact with the interface. This passive
synchronization is achieved through Supabase Realtime (WebSockets) acting as an
event-driven trigger mechanism for React Query invalidations.^6

### 2.1 Implementing Supabase Realtime Safely in React

The AI must construct a centralized real-time listener system to prevent individual child
components from spawning redundant WebSocket connections, which can rapidly exhaust
connection limits and degrade client performance. The architecture requires a custom hook,
structured as useGlobalDashboardSync, mounted strictly at the layout level of each respective
portal.
Supabase Realtime subscriptions must be configured utilizing the postgres_changes event
filter.^16 The AI must establish a supabase.channel() subscription that listens strictly to the
database tables relevant to the currently authenticated portal, applying rigorous filter strings to
ensure the client only receives payloads for relevant relational IDs.^16
Crucially, the React component lifecycle poses a persistent threat to WebSocket stability. If a
user navigates away to a different application or tabs out of the browser, the WebSocket
connection may silently disconnect. The AI must manage the channel lifecycle meticulously
within a React useEffect hook, ensuring that the cleanup function explicitly invokes
channel.unsubscribe() to prevent memory leaks and zombie listeners that continue to poll the
database after the component has unmounted.^9 Furthermore, the AI must implement native
DOM logic to handle document visibility changes. By attaching an event listener to the
visibilitychange API, the AI can detect when a user refocuses the application tab and
intelligently re-establish or validate the subscription status if the connection has dropped while
the tab was hidden.^16

### 2.2 The Event-Driven Invalidation Pipeline

The absolute fundamental rule for the AI regarding WebSockets is this: the AI must never use
WebSockets to deliver data payloads directly into the React UI state variables. Directly
concatenating real-time payloads into local state via setMessages(prev => [...prev,
newPayload]) creates devastating race conditions, entirely bypasses the TanStack caching
layer, and leads to irreconcilable data drift between the server and the client.^9
Instead, the AI must exclusively utilize the "Event-Driven Invalidation" pattern. Within the
Connecta architecture, Supabase Realtime serves strictly as a lightweight notification bus.


When a postgres_changes event representing an INSERT, UPDATE, or DELETE operation is
detected across the socket, the event callback must immediately invoke
queryClient.invalidateQueries(), passing the exact Query Key Factory reference that represents
the affected data.^6
The standard operational flow the AI must implement follows a strict causal chain. First, the
Program Manager navigates to the analytics portal, mounting the ['enrollments', 'manager',
'stats'] query, which populates the cache. Second, a Student interacting with their distinct
portal creates a new record in the enrollments table via a React Query mutation. Third, the
Supabase PostgreSQL database commits the transaction and subsequently fires a real-time
broadcast trigger. Fourth, the useGlobalDashboardSync hook active on the Program Manager's
browser receives an INSERT payload corresponding to the enrollments table. Fifth, the hook
executes queryClient.invalidateQueries({ queryKey: connectaQueryKeys.enrollments.all }).^6
Sixth, TanStack Query detects that the active Program Manager dashboard is currently
observing a subset of the invalidated key. Finally, React Query silently refetches the updated
data from the Supabase REST API in the background and seamlessly updates the UI without
rendering a loading spinner or forcing a page refresh.

### 2.3 Securing Realtime Subscriptions via Row Level Security (RLS)

The AI must under no circumstances allow the client application to blindly subscribe to public
real-time channels. Real-time broadcasts must be cryptographically secured to prevent a
malicious Student from sniffing WebSocket traffic intended solely for the Super Admin
dashboard. Supabase Realtime mandates the use of explicit Row Level Security (RLS) policies to
authorize channel broadcasts.^18
The AI must configure the Supabase client to utilize Private Channels by passing the private:
true configuration flag when establishing the channel topic.^17 When the frontend issues the
subscription request, Supabase Realtime intercepts the connection and evaluates the
authenticated user's JWT against the database's explicit RLS policies, specifically verifying
access against the realtime.messages system table.^18 If a user does not possess valid SELECT
permissions for the underlying rows in the targeted table, the real-time payload will be blocked
entirely at the database level. This ensures absolute data security regardless of how the
client-side React logic is manipulated, as unauthorized users will receive an explicit error
message informing them that they lack permission to access the topic.^19

### 2.4 Debouncing and Performance Tuning for High-Frequency Events

To prevent aggressive network saturation during bulk operational workflows, the AI must
carefully throttle real-time invalidations. In a scenario where an Instructor utilizes a
batch-upload tool to create fifty new grading rubrics simultaneously, the Supabase database
will broadcast fifty rapid-fire INSERT events across the WebSocket connection. If the AI blindly
wires these events directly to the query client, the application will trigger fifty simultaneous
REST API refetches, overwhelming the client's browser and risking rate-limiting from the


Supabase API.
The AI must wrap the queryClient.invalidateQueries() calls within a robust debouncer utility or
rely explicitly on React Query's innate batching mechanisms. By implementing a debounce
threshold of approximately 300 milliseconds on the WebSocket listener callback, the AI ensures
that a barrage of fifty INSERT events only triggers a single, unified background refetch per
affected Query Key, safeguarding the Supabase database from being overwhelmed by
self-inflicted application programming interface storms.

## 3. Enterprise File & Media Upload Flow

The Connecta LMS manages incredibly heavy asset workflows, including Instructor video
module uploads, Student assignment submissions, and Program Manager resource
distributions. Standard monolithic application programming interface uploads are entirely
insufficient for this scale, as they are highly prone to timeout errors, UI freezing, and deeply
frustrating user experiences, especially over unstable network connections. The AI must
architect a mandatory, highly resilient atomic 3-step upload flow utilizing Supabase Storage,
the TUS Resumable Upload protocol, and TanStack Query Optimistic Updates.

### 3.1 Step 1: Client-Side Validation and Compression

Before a single byte of data is allowed to touch the network layer, the AI must implement strict,
synchronous client-side interception. Utilizing a centralized custom React hook, structurally
named useAssetUpload, the application must validate MIME types and file sizes instantly
against acceptable portal parameters to prevent malicious or malformed files from entering
the upload pipeline.
For image uploads, such as user avatars or course catalog thumbnails, the AI must absolutely
mandate the use of browser-image-compression or an equivalent Web Worker-based
compression utility.^21 Permitting the upload of raw, unoptimized 5MB image files from
high-resolution mobile cameras is strictly prohibited, as it incurs massive bandwidth costs and
degrades CDN delivery speeds.^23 The AI must configure the compression utility to enforce
strict parameters, executing the compression logic inside an asynchronous block before the
upload sequence begins.
**Compression Parameter Implementation Directive Purpose**
maxSizeMB Set dynamically based on
asset type (e.g., 1 for
avatars, 3 for course
banners).
Caps the absolute file size
before network
transmission begins.


```
maxWidthOrHeight Set to 1920 for standard
web delivery.
Downscales massive
resolutions while
maintaining aspect ratio.
useWebWorker Must be set to true. Offloads the heavy
compression algorithm to a
background thread,
preventing the React main
thread from freezing.^22
```
### 3.2 Step 2: Supabase Storage and Resumable Uploads

Supabase Storage offers two distinct upload methodologies: Standard Uploads designed for
small files under 6MB, and Resumable Uploads designed for massive payloads.^24 The AI must
implement a routing threshold logic directly within the upload mutation hook. If an uploaded
file exceeds the 6MB threshold, which is standard for high-definition video modules or heavy
PDF document distributions, the AI must automatically route the file through the TUS protocol
via the tus-js-client library.^25
The Resumable Upload architecture must be engineered with the highest degree of fault
tolerance. First, the AI must direct the upload to the Supabase TUS endpoint using the direct
storage hostname format to bypass proxy bottlenecks and optimize latency.^26 Second, the
client must explicitly authenticate the TUS upload by injecting the user's Supabase Auth JWT
into the Authorization header of the TUS client configuration.^26 Third, the TUS client will chunk
the file into optimal segments and emit continuous onProgress events.^25 The AI must capture
these bytesUploaded and bytesTotal metrics and bind them directly to a React state variable
dedicated solely to driving a sleek UI Progress Bar.^26
If the user's network drops or they accidentally close their laptop lid, the TUS protocol
inherently preserves the chunked state on the server. The AI must implement the
upload.findPreviousUploads() method when a user selects a file. If a previous upload fingerprint
matches, the AI must invoke upload.resumeFromPreviousUpload() to automatically resume the
upload exactly from the point of failure, saving bandwidth and preventing user frustration.^26
The AI must also anticipate 409 Conflict concurrency errors by providing the x-upsert: true
header to ensure that if the same file is uploaded twice, the latest upload explicitly overwrites
the older partial chunk, preventing database corruption.^26

### 3.3 Step 3: Atomic Database Mutation and Optimistic UI

Uploading a file to a Supabase Storage Bucket represents only half of the required operational
flow; a storage object is functionally useless to the LMS unless it is relationally referenced in the
PostgreSQL database. The AI must guarantee atomic completion. Immediately upon the
successful resolution of the Supabase Storage upload promise, the onSuccess callback of the


TUS client must trigger a subsequent React Query mutation to INSERT or UPDATE the
corresponding database record, such as patching the profiles table with the new avatar_url or
inserting a new materials row for an academic course.^27
To mask the inherent latency of this complex multi-step process, the AI must program
sophisticated Optimistic UI patterns using TanStack Query's onMutate lifecycle hook.^29
Optimistic updates allow the application to predict the success of the upload and render the
result immediately, providing a vastly superior user experience compared to a frozen screen.^29
When an Instructor submits a new file, the AI must orchestrate the following exact sequence:

1. The onMutate function fires the millisecond the user clicks submit. The AI must execute
    queryClient.cancelQueries() targeting the specific query key. This is critical to stop any
    inflight background fetches that might resolve and accidentally overwrite the optimistic
    state with older server data.^30
2. The AI snapshots the previous, verified cache state using queryClient.getQueryData(),
    storing it in a variable to serve as a rollback mechanism.^30
3. The AI synchronously injects a "fake" optimistic record into the local cache via
    queryClient.setQueryData(). For images, the AI must utilize a temporary local object URL
    generated via URL.createObjectURL(file) so the UI instantly renders the uploaded asset
    locally, paired with an overlay progress bar driven by the TUS client.^21
4. If the subsequent Storage upload or the final database mutation fails due to network loss
    or validation errors, the onError callback must automatically execute
    queryClient.setQueryData() utilizing the snapshotted previous state. This silently rolls back
    the UI to its original configuration without requiring any user intervention or manual state
    resetting.^29
5. Regardless of whether the upload succeeds or fails, the onSettled callback must invoke
    queryClient.invalidateQueries() to force a final synchronization, ensuring the local cache
    perfectly mirrors the final true state from the PostgreSQL server.^14

## 4. Cross-Dashboard State Isolation (RBAC at the

## Query Level)

Connecta's complex multi-portal nature necessitates airtight Role-Based Access Control
(RBAC). A Super Admin possesses elevated rights to query sensitive system financials and
platform-wide analytics, while a Student must be strictly confined to viewing their localized
course enrollments and personal grades. The AI must implement a defense-in-depth strategy,
layering strict frontend query isolation directly atop Supabase's backend Row Level Security to
guarantee that data meant for one portal can never leak into another.^31

### 4.1 Enforcing Tenant and Role Boundaries in React Query

A critical security vulnerability prevalent in Single Page Applications (SPAs) involves cache


bleeding across browser tabs or subsequent authentication sessions.^33 If a Super Admin logs
out of the Connecta application, and a Student subsequently logs in on the exact same
browser session without initiating a hard page refresh, the React Query cache might
temporarily leak highly classified Admin analytics into the Student view if the query keys are not
cryptographically separated.
To eradicate this vulnerability, the AI must strictly isolate Cross-Dashboard State by injecting
the authenticated user's Role and unique ID directly into the root hierarchy of every Custom
Hook's Query Key.^34
The AI must construct a centralized authentication context hook, utilizing the
@supabase/supabase-js SDK to read the session state, outputting the current user's role and
userId deterministically.^36 Every TanStack Query fetching hook in the entire application must
accept and require these parameters. By formatting the query key strictly as ``, the AI
guarantees that a query executed by a 'student' maps to a completely isolated memory space
from a query executed by an 'admin'. This mathematical separation completely prevents
cross-role cache leakage, even if both users request data from the exact same PostgreSQL
table.^33
Furthermore, the AI must write explicit cache destruction logic within the Auth state transition
observer. Utilizing supabase.auth.onAuthStateChange, upon detecting a SIGNED_OUT or
USER_UPDATED event, the AI must forcefully execute queryClient.clear() or
queryClient.removeQueries(). This brute-force directive ensures the total destruction of all
cached data belonging to the previous session from browser memory before the new portal is
permitted to mount. If the application utilizes persistence mechanisms like persistQueryClient
with localStorage, the AI must disable global persistence or scope the IndexedDB keys
specifically to the user ID to prevent bleeding across distinct browser tabs.^33

### 4.2 Application-Level Authorization vs. Database-Level RLS

The AI must deeply understand the architectural delineation of security responsibilities. The
frontend React application, including the TanStack Query caching layer and React Router
navigation guards, is intrinsically insecure.^34 Client-side routing guards and query key isolation
serve strictly to optimize User Experience, manage local browser memory efficiently, and
prevent accidental UI exposure. They do not constitute true system security, as client-side
JavaScript can be manipulated by a determined end-user.^34
True security must be relegated entirely to Supabase Row Level Security (RLS).^20 The AI is
instructed to review and assert that the Postgres database utilizes the auth.uid() function and
custom RBAC logic natively written in SQL.^20 Supabase RLS policies utilizing the USING clause
govern SELECT and DELETE operations, while the WITH CHECK clause governs INSERT and
UPDATE operations.^20 If these policies are configured correctly, the database will silently drop


unauthorized rows before they ever reach the network layer.
However, at the frontend integration level, the AI must structure API requests so that they
never lazily attempt to over-fetch data.^34 If a Student Dashboard mounts, the fetching hook
must append an explicit filter, such as .eq('student_id', user.id), directly to the Supabase client
call.^32 Even though the backend RLS would successfully intercept an unauthorized, blanket
.select('*') query, explicitly filtering at the client level prevents the database from wasting
compute cycles performing unnecessary policy evaluations on millions of restricted rows. This
optimizes database query performance and prevents HTTP 403 error pollution in the browser
console.

### 4.3 Handling the Multi-Tenant Folder Architecture

To further cement Cross-Dashboard state isolation, the AI must enforce a strict, scalable folder
structure within the React codebase. Code organization fundamentally reflects architectural
boundaries, and poor organization inevitably leads to tangled dependencies.^37 The AI must
avoid creating monolithic components or pages folders that carelessly mix Student, Instructor,
and Admin views into a single directory.
The AI is directed to restructure the Connecta repository using a feature-and-portal-based
routing architecture.
**Directory Path Architectural Purpose**
src/portals/student/ Contains all layouts, views, and specific
data-fetching hooks exclusive to the Student
experience.
src/portals/instructor/ Houses grading interfaces, course creation
wizards, and instructor-specific analytics
hooks.
src/portals/manager/ Dedicated to program-wide tracking,
enrollment management, and cohort
aggregation views.


src/portals/admin/ Strictly isolated directory for super-admin
configuration, system financials, and
tenant-wide settings.
src/shared/ Reserved exclusively for universal UI
components (buttons, modals) and universally
applicable hooks (e.g., useUserProfile).
By enforcing this structure, each portal directory will contain its own distinct layout, dashboard
components, and highly specific data-fetching hooks.^38 The AI must rigidly enforce that
Admin-specific hooks, such as useSystemFinancials, are physically isolated within the
src/portals/admin/api/ directory. This physical segregation prevents junior developers—or
automated code generation tools—from accidentally importing a highly privileged Admin
mutation hook into the publicly accessible Student dashboard.

### 4.4 Granular Component-Level RBAC

Within shared components that reside in the src/shared/ directory, such as a generic
CourseCard used across multiple dashboards, the AI must implement a declarative RBAC
permission mechanism to show or hide specific interaction elements, like displaying an "Edit
Course" button for an Instructor versus an "Enroll" button for a Student.^40
The AI should construct a secure utility component, implemented as <RequireRole
allowedRoles={['instructor', 'admin']}>.^40 This utility component must interface seamlessly with
the global useAuth hook to evaluate the active user's current session claims. Rather than
polluting the core component render logic with sprawling, unreadable ternary operators
constantly checking user roles, the AI must wrap sensitive UI elements in this declarative guard.
If the active user lacks the required permission defined in the array, the component simply
returns null, ensuring the UI cleanly adapts to the current tenant's authorized scope without
violating the single-responsibility principle of the React rendering cycle.^39

## Strict Execution Plan for the AI Coder

The executing Agentic AI is mandated to process the refactoring of the Connecta LMS in the
following chronological sequence to guarantee architectural stability during the transition.

1. **Dependency Alignment and Package Auditing:** The AI must begin by auditing the
    package.json file. Ensure that @tanstack/react-query is strictly locked at version 5. Ensure
    @supabase/supabase-js is updated to the latest stable release. The AI must install
    @tanstack/react-query-devtools to facilitate visual cache debugging during development.


```
Crucially, the AI must install tus-js-client and browser-image-compression to enable the
advanced media flow detailed in Pillar 3.
```
2. **Global Provider Setup and Configuration:** Instantiate the global QueryClient explicitly
    outside the React render tree to guarantee cache stability.^15 Apply the tiered staleTime
    defaults as specified in Table 2. Wrap the entire application root strictly within the
    QueryClientProvider.^15
3. **Query Key Factory Generation:** Create a dedicated file at src/shared/api/queryKeys.ts.
    Define the strict hierarchical array taxonomy dictating the cache keys for every single
    entity across all four portals, utilizing the exact schema outlined in Table 1.^11
4. **Data Layer Abstraction (Pillar 1 Implementation):** Systematically parse all existing React
    components. Aggressively delete all direct Supabase calls housed inside useEffect blocks.
    Replace every instance with modular useQuery and useMutation hooks utilizing the
    unified queryOptions application programming interface.^8
5. **Realtime WebSockets Configuration (Pillar 2 Implementation):** Construct the
    useGlobalDashboardSync hook at the layout level. Map all postgres_changes payloads
    strictly to execute queryClient.invalidateQueries(). Ensure all Supabase channels are
    configured as private and that unsubscribe logic is perfectly bound to the component
    unmount cycle to prevent memory leaks.^9
6. **Upload Flow Overhaul (Pillar 3 Implementation):** Refactor all existing standard <input
    type="file"> logic. Implement the size-threshold router. Apply Web Worker compression
    for all image MIME types.^22 Implement the TUS protocol via tus-js-client for all heavy video
    and document files, complete with onProgress React state binding and flawless optimistic
    UI rollbacks utilizing onMutate and onError callbacks.^25
7. **RBAC Cache Security Enforcement (Pillar 4 Implementation):** Conduct a final security
    audit of all custom hooks. Inject the current user's role and tenantId into the base of every
    single Query Key to mathematically prevent data leakage.^35 Implement aggressive cache
    destruction on any authentication state change. Finally, physically segregate all
    dashboard-specific code into the defined src/portals/ folder architecture to cement the
    boundaries of the multi-tenant system.^38
By strictly adhering to this comprehensive, immutable blueprint, the Agentic AI will successfully
deliver an enterprise-grade, highly resilient, and mathematically predictable frontend
architecture for the Connecta LMS. All deviations from these instructions, regardless of intent,
will be classified as structural failures. The AI must proceed with the refactoring execution
immediately based entirely on these strict rulesets.

#### Works cited

#### 1. Canvas LMS: Integration, Development, and Data Access - UW-IT, accessed on

#### March 19, 2026,

#### https://uwconnect.uw.edu/it?id=kb_article_view&sysparm_article=KB

#### 2. Canvas Architecture - Instructure, accessed on March 19, 2026,

#### https://www.instructure.com/sites/default/files/file/2021-05/canvas-architecture-f


#### eb-2021.pdf

#### 3. Canvas Integration — Data Synchronization - Veracross University, accessed on

#### March 19, 2026,

#### https://community.veracross.com/s/article/Canvas-Integration-Data-Synchronizati

#### on

#### 4. React Query API Design - Lessons Learned - TkDodo's blog, accessed on March

#### 19, 2026, https://tkdodo.eu/blog/react-query-api-design-lessons-learned

#### 5. Super-fast apps on sync with Electric and TanStack DB, accessed on March 19,

#### 2026,

#### https://electric-sql.com/blog/2025/07/29/super-fast-apps-on-sync-with-tanstack

#### -db

#### 6. How to Use Supabase with TanStack Query (React Query v5) - MakerKit,

#### accessed on March 19, 2026,

#### https://makerkit.dev/blog/saas/supabase-react-query

#### 7. TkDodo's Blog | TanStack Query React Docs, accessed on March 19, 2026,

#### https://tanstack.com/query/v4/docs/react/community/tkdodos-blog

#### 8. The Query Options API - TkDodo's blog, accessed on March 19, 2026,

#### https://tkdodo.eu/blog/the-query-options-api

#### 9. React Hooks · supabase · Discussion #726 - GitHub, accessed on March 19, 2026,

#### https://github.com/orgs/supabase/discussions/

#### 10. Using React useEffect hook + Supabase realtime issue - Stack Overflow,

#### accessed on March 19, 2026,

#### https://stackoverflow.com/questions/73619337/using-react-useeffect-hook-supa

#### base-realtime-issue

#### 11. Effective React Query Keys - TkDodo's blog, accessed on March 19, 2026,

#### https://tkdodo.eu/blog/effective-react-query-keys

#### 12. Tanstack Query, Query Keys Best Practices - YouTube, accessed on March 19,

#### 2026, https://www.youtube.com/watch?v=8KWMOCW6LCU

#### 13. How to invalidate queries in React Query - CoreUI, accessed on March 19, 2026,

#### https://coreui.io/answers/how-to-invalidate-queries-in-react-query/

#### 14. Implementing Realtime Messaging with Supabase + React | by Fedor Selenskiy,

#### accessed on March 19, 2026,

#### https://levelup.gitconnected.com/implementing-realtime-messaging-with-supab

#### ase-react-0f8a33a35e

#### 15. React Query invalidateQueries not updating the UI - Stack Overflow, accessed on

#### March 19, 2026,

#### https://stackoverflow.com/questions/75121109/react-query-invalidatequeries-not

#### -updating-the-ui

#### 16. How do you handle realtime idle reconnects? · supabase · Discussion #19387 -

#### GitHub, accessed on March 19, 2026,

#### https://github.com/orgs/supabase/discussions/

#### 17. Subscribing to Database Changes | Supabase Docs, accessed on March 19, 2026,

#### https://supabase.com/docs/guides/realtime/subscribing-to-database-changes

#### 18. Realtime Authorization | Supabase Docs, accessed on March 19, 2026,

#### https://supabase.com/docs/guides/realtime/authorization


#### 19. Supabase Realtime: Broadcast and Presence Authorization, accessed on March

#### 19, 2026,

#### https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authoriz

#### ation

#### 20. Supabase RLS Guide: Policies That Actually Work - DesignRevision, accessed on

#### March 19, 2026, https://designrevision.com/blog/supabase-row-level-security

#### 21. Building a Modern Client-Side Image Compressor Using React & Kiro IDE,

#### accessed on March 19, 2026,

#### https://builder.aws.com/content/36CtwkVW9OoYyUdlL6IsPbLP2D9/building-a-mo

#### dern-client-side-image-compressor-using-react-and-kiro-ide

#### 22. How to compress an image in a React web app? [closed] - Stack Overflow,

#### accessed on March 19, 2026,

#### https://stackoverflow.com/questions/47956281/how-to-compress-an-image-in-a

#### -react-web-app

#### 23. Supabase Storage v2: Image resizing and Smart CDN, accessed on March 19,

#### 2026, https://supabase.com/blog/storage-image-resizing-smart-cdn

#### 24. Implementing Drag and Drop Upload in React using Supabase - DEV Community,

#### accessed on March 19, 2026,

#### https://dev.to/surajondev/implementing-drag-and-drop-upload-in-react-using-su

#### pabase-49pb

#### 25. Resumable uploads | Supabase Features, accessed on March 19, 2026,

#### https://supabase.com/features/resumable-uploads

#### 26. Resumable Uploads | Supabase Docs, accessed on March 19, 2026,

#### https://supabase.com/docs/guides/storage/uploads/resumable-uploads

#### 27. How to use react-query useMutation with a multi-part file upload? - Stack

#### Overflow, accessed on March 19, 2026,

#### https://stackoverflow.com/questions/68891102/how-to-use-react-query-usemut

#### ation-with-a-multi-part-file-upload

#### 28. The magic of react-query and supabase - DEV Community, accessed on March

#### 19, 2026, https://dev.to/ankitjey/the-magic-of-react-query-and-supabase-1pom

#### 29. Optimistic UI - React - AWS Amplify Gen 2 Documentation, accessed on March

#### 19, 2026, https://docs.amplify.aws/react/build-a-backend/data/optimistic-ui/

#### 30. Concurrent Optimistic Updates in React Query - TkDodo's blog, accessed on

#### March 19, 2026,

#### https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query

#### 31. Role-Based Access Control (RBAC) | Supabase Features, accessed on March 19,

#### 2026, https://supabase.com/features/role-based-access-control

#### 32. Building Role-Based Access Control (RBAC) with Supabase Row-Level Security -

#### Medium, accessed on March 19, 2026,

#### https://medium.com/@lakshaykapoor08/building-role-based-access-control-rba

#### c-with-supabase-row-level-security-c82eb1865dfd

#### 33. Why is react-query invalidation bleeding across tabs? - Stack Overflow, accessed

#### on March 19, 2026,

#### https://stackoverflow.com/questions/79431470/why-is-react-query-invalidation-b

#### leeding-across-tabs


#### 34. Best Practices for Implementing Role-Based Access Control in React Applications

- Reddit, accessed on March 19, 2026,

#### https://www.reddit.com/r/reactjs/comments/1aur1fz/best_practices_for_implemen

#### ting_rolebased_access/

#### 35. Multi-Tenancy in React Applications: Complete Implementation Guide with Clerk,

#### accessed on March 19, 2026,

#### https://clerk.com/articles/multi-tenancy-in-react-applications-guide

#### 36. React Native file upload with Supabase Storage, accessed on March 19, 2026,

#### https://supabase.com/blog/react-native-storage

#### 37. Recommended folder structure for managing multiple client React projects with

#### shared components? - Stack Overflow, accessed on March 19, 2026,

#### https://stackoverflow.com/questions/79900249/recommended-folder-structure-f

#### or-managing-multiple-client-react-projects-with-sh

#### 38. React Folder Structure in 5 Steps [2025] - Robin Wieruch, accessed on March 19,

#### 2026, https://www.robinwieruch.de/react-folder-structure/

#### 39. Implementing Role-Based Access Control (RBAC) in React Applications -

#### Medium, accessed on March 19, 2026,

#### https://medium.com/@plntry/implementing-role-based-access-control-rbac-in-r

#### eact-applications-7ba7f11d653b

#### 40. connectaryal/rbac: React role and permission based access control - GitHub,

#### accessed on March 19, 2026, https://github.com/connectaryal/rbac

#### 41. Building Robust Role-Based Access Control (RBAC) in TypeScript with NestJS -

#### Medium, accessed on March 19, 2026,

#### https://medium.com/@nwonahr/building-robust-role-based-access-control-rbac

#### -in-typescript-with-nestjs-f96bd01f89ad


