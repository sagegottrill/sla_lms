# CONNECTA_UI_UPGRADE_SPEC.md

## Master Execution Directives for the AI aCoder

The following specification details a comprehensive, enterprise-grade architectural and user
interface refactoring protocol for the "Connecta LMS" frontend environment. The existing
infrastructure, constructed upon React 18, Tailwind CSS, Shadcn UI, and Supabase, currently
possesses fully functional routing, authentication contexts, and database connections. The
primary objective of this refactoring protocol is to elevate the existing user experience (UX) and
user interface (UI) to match the rigorous standards of world-class enterprise platforms,
specifically drawing upon the cognitive load reduction techniques utilized by Reforge and the
visual curriculum paradigms pioneered by Coursera.^1
The AI agent is strictly instructed to parse the existing React component tree, evaluate the
Abstract Syntax Trees (AST) of the target files, and inject the following specific UI/UX
enhancements without disrupting or destroying the underlying data fetching mechanisms,
authentication state contexts, or application routing logic. The AI agent must read the existing
monolithic components first, extract the core operational logic, and apply the targeted wrappers,
state managers, and styling overwrites detailed in this document. Adhere rigorously to the
implementation patterns provided, prioritizing progressive profiling, visual curriculum building,
progressive disclosure, and the Calm UI design system.^3 Every structural modification must
prioritize rendering performance, utilizing hardware-accelerated CSS transitions and optimistic
state mutations to ensure a frictionless user experience.^5

## 1. Upgrading to a Frictionless Onboarding Flow

The current authentication and onboarding flow within Connecta LMS utilizes standard,
monolithic sign-up forms that present users with an overwhelming array of input fields
simultaneously. To align with enterprise-grade activation metrics and reduce cognitive load, the
AI agent must refactor this singular form into a "Progressive Profiling" multi-step flow. This
approach minimizes user friction, guiding them from an initial "Setup Moment" to their "Aha
Moment" through sequentially presented, highly focused queries.^1 The most successful products
recognize that not every user is the same, and overloading a user with too much information at
once leads directly to cognitive overload and subsequent application abandonment.^7
By breaking down the process into manageable steps and asking "dead-end" or complex
questions only after initial engagement is secured, the system drastically improves completion
rates.^8 The AI agent must meticulously dismantle the existing singular onboarding component
and orchestrate a multi-step architecture supported by robust state management and fluid
spatial transitions.

### 1.1 Progressive Profiling Architecture and Zustand State Management


