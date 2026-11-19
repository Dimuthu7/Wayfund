# Wayfund: Product Backlog

This backlog turns the [product scope](01-product-scope.md) into epics and user stories. Each story has acceptance criteria, a size in story points, a release and a planned sprint (see the [sprint plan](03-sprint-plan.md)).

**Conventions**

- **ID:** `E<epic>-<story>`. IDs never change once a story is created, even if it moves sprint.
- **Points:** Fibonacci (1, 2, 3, 5, 8, 13). Anything over 8 is split before it enters a sprint.
- **Priority:** MoSCoW. *Must* stories make up the release. *Should* stories go in if capacity allows. *Could* stories are nice to have.
- **Release:** MVP, P2 (Phase 2) or Later.
- Acceptance criteria use short Given / When / Then statements. "Member" means any member of the trip unless a role is named.

When work starts, each story becomes a GitHub issue labelled with its epic, release and sprint.

## Epic overview

| Epic | Name | Release | Points |
|---|---|---|---:|
| E0 | Foundation and delivery setup | MVP | 21 |
| E1 | Accounts and profile | MVP | 18 |
| E2 | Friends | MVP | 13 |
| E3 | Trips, membership and lifecycle | MVP | 39 |
| E4 | Budget planner | MVP | 26 |
| E5 | Expenses and split engine | MVP | 39 |
| E6 | Settlement and payments | MVP | 34 |
| E7 | Notifications | MVP | 21 |
| E8 | Dashboard, search and basic analytics | MVP | 19 |
| E9 | PWA and offline | MVP | 18 |
| E10 | Privacy and account management | MVP | 10 |
| E11 | Launch readiness | MVP | 15 |
| **MVP total** | | | **273** |
| E12 | Plans and Pro billing | P2 | 34 |
| E13 | Multi-currency | P2 | 16 |
| E14 | Google Drive and receipts | P2 | 34 |
| E15 | Feedback and ratings | P2 | 10 |
| E16 | Advanced analytics | P2 | 16 |
| E17 | Super admin console | P2 | 21 |
| **Phase 2 total** | | | **131** |
| E18 | Later ideas | Later | not sized |

---

## E0. Foundation and delivery setup (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E0-1 | As the developer, I want the project scaffolded so that I can build features from day one | 3 | Must | S0 |
| E0-2 | As the developer, I want a CI pipeline so that every pull request is checked automatically | 3 | Must | S0 |
| E0-3 | As the developer, I want preview and production environments so that I can test before releasing | 3 | Must | S0 |
| E0-4 | As the developer, I want the database schema and migrations set up so that data changes are versioned | 5 | Must | S0 |
| E0-5 | As a user, I want a consistent, attractive design system so that the app feels modern and easy | 5 | Must | S0 |
| E0-6 | As the developer, I want error tracking and product analytics so that I can see problems and usage | 2 | Must | S0 |

**Acceptance criteria**

- **E0-1:** Next.js (App Router, TypeScript strict), Tailwind CSS and shadcn/ui are set up. ESLint and Prettier run on commit. `pnpm dev` starts the app locally with a README on how.
- **E0-2:** GitHub Actions runs lint, type check, unit tests and build on every pull request. A failed check blocks merging.
- **E0-3:** Each pull request gets a preview deployment. Merging to `main` deploys to production. Secrets live in the hosting provider, never in the repository.
- **E0-4:** Postgres schema for the core tables from the [architecture note](04-architecture.md) is created through migrations. Row-level security is on for every trip table. A seed script creates demo data.
- **E0-5:** Colour palette, typography, spacing and light and dark themes are defined as tokens. Base components exist: button, input, amount input, avatar, card, bottom sheet, bottom navigation, toast and empty state. Layout is designed for 360 px first.
- **E0-6:** Errors in the browser and server are reported to an error tracker. Key product events (sign up, trip created, expense added, payment marked) are recorded.

## E1. Accounts and profile (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E1-1 | As a visitor, I want to sign in with Google so that I can start without a new password | 3 | Must | S1 |
| E1-2 | As a visitor, I want to sign in with Facebook so that I can use the account I already have | 3 | Must | S1 |
| E1-3 | As a visitor without Google or Facebook, I want to sign in with an email link so that I can still join | 2 | Must | S1 |
| E1-4 | As a new user, I want a short onboarding so that my profile and default currency are set up | 3 | Must | S1 |
| E1-5 | As a user, I want to edit my profile so that friends recognise me | 2 | Must | S1 |
| E1-6 | As a user, I want to link more sign-in methods to my account so that I never end up with two accounts | 3 | Should | S1 |
| E1-7 | As a user, I want to save my vehicles so that fuel costs are quick to estimate | 2 | Should | S3 |