The AI agent is directed to distribute the extracted form inputs across discrete step components,
implementing an "One Form Instance Per Step" strategy.^10 This isolated approach ensures that
validation and type safety are enforced for each step individually before the user is permitted to
progress, localizing errors to specific contextual boundaries and allowing for a highly modular,
reusable architecture.^10 To manage the state across these independently unmounted and
remounted components, the agent must implement a lightweight, persistent Zustand store.^10
Unlike React Hook Form’s local state, which disappears when navigating between distinct route
steps or refreshing the browser, Zustand ensures that the accumulated data remains accessible
and intact.^10
The AI agent must create src/store/useOnboardingStore.ts utilizing the following precise
architectural pattern, ensuring that the Zustand persist middleware is correctly configured to
save the form data to the browser's localStorage.^10 This persistence mechanism guarantees
that users can survive accidental page refreshes or complete the onboarding flow across
multiple sessions without data loss.^10
TypeScript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// Define the comprehensive schema for the entire onboarding journey
interface OnboardingData {
role: 'student' | 'instructor' | 'admin' | null;
interests: string;
organization: string;
experienceLevel: string;
professionalGoals: string;
}
// Define the state operations and tracking metrics
interface OnboardingState {
currentStep: number;
direction: number; // Required for calculating Framer Motion slide vectors
formData: Partial<OnboardingData>;
setFormData: (data: Partial<OnboardingData>) => void;
nextStep: () => void;
prevStep: () => void;
resetForm: () => void;


##### }

// Instantiate the persistent store
export const useOnboardingStore = create<OnboardingState>()(
persist(
(set) => ({
currentStep: 0 ,
direction: 0 ,
formData: {},
setFormData: (data) =>
set((state) => ({ formData: {...state.formData,...data } })),
nextStep: () =>
set((state) => ({ currentStep: state.currentStep + 1 , direction: 1 })),
prevStep: () =>
set((state) => ({ currentStep: state.currentStep - 1 , direction: - 1 })),
resetForm: () =>
set({ currentStep: 0 , direction: 0 , formData: {} }),
}),
{
name: 'connecta-onboarding-storage',
storage: createJSONStorage(() => localStorage),
// Only persist the formData, not the ephemeral animation states
partialize: (state) => ({ formData: state.formData }),
}
)
);
The AI agent must then engineer a custom hook, useFormStep, to seamlessly bind React Hook
Form's local validation logic to this global Zustand store. This hook must initialize the local form
utilizing a Zod resolver for rigorous schema-based validation, populating the defaultValues by
extracting any pre-existing data from the Zustand formData object.^10 When the user attempts to
proceed, the hook must first validate the local step data; upon successful validation, it must
invoke setFormData to merge the new step data into the global record and subsequently trigger
the nextStep action.^10

### 1.2 Framer Motion Transition Wrappers

To provide a seamless, slide-in/slide-out transition between progressive profiling steps that
mimics native mobile application navigation, the AI agent must wrap the step components in
Framer Motion's AnimatePresence and motion.div elements.^13 The direction of the animation
must be dynamically and mathematically tied to the direction state variable maintained within
the Zustand store. This ensures semantic spatial movement, whereby advancing through the
form causes the new step to slide in from the right, and returning to a previous step causes the


interface to slide in from the left.^13
The AI agent must implement the following specific Framer Motion snippet strategy within the
root onboarding layout component. The transition parameters must strictly adhere to a spring
physics model rather than a linear tween to provide an organic, professional feel to the
interaction.^15
TypeScript
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { StepAccountDetails } from './steps/StepAccountDetails';
import { StepRoleSelection } from './steps/StepRoleSelection';
import { StepPreferences } from './steps/StepPreferences';
// Define the spatial variants utilizing the direction integer as a custom prop
const variants = {
enter: (direction: number) => ({
x: direction > 0? 800 : -800,
opacity: 0,
scale: 0.98,
}),
center: {
zIndex: 1,
x: 0,
opacity: 1,
scale: 1,
},
exit: (direction: number) => ({
zIndex: 0,
x: direction < 0? 800 : -800,
opacity: 0,
scale: 0.98,
position: 'absolute' as const, // Prevents layout thrashing during DOM removal
}),
};
export const OnboardingWizard = () => {
const { currentStep, direction } = useOnboardingStore();


const renderStep = () => {
switch (currentStep) {
case 0: return <StepAccountDetails key="step-account" />;
case 1: return <StepRoleSelection key="step-role" />;
case 2: return <StepPreferences key="step-prefs" />;
default: return null;
}
};
return (
<div className="relative w-full max-w-2xl mx-auto overflow-hidden min-h-[600px] flex
items-start justify-center pt-12">
{/* The custom prop passes the direction to the variant functions */}
<AnimatePresence mode="popLayout" custom={direction} initial={false}>
<motion.div
key={currentStep}
custom={direction}
variants={variants}
initial="enter"
animate="center"
exit="exit"
transition={{
x: { type: "spring", stiffness: 350, damping: 35 },
opacity: { duration: 0.25 },
scale: { duration: 0.25 }
}}
className="w-full"
>
{renderStep()}
</motion.div>
</AnimatePresence>
</div>
);
};
**Refactoring Execution Directives for the AI Coder:**

1. Locate the existing signup monolithic form component within the src/app/auth or equivalent
    directory.
2. Identify the Supabase signUp execution function and the associated routing redirects. Do
    not alter the core logic of this database interaction.
3. Isolate the existing input fields into distinct visual categories, separating authentication
    credentials from profile data and system preferences.


4. Construct individual React components for each step, implementing the Zod validation
    schemas strictly for the fields present within that specific component.^10
5. Route the intermediate data captures through the custom useFormStep hook into the
    useOnboardingStore().setFormData action.^10
6. Execute the original Supabase signUp function only upon the successful validation of the
    final step, passing the entirely aggregated formData object to the database API.^10

## 2. Enhancing the Course Authoring Wizard

The legacy "Create Course" interface currently operates as a standard, vertical HTML form,
failing to provide the spatial reasoning and structural visualization necessary for complex
curriculum design. To achieve operational parity with world-class enterprise platforms, this
interface must be radically transformed into a Visual Curriculum Builder reminiscent of
Coursera's AI-assisted authoring environments.^2 This transformation requires injecting highly
responsive drag-and-drop mechanics for curriculum structuring and implementing a focus-driven
"Theater Mode" for deep content authoring without external navigational distractions.^2

### 2.1 Injecting Drag-and-Drop Functionality with @hello-pangea/dnd

The AI agent is instructed to utilize @hello-pangea/dnd to manage the complex reordering of
nested lists, specifically the architectural hierarchy of Course Modules containing individual
Lessons. This library, a modernized fork of react-beautiful-dnd, is specifically optimized for
vertical lists, horizontal lists, and complex nested list movements within React applications,
providing a powerful, natural, and accessible drag-and-drop experience.^19
A critical safeguard must be implemented regarding backend synchronization. The AI agent
must not attempt to continuously mutate the Supabase backend during the active dragging
event (onDragUpdate). Real-time database mutations during high-frequency pointer events will
result in severe race conditions, optimistic UI desynchronization, and excessive API throttling.^20
All database mutations must be strictly reserved for the onDragEnd resolution.
The AI agent must implement the following structural wrapper for the curriculum builder,
establishing the top-level context and the nested drop zones:
TypeScript
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVerticalIcon } from 'lucide-react';
// AI Directive: Bind this execution to the existing local React state before pushing the finalized