**Acceptance criteria**

- **E1-1, E1-2:** Given I tap "Continue with Google" (or Facebook), when I approve, then I am signed in and land on onboarding (first time) or my dashboard (returning). My name and photo come from the provider. If I cancel, I return to the sign-in screen with no error.
- **E1-3:** Given I enter my email, when I open the link within 15 minutes on any device, then I am signed in. An expired link shows a clear message and a button to send a new one.
- **E1-4:** Onboarding asks for display name, username (unique, checked live), country and default currency (LKR selected when the country is Sri Lanka). It can be completed in under 30 seconds.
- **E1-5:** I can change name, username, photo, country and default currency. Changes show up in all my trips.
- **E1-6:** Given I'm signed in, when I link another provider with a different email, then both methods sign me into the same account. Signing in with an unlinked provider whose email matches an existing account asks me to confirm before linking.
- **E1-7:** I can save a vehicle with a name, fuel type (petrol, diesel, electric) and efficiency (km per litre or km per kWh). Saved vehicles appear in the budget fuel calculator.

## E2. Friends (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E2-1 | As a user, I want to send a friend request by username or email so that I can connect with people I travel with | 3 | Must | S1 |
| E2-2 | As a user, I want to accept or decline friend requests so that I control who my friends are | 2 | Must | S1 |
| E2-3 | As a user, I want to share my personal invite link so that friends can add me in one tap | 3 | Must | S1 |
| E2-4 | As a user, I want to view and search my friends list so that I can find people quickly | 2 | Must | S1 |
| E2-5 | As a user, I want to remove a friend so that my list stays relevant | 1 | Must | S1 |
| E2-6 | As a user, I want suggestions of people I've travelled with so that I can add them as friends | 2 | Could | S8 |

**Acceptance criteria**

- **E2-1:** Searching by exact username or email finds the person. Searching never reveals emails of people who are not my friends. Sending a request notifies the other person. I can't send a duplicate request.
- **E2-2:** Pending requests show in a "Requests" tab with Accept and Decline. Accepting adds us to each other's lists. Declining is silent to the sender.
- **E2-3:** My invite link opens a page with my name and photo and an "Add friend" button. If the visitor isn't signed in, they sign in first and then the request is sent automatically.
- **E2-4:** The list is sorted by name and can be searched by name or username. Each row shows photo, name and number of shared trips.
- **E2-5:** Removing asks for confirmation. Shared trips, expenses and balances are not affected.
- **E2-6:** Members of my past trips who aren't my friends appear as suggestions, with one-tap "Add".

## E3. Trips, membership and lifecycle (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E3-1 | As an organiser, I want to create a trip with destinations and dates so that the group has a home for the trip | 5 | Must | S2 |
| E3-2 | As an organiser, I want to add friends to the trip so that they can see and add expenses | 3 | Must | S2 |
| E3-3 | As an organiser, I want to share a trip invite link and QR code so that anyone can join quickly | 5 | Must | S2 |
| E3-4 | As an organiser, I want to add guests by name so that friends without the app are included in splits | 3 | Must | S2 |
| E3-5 | As a guest, I want to claim my place in a trip so that my history and balance carry over to my account | 5 | Must | S7 |
| E3-6 | As an owner, I want to remove members, and as a member, to leave a trip, with balances protected | 3 | Must | S2 |
| E3-7 | As an owner, I want to assign co-admins so that someone else can help manage the trip | 2 | Must | S2 |
| E3-8 | As a member, I want the trip to move through Planning, Active, Settling and Closed so that it's clear what to do next | 5 | Must | S5 |
| E3-9 | As a user, I want to see my Upcoming, Active and Past trips so that I can return to any trip | 3 | Must | S2 |
| E3-10 | As an owner, I want to edit, cancel, delete or transfer a trip so that I stay in control | 3 | Should | S6 |
| E3-11 | As a member, I want the trip permissions enforced so that only the right people can change things | 2 | Must | S2 |

**Acceptance criteria**