array to Supabase
const handleDragEnd = (result: DropResult, localStateUpdater: Function,
supabaseSyncFunction: Function) => {
const { source, destination, type } = result;
// Terminate execution if dropped outside a valid Droppable context
if (!destination) return;
// Terminate execution if no spatial movement occurred
if (source.droppableId === destination.droppableId && source.index === destination.index)
return;
if (type === 'module') {
// Execute logic to reorder top-level modules
const reorderedModules = calculateNewOrder(source.index, destination.index);
localStateUpdater(reorderedModules);
supabaseSyncFunction(reorderedModules); // Sync to DB only after drop completes
} else if (type === 'lesson') {
// Execute logic to move lessons within a single module or between distinct modules
const updatedCurriculum = calculateNestedOrder(source.droppableId,
destination.droppableId, source.index, destination.index);
localStateUpdater(updatedCurriculum);
supabaseSyncFunction(updatedCurriculum);
}
};
export const VisualCurriculumBuilder = ({ modules, updateLocalState, syncToDatabase }) => {
return (
<DragDropContext onDragEnd={(result) => handleDragEnd(result, updateLocalState,
syncToDatabase)}>
{/* Top level droppable for Modules */}
<Droppable droppableId="curriculum-board" type="module">
{(provided) => (
<div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
{modules.map((module, index) => (
<Draggable key={module.id} draggableId={module.id} index={index}>
{(provided, snapshot) => (
<div
ref={provided.innerRef}
{...provided.draggableProps}
// Apply visual elevation when the item is being actively dragged
className={`rounded-xl bg-white shadow-sm ring-1 ring-gray-900/
transition-shadow ${snapshot.isDragging? 'opacity-90 ring-2 ring-primary shadow-xl z-50' : ''}`}


##### >

<div {...provided.dragHandleProps} className="p-5 border-b border-gray-100 flex
items-center cursor-grab active:cursor-grabbing bg-gray-50/50 rounded-t-xl">
<GripVerticalIcon className="w-5 h-5 text-gray-400 mr-4" />
<h3 className="font-semibold text-gray-900">{module.title}</h3>
</div>
<div className="p-5">
{/* Nested Droppable for Lessons injected here */}
<LessonDroppable moduleId={module.id} lessons={module.lessons} />
</div>
</div>
)}
</Draggable>
))}
{provided.placeholder}
</div>
)}
</Droppable>
</DragDropContext>
);
};
**Drag and Drop Phase Data Action Required UI Response Directive**
onDragStart Lock scrolling if necessary;
establish origin index.
Apply ring-primary, increase
drop shadow, change
cursor to grabbing.
onDragUpdate Calculate predictive
insertion point.
Animate sibling elements to
create physical space for
the drop destination.^20
onDragEnd Mutate local React state
array immediately.
Snap element into
destination. Remove active
dragging styles.^20
Post-onDragEnd Fire asynchronous
Supabase mutation.
Trigger optimistic UI update
toast notification
acknowledging the reorder.^6


### 2.2 State Management and CSS Transitions for Theater Mode

To facilitate deep authoring workflows without distraction, the curriculum builder must empower
the user to collapse the global application sidebar and expand the editor into a focused "Theater
Mode". The AI agent must manage this layout shift meticulously to avoid triggering expensive
DOM layout recalculations (known as layout thrashing) that occur when animating CSS width or
margin properties directly.^5 CSS animations are significantly more performant when restricted to
transform and opacity properties.^5
The AI agent must define a global state toggle via Zustand or an existing React Context named
isTheaterMode. The transition must be handled via CSS transform adjustments rather than
animating absolute width pixel values, ensuring smooth, hardware-accelerated rendering at 60
frames per second.^5
**Implementation Directive for the Sidebar Layout:**

1. Locate the master layout wrapper containing the <Sidebar /> and <MainContent />
    components.
2. Apply the following conditional Tailwind classes based on the isTheaterMode boolean
    state. Note the usage of specific cubic-bezier curves to ensure the animation mimics native
    OS interactions rather than linear mechanical movement.^16
TypeScript
<div className="flex h-screen overflow-hidden bg-gray-50">
{/* Sidebar container utilizing transform-based transitions for high performance */}
<aside
className={cn(
"fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white transition-transform duration-
ease-[cubic-bezier(0.36,-0.01,0.0,0.77)] will-change-transform border-r border-gray-
shadow-sm",
isTheaterMode? "-translate-x-full" : "translate-x-0"
)}
>
<SidebarNavigation />
</aside>
{/* Main content container adjusts padding to fill the void left by the transformed sidebar */}
<main
className={cn(


"flex-1 flex flex-col min-w-0 transition-[padding] duration-
ease-[cubic-bezier(0.36,-0.01,0.0,0.77)]",
isTheaterMode? "pl-0" : "pl-64"
)}
>
<TopNavbar
isTheaterMode={isTheaterMode}
toggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
/>
<div className="flex-1 overflow-auto p-8">
{children}
</div>
</main>
</div>
The AI agent must ensure that the isTheaterMode toggle button utilizes clear, intuitive
iconography (e.g., Maximize and Minimize or PanelLeftClose icons from the Lucide React
library) positioned prominently within the authoring header.^5

## 3. Refactoring the Command Center for "Progressive

## Disclosure"

The existing Admin Dashboards within the Connecta LMS are currently characterized by
excessive cognitive load, presenting heavily populated data tables and an abundance of
persistent action buttons. To align with Calm UI principles and modern enterprise dashboard
standards, the AI agent must systematically implement the concept of "Progressive
Disclosure".^3 This architectural design pattern ensures that complex interfaces reveal their
complexity only when necessary, restoring user focus by eliminating visual noise and
streamlining data processing.^3 Clean user interfaces must prioritize data visualization and
hierarchy over persistent administrative controls.^25

### 3.1 Tailwind Refactoring Rules for Action Granularity

The AI agent must locate all existing data tables, lists, and user management cards that
currently display explicit "Edit", "Delete", and "Suspend" buttons inline on every single row.
These persistent elements cause severe visual clutter, distort the data-ink ratio, and overwhelm
administrators scanning for critical metrics.^24
**Refactoring Execution Protocol:**

1. The AI agent must extract these discrete mutation buttons and migrate them into a unified,
    accessible Shadcn UI <DropdownMenu> component.
2. The trigger for this dropdown must be a subtle MoreHorizontal (ellipsis) icon button,


```
visually minimizing the footprint of the actions.^26
```
3. The AI agent must apply strict Tailwind hover-state logic so that the action trigger is only
    fully visible when the user actively hovers over the specific row with their pointer, or
    focuses on the row via keyboard navigation, ensuring full accessibility.^4
**Code Implementation for Progressively Disclosed Table Rows:**
TypeScript
{/* The parent row must establish the 'group' context to control child visibility */}
<tr className="group border-b border-gray-100 hover:bg-gray-50/50 transition-colors
duration-200">
<td className="p-4 align-middle text-sm text-gray-900">{user.name}</td>
<td className="p-4 align-middle text-sm text-gray-500">{user.email}</td>
<td className="p-4 align-middle text-right">
{/* The action container remains transparent until the parent row receives interaction */}
<div className="opacity-0 group-hover:opacity-100 focus-within:opacity-
transition-opacity duration-200">
<DropdownMenu>
<DropdownMenuTrigger asChild>
<Button variant="ghost" size="icon" className="h-8 w-8 text-gray-
hover:text-gray-900">
<MoreHorizontal className="h-4 w-4" />
<span className="sr-only">Open administrative actions for {user.name}</span>
</Button>
</DropdownMenuTrigger>
<DropdownMenuContent align="end" className="w-48 shadow-md rounded-xl ring-
ring-black/5">
<DropdownMenuLabel className="text-xs text-gray-500 uppercase
tracking-wider">Actions</DropdownMenuLabel>
<DropdownMenuSeparator className="bg-gray-100" />
<DropdownMenuItem onClick={() => openEditModal(user)} className="cursor-pointer">
<Edit className="mr-2 h-4 w-4 text-gray-500" /> Edit User Profile
</DropdownMenuItem>
<DropdownMenuItem onClick={() => suspendUser(user.id)} className="cursor-pointer">
<ShieldBan className="mr-2 h-4 w-4 text-gray-500" /> Suspend Account
</DropdownMenuItem>
<DropdownMenuSeparator className="bg-gray-100" />
{/* Destructive actions must be clearly demarcated with semantic coloring */}
<DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-red-


focus:text-red-700 focus:bg-red-50 cursor-pointer">
<Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenu>
</div>
</td>
</tr>

### 3.2 Replacing Bulky Dropdowns with Sleek Multi-Select Filter Chips