- **E3-1:** Required: name and at least one destination. Optional: dates (or number of days), cover image, description. Base currency defaults to my default currency (LKR). The creator becomes Owner. A new trip starts in Planning.
- **E3-2:** I can pick one or more friends. Each gets a notification and the trip appears in their list immediately.
- **E3-3:** The link and QR code open a trip preview (name, dates, owner, member count). Signing in joins the trip as Member. The owner or a co-admin can turn the link off or make a new one, after which the old link shows "This invite is no longer active". Links use long random tokens.
- **E3-4:** A guest needs only a name. Guests show a "Guest" badge and can be chosen as payer or included in splits like anyone else.
- **E3-5:** Given an invite link that includes a guest claim, when the guest signs in and picks "I'm <name>", then the owner is asked to approve (or it's approved automatically if the owner turned that on). After approval every expense, share and payment of the guest belongs to the new account. A guest can't be claimed twice.
- **E3-6:** A member with a balance of zero can be removed or can leave, and the trip is hidden from them. If the balance isn't zero, the action is blocked with a message showing the balance and a link to settle up. Owners can't leave until they transfer ownership.
- **E3-7:** The owner can promote a member to co-admin and demote them. Co-admins get the permissions listed in the scope's roles table.
- **E3-8:** A trip moves to Active on its start date and to Settling the day after its end date (Asia/Colombo by default, or the trip's time zone). Owner and co-admins can move it forward manually. Closing is allowed when all balances are zero, or when the owner confirms closing with open balances. Closed trips are read only and can be reopened by the owner. Every stage change notifies members.
- **E3-9:** Trips are grouped as Upcoming (Planning), Active, and Past (Settling, Closed, Cancelled). Each card shows cover, name, dates, members and my balance.
- **E3-10:** The owner can edit details, cancel (read only, balances still visible), transfer ownership to another member, or delete a trip that has no expenses.
- **E3-11:** Every permission in the roles table is enforced on the server (database policies and API checks), not just hidden in the UI. Automated tests cover each role.

## E4. Budget planner (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E4-1 | As an organiser, I want to estimate fuel cost from distance, fuel price and efficiency so that transport is budgeted correctly | 3 | Must | S3 |
| E4-2 | As an organiser, I want to add rental vehicle or public transport costs so that every transport type is covered | 3 | Must | S3 |
| E4-3 | As an organiser, I want to budget accommodation, food and beverages so that the main costs are planned | 3 | Must | S3 |
| E4-4 | As an organiser, I want custom budget items so that I can plan any other cost | 2 | Must | S3 |
| E4-5 | As a member, I want to see the total and per-person estimate so that I know what to bring | 2 | Must | S3 |
| E4-6 | As a user, I want my fuel prices saved with sensible country defaults so that I don't re-type them | 2 | Must | S3 |
| E4-7 | As a member, I want to download and share the budget as a PDF so that everyone can see the plan | 5 | Must | S3 |
| E4-8 | As a member, I want to see budget vs actual by category so that we know if we're overspending | 5 | Must | S5 |
| E4-9 | As an organiser, I want an electric vehicle option so that EV trips are costed too | 1 | Should | S3 |

**Acceptance criteria**

- **E4-1:** Inputs: distance (km), price per litre, km per litre, or a saved vehicle. Result = `distance ÷ km_per_litre × price_per_litre`, shown live as I type and rounded to the currency's minor unit. A round-trip toggle doubles the distance.
- **E4-2:** Rental: daily rate × days (defaults to trip days) plus optional driver and fuel amounts, or a fixed amount. Public transport: fare × people × number of trips, or a fixed amount.
- **E4-3:** Accommodation: price per night × nights × rooms, or fixed. Food: per person per day × people × days, or fixed. People and days default from the trip and can be overridden.
- **E4-4:** I can add, rename, reorder and delete custom items with a name and amount.
- **E4-5:** The summary shows the total, the total per category and the per-person figure. It updates when members join or leave (with a note when the people count is overridden).
- **E4-6:** For Sri Lanka the defaults are LKR per litre for petrol and diesel, set in an admin config file. My last-used price overrides the default. I can change it at any time.
- **E4-7:** The PDF has trip name, dates, destinations, members, a table by category with the inputs behind each line, the total and the per-person figure, and a Wayfund footer. It's generated on the server in under 5 seconds. I can download it or share it through the phone's share sheet or a link.
- **E4-8:** The trip home shows planned vs actual per category with progress bars. Over 80% shows amber and over 100% shows red. Owner and co-admins get a notification the first time a category crosses each threshold.
- **E4-9:** Inputs: distance, km per kWh, price per kWh. Same behaviour as E4-1.

## E5. Expenses and split engine (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E5-1 | As a developer, I want a tested split engine so that every split is exact and consistent | 8 | Must | S3 |
| E5-2 | As a member, I want to add an expense in a few taps with an equal split by default so that recording is quick | 5 | Must | S4 |
| E5-3 | As a member, I want to choose who paid and who shares the cost so that the split reflects reality | 3 | Must | S4 |
| E5-4 | As a member, I want to split by percentage, exact amount or shares so that uneven splits are easy | 5 | Must | S4 |
| E5-5 | As a member, I want to edit or delete an expense I'm allowed to change so that mistakes can be fixed | 3 | Must | S4 |
| E5-6 | As a member, I want to see the edit history of an expense so that changes are transparent | 3 | Must | S4 |
| E5-7 | As a member, I want to add custom expense categories during the trip so that any cost fits | 2 | Must | S4 |
| E5-8 | As a member, I want an expense list with filters so that I can find and review spending | 3 | Must | S4 |
| E5-9 | As a member, I want to see each member's running balance so that I know where everyone stands | 3 | Must | S4 |
| E5-10 | As an owner, I want to restore a deleted expense so that accidental deletes can be undone | 2 | Should | S6 |
| E5-11 | As a member, I want to record expenses in the Planning stage so that deposits and advance bookings count | 2 | Must | S4 |

**Acceptance criteria**

- **E5-1:** A pure TypeScript module that, given a total in minor units, a mode (equal, percentage, exact, shares) and inputs, returns each member's share. Rules: shares always add up exactly to the total. Leftover cents go to the largest fractional remainders, with ties broken by member order. Percentages must add up to 100 and exact amounts to the total, otherwise a validation error is returned. Weights must be greater than zero. Tests include the 40/40/20 drinks example and property-based tests over random inputs.
- **E5-2:** From the trip, one "+" button opens the add-expense sheet with the amount field focused. Defaults: payer = me, split = equal among all members, date = now, category = last used. Amount, description and Save is enough. Saving shows the expense straight away (optimistic) and confirms when it has synced.
- **E5-3:** I can pick any member or guest as payer. I can tick and untick members to include. At least one member must be included.
- **E5-4:** Switching mode keeps my selection of members. Percentage and exact modes show a live "remaining" counter and disable Save until it's zero. Shares mode shows the resulting amount next to each weight. The 40/40/20 drinks example can be entered in any of the three modes.
- **E5-5:** Members can edit or delete expenses they created or paid. Owner and co-admins can edit or delete any expense. Others don't see the actions. Deletes are soft and ask for confirmation. Expenses in Closed trips can't be changed.
- **E5-6:** Each expense shows who created it and every later change (who, when, which fields, old and new values).
- **E5-7:** New categories get a name and an icon or emoji, are shared within the trip, and appear in budget vs actual under "Other".
- **E5-8:** List grouped by day, newest first, with filters for category, payer and "involves me". Each row shows description, amount, payer and my share.
- **E5-9:** A balances view shows, for each member, total paid, total share and net balance, using the rule in the scope (section 3.5). Balances always add up to zero (covered by tests).
- **E5-10:** Deleted expenses appear in a "Deleted" filter for the owner with a Restore action, and restoring is recorded in history.
- **E5-11:** Expenses can be added while the trip is in Planning and are included in balances and in actual spending.

## E6. Settlement and payments (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E6-1 | As a developer, I want a settlement engine that produces the fewest practical payments so that settling up is simple | 5 | Must | S5 |
| E6-2 | As a member, I want to see the group settlement plan so that everyone knows who pays whom | 3 | Must | S5 |
| E6-3 | As a member, I want "My settlement" on my dashboard so that I see what I owe and am owed | 3 | Must | S5 |
| E6-4 | As a payer, I want to mark a payment as paid with date, time and method so that the other person knows | 3 | Must | S5 |
| E6-5 | As a receiver, I want to confirm or dispute a payment so that records stay accurate | 3 | Must | S5 |
| E6-6 | As a member owed money, I want to send a reminder so that I get paid without awkward messages | 2 | Must | S5 |
| E6-7 | As a member, I want the full trip settlement report as a PDF so that we have a record of everything | 5 | Must | S7 |
| E6-8 | As a member, I want a personal statement PDF for any member so that each person gets their own summary | 3 | Must | S7 |
| E6-9 | As a guest, I want to open my statement by link without an account so that I know what to pay | 3 | Should | S6 |
| E6-10 | As a group, we want a "settle per expense" option so that we can see who owes whom without netting | 3 | Could | S8 |
| E6-11 | As a payer, I want to record a partial payment so that paying in instalments is tracked | 1 | Should | S5 |

**Acceptance criteria**

- **E6-1:** Given net balances that add up to zero, the engine returns payments (from, to, amount) that bring every balance to zero, using at most *n − 1* payments for *n* members with non-zero balances. Results are the same every time for the same input. Unit tests cover edge cases: everyone even, one person paid for all, and rounding by a few cents.
- **E6-2:** The plan lists each payment with avatars, names and amount, and its status (Pending, Marked paid, Confirmed, Disputed). It recalculates when expenses change, and already confirmed payments are kept.
- **E6-3:** The dashboard shows totals "You owe" and "You are owed" across trips, with a per-trip breakdown and one-tap actions to mark paid or send a reminder.
- **E6-4:** Marking paid records amount (defaults to the full amount), date and time (defaults to now, in my time zone), method (cash, bank transfer, other) and an optional note. The receiver is notified. The payment shows as "Marked paid on <date, time>".
- **E6-5:** The receiver can Confirm (status Confirmed, payer notified) or Dispute with a reason (status Disputed, payer notified, balance unchanged until resolved). A receiver can also record a payment received directly.
- **E6-6:** A "Remind" button on each pending payment owed to me sends an in-app and push notification with the amount and trip. It's limited to one reminder per pair per 24 hours, and the button shows when the next reminder is possible.
- **E6-7:** The PDF includes trip details, all expenses with payer and split per member, totals by category and by member, balances, the settlement plan and payment statuses with dates. It's generated on the server and can be downloaded or shared.
- **E6-8:** A one-page statement for a chosen member: expenses they paid, their share of each expense, net balance, and the payments they make or receive.
- **E6-9:** The owner can share a guest's statement link. It's read only, uses a revocable random token, and shows no other members' personal data beyond names.
- **E6-10:** A trip setting switches the plan to per-expense debts (each liable member owes the payer). The default is minimal transfers.
- **E6-11:** A payment smaller than the proposed amount is recorded, and the remaining amount stays pending.

## E7. Notifications (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E7-1 | As a user, I want an in-app notification centre so that I can catch up on trip activity | 5 | Must | S6 |
| E7-2 | As a user, I want push notifications on my phone so that I hear about important events right away | 5 | Must | S6 |
| E7-3 | As a user, I want email notifications as a fallback so that I don't miss anything without push | 3 | Must | S6 |
| E7-4 | As a user, I want to choose Instant, Daily digest or Off per trip so that notifications aren't noisy | 5 | Must | S6 |
| E7-5 | As an iPhone user, I want to be guided to add the app to my home screen so that push works on iOS | 3 | Should | S6 |

**Acceptance criteria**

- **E7-1:** A bell icon shows the unread count. The list shows each notification with trip, actor, text and time, and tapping opens the related screen. "Mark all read" is available. Events are those in the scope's notifications table.
- **E7-2:** After a clear in-app prompt (not on first load), I can allow push. Notifications arrive within a minute of the event and open the right screen. I can turn push off in settings.
- **E7-3:** Email is sent when push isn't enabled for an Instant event, and for digests. Every email has an unsubscribe link that changes my preference.
- **E7-4:** Per trip I can choose Instant, Daily digest (sent at 8 PM in my time zone) or Off. Payments to me and reminders to me can't be turned fully off and go to the digest at least. Defaults follow the scope's table.
- **E7-5:** On iOS Safari, when the user first does something that benefits from push, a short guide shows how to add Wayfund to the home screen. It isn't shown again after being dismissed twice.

## E8. Dashboard, search and basic analytics (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E8-1 | As a user, I want a home dashboard so that I see my active trip, balances and recent activity at a glance | 5 | Must | S6 |
| E8-2 | As a user, I want to search trips by name, destination and dates so that I can find any trip | 3 | Must | S8 |
| E8-3 | As a member, I want a trip's spending by category and by member so that I understand where the money went | 5 | Must | S7 |
| E8-4 | As a user, I want my trip spending by month and year so that I see how much I spend on travel | 5 | Must | S8 |
| E8-5 | As a member, I want a trip summary card when a trip ends so that the group can see the result | 1 | Could | S8 |

**Acceptance criteria**

- **E8-1:** Shows the active trip (budget vs actual and a quick-add button), totals I owe and am owed, upcoming trips and the 10 latest activity items. Empty states guide a new user to create or join a trip.
- **E8-2:** One search box matches trip name and destination names (partial, case-insensitive). A date range filter matches trips overlapping the range. Results show only trips I belong to.
- **E8-3:** A donut or bar chart by category and a bar chart by member (paid vs share), with the numbers listed under the charts for accessibility.
- **E8-4:** A bar chart of my share of trip spending per month for a chosen year, plus a yearly total. Tapping a bar lists the trips in that month.
- **E8-5:** When a trip moves to Settling, members see a summary: total spent, cost per person per day, biggest category, and budget accuracy.

## E9. PWA and offline (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E9-1 | As a user, I want to install Wayfund on my home screen so that it feels like a native app | 3 | Must | S2 |
| E9-2 | As a member, I want my trips available offline so that I can check details without signal | 5 | Must | S7 |
| E9-3 | As a member, I want to add expenses offline and have them sync later so that nothing is lost | 8 | Must | S7 |
| E9-4 | As a member, I want to see what's waiting to sync so that I trust the data | 2 | Must | S7 |

**Acceptance criteria**

- **E9-1:** A web app manifest, icons, splash screen and service worker are in place. Lighthouse PWA checks pass. The app opens without browser chrome when installed.
- **E9-2:** Trips I belong to, with their expenses and balances, are cached on the device and readable offline, with an "Offline, last updated <time>" banner.
- **E9-3:** Expenses created offline are saved to the device and synced in order when online. Each has a device-made UUID, so a retry never creates duplicates. If someone else edited the same expense while I was offline, the newer edit wins and the history shows both.
- **E9-4:** Unsynced expenses show a "Waiting to sync" badge, and a counter shows the number waiting. Failed syncs show a retry option with the reason.

## E10. Privacy and account management (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E10-1 | As a user, I want to export all my data so that I own my information | 3 | Must | S8 |
| E10-2 | As a user, I want to delete my account so that my personal data is removed | 5 | Must | S8 |
| E10-3 | As a visitor, I want a clear privacy policy and terms so that I know how my data is used | 2 | Must | S8 |

**Acceptance criteria**

- **E10-1:** One button produces a ZIP with JSON and CSV files of my profile, trips, expenses, shares and payments. A link is emailed when it's ready, and it expires after 7 days.
- **E10-2:** Deleting asks me to confirm by typing DELETE, and warns about open balances. My profile, sign-in links, friends and notifications are removed. My expenses in shared trips stay under the name "Former member", so other members' balances stay correct. Trips I own pass to a co-admin, or to the longest-standing member.
- **E10-3:** Privacy policy and terms pages are linked from sign-in and settings. They cover Sri Lanka's Personal Data Protection Act No. 9 of 2022 and Google's OAuth requirements.

## E11. Launch readiness (MVP)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E11-1 | As the product owner, I want a closed beta with real trips so that we find problems before launch | 3 | Must | S8 |
| E11-2 | As a user, I want the app to be fast and accessible so that it works well on any phone | 5 | Must | S8 |
| E11-3 | As the product owner, I want a simple landing page so that people understand Wayfund and sign up | 3 | Must | S8 |
| E11-4 | As the developer, I want Google and Facebook app verification done so that sign-in works for everyone | 2 | Must | S8 |
| E11-5 | As a user, I want to send feedback or report a bug from the app so that problems reach the team | 2 | Should | S8 |

**Acceptance criteria**

- **E11-1:** At least 5 groups use Wayfund on a real trip. Feedback is collected in GitHub issues and the top problems are fixed before public launch.
- **E11-2:** Lighthouse mobile scores of at least 90 for performance and accessibility on the main screens. First load under 3 s on a mid-range Android phone over 4G. Manual screen reader check of the add-expense and settlement flows.
- **E11-3:** A landing page with the value proposition, three feature highlights, screenshots and sign-in buttons. It meets basic SEO needs (title, description, Open Graph image).
- **E11-4:** The Google OAuth consent screen is verified and the Facebook app is live, with privacy policy and data deletion URLs set.
- **E11-5:** A "Send feedback" item in settings sends text and an optional screenshot, along with app version and device details.

---

## E12. Plans and Pro billing (Phase 2)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E12-1 | As the product owner, I want plan limits enforced so that Free and Pro work as defined | 5 | Must | S9 |
| E12-2 | As a Sri Lankan user, I want to subscribe to Pro with PayHere in LKR so that I can pay locally | 8 | Must | S9 |
| E12-3 | As an international user, I want to subscribe to Pro with Paddle so that I can pay by card in my currency | 8 | Must | S10 |
| E12-4 | As a Pro user, I want to manage, cancel or renew my subscription so that I stay in control | 5 | Must | S10 |
| E12-5 | As a user, I want a clear pricing page and upgrade prompts so that I know what Pro adds | 3 | Must | S9 |
| E12-6 | As a user, I want to buy a single Trip Pass so that I can get Pro for one trip only | 5 | Could | S12 |

**Acceptance criteria**

- **E12-1:** Limits from the scope's plans table are checked on the server when creating trips, adding members and using Pro features. Hitting a limit shows an upgrade prompt, not an error. Downgrading never deletes data, and extra trips become read only. Limits are read from the plan settings that super admins manage (E17-2), not hard-coded.
- **E12-2:** Checkout through PayHere's recurring payments in LKR. The payment notification is verified with the merchant secret before Pro is turned on. Renewals and failures update the subscription. Failed payments give a 7-day grace period with reminders.
- **E12-3:** Checkout through Paddle in USD (with local pricing where Paddle offers it). Webhooks are verified and processed idempotently. Paddle handles invoices and tax.
- **E12-4:** The billing page shows plan, provider, next renewal date and invoices or receipts. Cancelling keeps Pro until the end of the paid period.
- **E12-5:** The pricing page compares Free and Pro, shows LKR prices to Sri Lankan users and USD prices to others, and is reachable from settings and every upgrade prompt.
- **E12-6:** A Trip Pass turns on Pro features for one trip until it is closed, and is paid once through the user's provider.

## E13. Multi-currency (Phase 2)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E13-1 | As a Pro trip member, I want to enter an expense in another currency so that foreign spending is recorded as paid | 5 | Must | S10 |
| E13-2 | As a member, I want exchange rates suggested and editable so that conversions match what we actually paid | 5 | Must | S10 |
| E13-3 | As a member, I want balances in the base currency with original amounts visible so that settlement stays simple | 3 | Must | S10 |
| E13-4 | As a member, I want PDFs and analytics to show both currencies so that reports are complete | 3 | Should | S12 |

**Acceptance criteria**

- **E13-1:** The amount field has a currency picker, defaulting to the trip's last-used currency. The expense stores amount, currency and rate.
- **E13-2:** The rate is fetched from an exchange rate service for the expense date and can be overridden per expense or as a trip-wide rate. The rate used is shown on the expense.
- **E13-3:** Split and settlement use the converted base amount. Expense rows show the original amount, for example "USD 40.00 (LKR 12,000.00)".
- **E13-4:** PDFs list original and base amounts. Analytics use the base currency.

## E14. Google Drive and receipts (Phase 2)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E14-1 | As a Pro owner, I want to connect Google Drive so that the trip can use my Drive for photos | 5 | Must | S11 |
| E14-2 | As a Pro owner, I want Wayfund to create a trip folder, or let me pick an existing one, so that photos are organised | 5 | Must | S11 |
| E14-3 | As a member, I want to open the trip's Drive folder in one tap so that I can reach our photos | 1 | Must | S11 |
| E14-4 | As a member, I want to upload photos to the trip folder from the app so that sharing photos is easy | 5 | Must | S11 |
| E14-5 | As a member, I want a gallery of the trip folder's images so that we can relive the trip in the app | 5 | Must | S11 |
| E14-6 | As a member, I want to create sub-folders from the app so that photos stay organised by day or place | 3 | Should | S12 |
| E14-7 | As a Pro member, I want to attach a receipt photo to an expense so that we have proof of spending | 5 | Must | S11 |
| E14-8 | As the developer, I want Google's OAuth verification for the Drive scope completed so that all users can connect | 5 | Must | S9 |

**Acceptance criteria**

- **E14-1:** Connecting uses Google OAuth with the `drive.file` scope only. The refresh token is stored encrypted. The owner can disconnect at any time.
- **E14-2:** "Create folder" makes `Wayfund/<trip name>` in the owner's Drive. "Pick folder" opens the Google Picker. The folder is shared with members' Google emails as viewers or editors, as the owner chooses. Only the folder ID is stored.
- **E14-3:** A Drive button on the trip opens the folder in the Drive app or browser.
- **E14-4:** Members can pick one or more photos. Uploads go to the trip folder through the owner's connection. Progress is shown and failures can be retried. Wayfund stores only file IDs.
- **E14-5:** A grid of thumbnails from the folder that opens full screen with swipe. Loading is paged.
- **E14-6:** Sub-folders can be created and browsed, and uploads can target a sub-folder.
- **E14-7:** On an expense, "Add receipt" takes or picks a photo and uploads it to `<trip folder>/Receipts`. The expense shows a thumbnail. Receipts are linked in the trip PDF.
- **E14-8:** The OAuth consent screen lists the `drive.file` scope with a demo video and justification, and verification is approved before Phase 2 launch.

## E15. Feedback and ratings (Phase 2)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E15-1 | As a member, I want to rate the trip overall so that the group can remember how it went | 2 | Must | S12 |
| E15-2 | As a member, I want to rate and review places such as hotels and restaurants so that we remember good and bad spots | 5 | Must | S12 |
| E15-3 | As a member, I want to see the group's ratings together so that we can compare opinions | 3 | Should | S12 |

**Acceptance criteria**

- **E15-1:** 1 to 5 stars and an optional note, available from Active onwards. Optional, and never blocks closing a trip.
- **E15-2:** A place has a name, type (hotel, restaurant, activity, other), and optionally a link to related expenses. Rating and note per member.
- **E15-3:** A feedback tab shows average ratings and all notes, visible only to trip members.

## E16. Advanced analytics (Phase 2)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E16-1 | As a Pro user, I want trends across trips so that I see how my travel costs change | 5 | Must | S12 |
| E16-2 | As a Pro user, I want filters by month, year, destination and companions so that I can explore my spending | 5 | Must | S12 |
| E16-3 | As a Pro user, I want to see budget accuracy per trip so that I plan better next time | 3 | Should | S12 |
| E16-4 | As a Pro user, I want to export my analytics as CSV so that I can analyse them myself | 3 | Could | S12 |

**Acceptance criteria**

- **E16-1:** Charts of cost per trip, cost per day, cost per person and category mix over time.
- **E16-2:** Filters combine, and the URL keeps the filter state so a view can be bookmarked.
- **E16-3:** For each trip, planned vs actual per category with the percentage difference.
- **E16-4:** CSV of trips, categories and my share, using the current filters.

## E17. Super admin console (Phase 2)

| ID | Story | Pts | Priority | Sprint |
|---|---|---:|---|---|
| E17-1 | As the Wayfund team, I want a protected super admin area so that only we can change platform settings | 3 | Must | S9 |
| E17-2 | As a super admin, I want to change plan limits (trips, members, history) so that I can tune Free and Pro without a release | 5 | Must | S9 |
| E17-3 | As a super admin, I want to change Pro prices and which features are Pro so that I can adjust the offer | 5 | Must | S10 |
| E17-4 | As a super admin, I want every admin change logged so that changes are traceable | 2 | Must | S9 |
| E17-5 | As a super admin, I want to grant, extend or reset a user's plan so that I can support beta testers and customers | 3 | Should | S11 |
| E17-6 | As a super admin, I want basic platform numbers so that I can see how Wayfund is growing | 3 | Could | S12 |

**Acceptance criteria**

- **E17-1:** Only accounts flagged as super admin (set in the database by the team) can open `/admin`. Others get a 404. Admin pages ask for a fresh sign-in if the last one was over 12 hours ago. Every admin action is checked on the server.
- **E17-2:** A settings form shows, for Free and Pro: active trips, members per trip and visible past trips (a blank value means unlimited), plus a switch to turn limits on or off for everyone. Values are validated (whole numbers, at least 1). Saving takes effect within a minute without a redeploy. A confirmation shows how many users are over the new limit. Lowering a limit never deletes data.
- **E17-3:** A super admin can set the Pro monthly, yearly and Trip Pass prices for LKR and USD, and tick which features are Free or Pro. Price changes apply to new checkouts and are synced to PayHere and Paddle where their APIs allow (otherwise the form shows the manual step). Existing subscribers keep their price until renewal.
- **E17-4:** Each change records admin, setting, old value, new value and time. The log can be viewed and filtered in the console and can't be edited.
- **E17-5:** Search users by email or username, see their plan and subscription status, grant complimentary Pro with an end date, extend, or reset to Free, with a required reason. The user gets a notification.
- **E17-6:** A dashboard shows total users, new users this week, trips created, active Pro subscriptions by provider. It shows counts only, never trip contents.

## E18. Later ideas (not sized)

- Native Android and iOS wrappers (Capacitor or a similar tool), including Sign in with Apple.
- Sinhala and Tamil user interface.
- Expenses with more than one payer.
- Receipt OCR to fill in amount and description automatically.
- Public reviews with moderation.
- Trip templates and recurring trips (for example an annual office trip).
- Full Drive file management (rename, move, delete).
- Bank or payment app deep links for settling up (for example LankaPay QR).
- Itinerary planning per day.