The current dashboard relies heavily on standard HTML <select> dropdowns for filtering
datasets. This legacy approach obscures the active filter states from the user, requiring them to
repeatedly open the dropdown to verify their current query parameters, increasing friction and
cognitive load.^24 The AI agent must replace these mechanisms with Shadcn UI multi-select
Filter Chips.^26
Filter chips (or badges) expose the most frequently utilized filtering dimensions as horizontal,
interactive button groups, significantly enhancing data scanability and immediate context
awareness.^26
**Filter Chip State Management and Implementation Matrix:**
The AI agent must engineer a component that accepts an array of options and tracks multiple
selected values simultaneously. Unselected chips must utilize an outline or secondary variant to
recede into the visual hierarchy, while active chips must utilize a default or customized semantic
variant to visually emphasize selection.^26 An "All" or "Reset" chip must be provided to instantly
clear the array state.^26
TypeScript
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
interface FilterChipsProps {
options: { label: string; value: string };
selectedValues: string;
onToggle: (value: string) => void;
onClear: () => void;
}


export function FilterChips({ options, selectedValues, onToggle, onClear }: FilterChipsProps) {
return (
<div className="flex flex-wrap gap-2 items-center mb-8">
<span className="text-sm text-gray-500 mr-3 font-medium tracking-wide">Filter
by:</span>
{/* The "All" state acts as a visual reset mechanism */}
<Badge
variant={selectedValues.length === 0? "default" : "secondary"}
className={cn(
"cursor-pointer px-3 py-1 transition-all duration-200",
selectedValues.length === 0
? "bg-gray-900 text-white shadow-sm"
: "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
)}
onClick={onClear}
role="button"
tabIndex={0}
>
All Results
</Badge>
{options.map((option) => {
const isActive = selectedValues.includes(option.value);
return (
<Badge
key={option.value}
variant={isActive? "default" : "outline"}
className={cn(
"cursor-pointer px-3 py-1 transition-all duration-200",
isActive
? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
: "text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
)}
onClick={() => onToggle(option.value)}
role="button"
tabIndex={0}
>
{option.label}
</Badge>
);
})}


</div>
);
}
The AI agent must locate all list-rendering components across the administrative space (e.g.,
the User Directory, the Course Catalog, the Analytics Views), extract the underlying query
parameter states, and bind them to this new FilterChips component. The AI agent must ensure
the Supabase data fetching functions natively react to changes within the selectedValues array,
triggering re-fetches or cache invalidations appropriately.^28

## 4. Applying the "Calm UI" Design System

The underlying aesthetic of the existing application currently exhibits excessive visual noise,
primarily characterized by rigid boundaries, aggressive high-contrast borders, arbitrary spatial
margins, and jarring browser reloads during data mutations. The "Calm UI" philosophy dictates
that clarity must replace clutter, forgiveness must replace fear, and predictability must replace
noise.^3 Systems designed with Calm UI principles respect human bandwidth by reducing visual
stress and restoring a sense of control.^3 The AI agent must orchestrate a comprehensive styling
sweep and implement robust optimistic updates to fulfill these exacting principles across the
entirety of the application.

### 4.1 Strict Tailwind "Find and Replace" Rules for Environmental

### Consistency

The AI agent must traverse the entire codebase and enforce the following Tailwind utility class
replacements using AST modifications. The primary objective is to eliminate heavy graphical
borders in favor of subtle spatial shadows, thereby promoting visual depth without creating rigid,
confining boxes that fatigue the eye.^31 Furthermore, spacing must be strictly regimented to a
unified 6-point proportional scale (p-6, gap-6, mb-6) to create absolute environmental
consistency.^3 Familiar layouts and consistent spacing drastically reduce the mental effort
required to reorient from screen to screen.^3
**Rule Matrix for the AI Coder Refactoring Protocol:
Target Legacy Pattern
Found in Existing Code
Refactored Calm UI
Tailwind Class
Replacement
UX and Architectural
Rationale**
border border-gray-200 shadow-sm ring-
ring-black/
Softens absolute
boundaries, relying on
natural shadow depth and


highly transparent rings
rather than harsh, solid
lines to separate adjacent
elements.^3
border border-gray-
rounded
shadow ring-1 ring-black/
rounded-xl
Modernizes card
components with
significantly softer corners
(rounded-xl) and deeper,
atmospheric separation.^31
shadow-lg or shadow-xl
(when used on standard
structural elements)
shadow-md ring-
ring-black/
Reduces overly aggressive
drop shadows that draw
unnecessary attention away
from the actual content.
High shadows should be
reserved strictly for floating
modals or dragging states.^25
p-3, p-4, p-5 (arbitrary inner
container padding)
p-6 Enforces a breathable,
uniform spatial cadence.
Consistent, slightly larger
padding lowers cognitive
load by ensuring elements
feel universally predictable
and uncluttered.^3
gap-2, gap-4 (arbitrary
grid/flex spacing for major
layout elements)
gap-6 Synchronizes internal
element gaps with the outer
container padding (p-6),
creating perfect geometric
harmony across complex
data grids.^34
bg-gray-100 (on broad
background elements)
bg-gray-50/50 or
bg-[#FAFAFA]
Lightens the application
base environment, making
the primary white (bg-white)
content cards emerge
gracefully without inducing
severe contrast strain.^31
<hr className="my-4 <hr className="my-6 Ensures vertical rhythms


border-gray-300" /> border-gray-100" /> align perfectly with the
6-point scale and softens
the visual impact of
horizontal dividers so they
guide rather than halt the
eye.^3
**Execution Directive for AST Manipulation:** The AI agent must utilize AST parsing to locate
JSX className attributes and apply these transformations intelligently. The agent must not
blindly run regex replacements on strings if they are dynamically constructed or conditionally
generated. The agent must ensure that interactive elements (like inputs and select menus)
maintain their focus rings (focus:ring-2 focus:ring-primary/20 focus:outline-none) to preserve
strict accessibility standards.

### 4.2 Optimistic UI Updates and Sonner Toast Notifications

In a Calm UI paradigm, the system must provide predictable, immediate, and forgiving feedback
without paralyzing the user interface with blocking loading spinners or jarring full-page reloads
during routine data mutations.^3 Users should never be left wondering whether a system
accepted their interaction.^3 To accomplish this, the AI agent must wrap existing Supabase
mutation functions (such as deleting a user profile or updating a course status) with Optimistic
UI logic and Sonner toast notifications.^6
Sonner is explicitly specified as it provides an opinionated, lightweight, and modern toast
implementation that supports complex descriptions and action buttons, adhering perfectly to the
principle of "predictable feedback".^3
Assuming the application utilizes TanStack React Query (the standard asynchronous state
manager for such architectures), the AI agent must implement the onMutate, onError, and
onSettled lifecycles to artificially update the UI cache instantly, and roll it back silently if the
Supabase network request fails.^37
**Implementation Blueprint for Optimistic Database Deletions:**

1. The AI agent must import the toast utility from the sonner package.^35
2. The AI agent must locate the existing data mutation function hooks (e.g., useDeleteUser).
3. The AI agent must refactor the hook to intercept the query cache prior to the server
    roundtrip, executing the optimistic update pattern flawlessly.^37
TypeScript


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
export const useDeleteUser = () => {
const queryClient = useQueryClient();
return useMutation({
// 1. The actual asynchronous Supabase mutation execution
mutationFn: async (userId: string) => {
const { data, error } = await supabase
.from('users')
.delete()
.eq('id', userId);
// Crucial: The error must be thrown to trigger the onError rollback lifecycle
if (error) throw new Error(error.message);
return data;
},
// 2. Optimistic Update: Fires immediately the millisecond the mutation is called by the UI
onMutate: async (deletedUserId) => {
// Cancel any outgoing refetches so they don't overwrite our optimistic local update
await queryClient.cancelQueries({ queryKey: ['users-list'] });
// Snapshot the previous exact value for a potential error rollback
const previousUsers = queryClient.getQueryData(['users-list']);
// Optimistically update the cache to remove the user instantly from the UI table
queryClient.setQueryData(['users-list'], (old: any) => {
return old? old.filter((user) => user.id!== deletedUserId) :;
});
// Return a context object containing the snapshotted value to pass to onError
return { previousUsers };
},
// 3. Rollback on Error: Executed if Supabase fails (e.g., Network failure or RLS policy violation)
onError: (err, deletedUserId, context) => {
// Restore the previous cache state silently, reverting the UI to its true database state
if (context?.previousUsers) {
queryClient.setQueryData(['users-list'], context.previousUsers);
}


// Fire a forgiving, clearly written Sonner toast explaining the failure
toast.error("Unable to delete user profile", {
description: "The server rejected the request due to permission constraints. Please verify your
access level.",
});
},
// 4. Invalidation: Always refetch after error or success to ensure 100% absolute sync with Supabase
onSettled: () => {
queryClient.invalidateQueries({ queryKey: ['users-list'] });
},
// 5. Success Feedback: Subtle confirmation of the destructive action
onSuccess: () => {
toast.success("User profile deleted", {
description: "The data has been permanently removed from the system.",
});
},
});
};
**Optimistic UI Lifecycle
Phase
Action Executed UX Result for the User**
onMutate Cache is artificially updated. The UI instantly reflects the
change. No loading
spinners are shown. The
system feels infinitely fast.^6
onError Cache is reverted to the
snapshot.
The UI element reappears.
A toast explains why. The
user maintains control
without confusion.^3
onSuccess Toast confirmation is
triggered.
The user receives
predictable feedback that
their action was
permanently committed.^3


onSettled Background refetch is
triggered.
Silent synchronization
occurs, ensuring the client
is never out of sync with the
Supabase source of truth.^37
**Final AI Agent Testing Directives:** Upon completion of the code extraction, injection, and
refactoring protocols outlined above, the AI coder is explicitly instructed to statically verify the
integration prior to runtime. Ensure that no import statements conflict across the refactored files.
Verify that all Zustand stores instantiate correctly outside of the React component tree to
prevent infinite re-renders.^11 Ensure that Framer Motion properties strictly align with the
documented Tailwind utility classes, and that all Supabase mutationFn executions reliably
resolve via the implemented supabase-js client syntax.^36
Under no circumstances should the AI agent alter any backend PostgreSQL Row Level Security
(RLS) policies; ensure the frontend logic gracefully catches and toasts any RLS rejections using
the optimistic rollback logic provided.^38 Finally, parse the injected Shadcn UI <DropdownMenu>
and <Badge> elements to guarantee that all respective ARIA attributes (role, tabIndex,
aria-expanded) are fully preserved for keyboard accessibility. Proceed with the execution of the
upgrade specification.

#### Works cited

#### 1. Optimize new user onboarding - Reforge, accessed on March 19, 2026,

#### https://www.reforge.com/guides/optimize-new-user-onboarding

#### 2. Course Builder - Coursera, accessed on March 19, 2026,

#### https://www.coursera.org/campus/course-builder

#### 3. Designing Calm: UX Principles for Reducing Users' Anxiety - UXmatters,

#### accessed on March 19, 2026,

#### https://www.uxmatters.com/mt/archives/2025/05/designing-calm-ux-principles-for-r

#### educing-users-anxiety.php

#### 4. Designing for calm: How Enterprise UX can help reduce stress and improve focus

#### | by Svetha Venkatraman | Bootcamp | Medium, accessed on March 19, 2026,

#### https://medium.com/design-bootcamp/designing-for-calm-how-enterprise-ux-can-h

#### elp-reduce-stress-and-improve-focus-cd397c1d

#### 5. Sidebar animation performance - Josh Wootonn, accessed on March 19, 2026,

#### https://www.joshuawootonn.com/sidebar-animation-performance

#### 6. Toast messages in React Server Components - Build UI, accessed on March 19,

#### 2026, https://buildui.com/posts/toast-messages-in-react-server-components

#### 7. I studied the UX/UI of over 200 onboarding flows - here's everything I learned -

#### DesignerUp, accessed on March 19, 2026,

#### https://designerup.co/blog/i-studied-the-ux-ui-of-over-200-onboarding-flows-heres-

#### everything-i-learned/

#### 8. Mastering User Onboarding Flows in UX/UI Design | by jacob gruver - Medium,

#### accessed on March 19, 2026,


#### https://medium.com/@jgruver/mastering-user-onboarding-flows-in-ux-ui-design-dd

#### 77a9c30bdb

#### 9. How do I effectively manage state for dozens of inter-dependent forms? : r/reactjs

- Reddit, accessed on March 19, 2026,

#### https://www.reddit.com/r/reactjs/comments/1j9gx6r/how_do_i_effectively_manage

#### _state_for_dozens_of/

#### 10. React Hook Form Multi-Step Tutorial: Zustand + Zod + Shadcn ..., accessed on

#### March 19, 2026,

#### https://www.buildwithmatija.com/blog/master-multi-step-forms-build-a-dynamic-rea

#### ct-form-in-6-simple-steps

#### 11. How to Implement Global State Management with Zustand in React - OneUptime,

#### accessed on March 19, 2026,

#### https://oneuptime.com/blog/post/2026-01-15-react-zustand-global-state-managem

#### ent/view

#### 12. Building a reusable multi-step form with React Hook Form and Zod - LogRocket

#### Blog, accessed on March 19, 2026,

#### https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/

#### 13. Official Motion Examples | React, JS & Vue Animations - Motion.dev, accessed on

#### March 19, 2026, https://motion.dev/examples

#### 14. Multi-step forms with Transition Effects in React - OpenReplay Blog, accessed on

#### March 19, 2026,

#### https://blog.openreplay.com/multi-step-forms-with-transition-effects-in-react/

#### 15. Framer-motion - 2 step animation - Stack Overflow, accessed on March 19, 2026,

#### https://stackoverflow.com/questions/72358053/framer-motion-2-step-animation

#### 16. Building a Retractable Sidebar with React and CSS - Luigi Cavalieri, accessed on

#### March 19, 2026,

#### https://luigicavalieri.com/blog/build-retractable-sidebar-with-react-css/

#### 17. Coursera Launches Course Builder: Organizations Can Now Quickly Create and

#### Launch Custom Courses at Scale, accessed on March 19, 2026,

#### https://blog.coursera.org/coursera-launches-course-builder/

#### 18. React Sidebar Examples and Templates - ThemeSelection, accessed on March

#### 19, 2026, https://themeselection.com/blog/react-sidebar-examples-templates/

#### 19. GitHub - hello-pangea/dnd: Beautiful and accessible drag and drop for lists with

#### React. ⭐ Star to support our work!, accessed on March 19, 2026,

#### https://github.com/hello-pangea/dnd

#### 20. Building Complex Nested Drag and Drop User Interfaces With React DnD -

#### Medium, accessed on March 19, 2026,

#### https://medium.com/kustomerengineering/building-complex-nested-drag-and-drop-

#### user-interfaces-with-react-dnd-87ae5b72c

#### 21. Drag and drop using react-dnd or react-beautiful-dnd - Stack Overflow, accessed

#### on March 19, 2026,

#### https://stackoverflow.com/questions/76370051/drag-and-drop-using-react-dnd-or-r

#### eact-beautiful-dnd

#### 22. How do I animate a CSS sidebar opening and closing in CSS? - Stack Overflow,

#### accessed on March 19, 2026,


#### https://stackoverflow.com/questions/75883259/how-do-i-animate-a-css-sidebar-op

#### ening-and-closing-in-css

#### 23. Build an Animated Sidebar with React and Tailwind CSS - YouTube, accessed on

#### March 19, 2026, https://www.youtube.com/watch?v=Pe1Vo2N3Z2c

#### 24. 20 Best Dashboard UI/UX Design Principles You Need in 2025 - Medium,

#### accessed on March 19, 2026,

#### https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-yo

#### u-need-in-2025-30b661f2f795

#### 25. Effective Dashboard UX: Design Principles & Best Practices - Excited, accessed

#### on March 19, 2026, https://excited.agency/blog/dashboard-ux-design

#### 26. Filter Chips - shadcn.io, accessed on March 19, 2026,

#### https://www.shadcn.io/patterns/button-group-interactive-3

#### 27. How to Build (Good) Admin Dashboards || React & TailwindCSS - YouTube,

#### accessed on March 19, 2026, https://www.youtube.com/watch?v=vdxnBKRD7kU

#### 28. Multi-Select Component | shadcn/ui React TypeScript, accessed on March 19,

#### 2026, https://shadcn-multi-select-component.vercel.app/

#### 29. Shadcn Select - UI Components and Variants, accessed on March 19, 2026,

#### https://shadcnstudio.com/docs/components/select

#### 30. Why my React Query does not instant update UI after delete? USING

#### SUPABASE, accessed on March 19, 2026,

#### https://stackoverflow.com/questions/78452490/why-my-react-query-does-not-insta

#### nt-update-ui-after-delete-using-supabase

#### 31. linear-design-system | Skills Market... - LobeHub, accessed on March 19, 2026,

#### https://lobehub.com/es/skills/arvindrk-deep-research-agents-linear-design-system

#### 32. Design systems after Tailwind - Medium, accessed on March 19, 2026,

#### https://medium.com/@olexpono/design-systems-after-tailwind-2513daebcedc

#### 33. #23 Tailwind CSS Box Shadow | Add Depth and Style to Your Designs - YouTube,

#### accessed on March 19, 2026, https://www.youtube.com/watch?v=-0x_9jiZNo4

#### 34. Styling with utility classes - Core concepts - Tailwind CSS, accessed on March 19,

#### 2026, https://tailwindcss.com/docs/styling-with-utility-classes

#### 35. Sonner — The Toast Library That Made My UI Feel Alive | by Subash Natrayan R

#### M | Medium, accessed on March 19, 2026,

#### https://medium.com/@subashnatrayan28/%EF%B8%8F-sonner-the-toast-library-t

#### hat-made-my-ui-feel-alive-cf77452eb2c8

#### 36. Fetch, Create, Modify, Delete Data (React / Supabase CRUD Tutorial) - YouTube,

#### accessed on March 19, 2026, https://www.youtube.com/watch?v=4yVSwHO5QHU

#### 37. Optimistic Update Works in Replit but Not on Localhost with React Query #7811 -

#### GitHub, accessed on March 19, 2026,

#### https://github.com/TanStack/query/discussions/781 1

#### 38. (bug?) Deleting a record doesn't fail but also doesn't execute because of RLS :

#### r/Supabase, accessed on March 19, 2026,

#### https://www.reddit.com/r/Supabase/comments/1l095x6/bug_deleting_a_record_do

#### esnt_fail_but_also_doesnt/


