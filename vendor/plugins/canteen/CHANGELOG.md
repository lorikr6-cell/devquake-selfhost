# Changelog — Social canteen

## 0.22.0

- Driver areas (Routes → Driver areas): propose from the addresses which driver delivers to whom, so drivers do not cross each other's streets, sized to how much each one works. Look at the proposal, move people to another driver, then save.
- Build the routes of a day, a week or a month from the areas in one step: each working driver gets the people of their area, nearest first from the kitchen. Ticks already given stay.
- Print the route sheets of a day, a week or a month, for one driver or all of them, with every stop's details.
- The map service moved to its new address (api.heigit.org); the key stays the same.

## 0.21.0

- Every printout starts with the organisation's logo, name, description and contact email, and says who printed it and when. Each driver's route sheet carries it too.
- Staff are grouped by role (organisers, coordinators, medical staff, kitchen, drivers), with how many each has, so a missing role shows at once.
- "Invitations sent" lists every invitation of the last six months with its status: open until, accepted by whom and when, expired or revoked, and the address it was emailed to (hidden in part).

## 0.20.0

- Organisers can set the organisation's own contact email under Organisation. It is checked before saving, shown on the organisation's page and in its invitations, and replies to invitations go to it. Without one, DevQuake's contact@devquake.com is used.

## 0.19.0

- Every open staff invitation shows its QR code with the role under it: scan it to join, or download it as a picture.
- Send an invitation by email, in the language you choose: the email has the link and the QR code, and for drivers the download of the drivers' app. Only a hidden form of the address is kept (for example a***@gmail.com).

## 0.18.0

- Works with Cookbook: pick the menus' dishes from your recipes. The organisation keeps a copy, and the kitchen sheet shows each dish's ingredients for the day's portions and diets.
- Works with Shopping: send everything the week's dishes need, for every portion, to the organisation's purchasing list in one step. Sending the same week twice asks first.

## 0.17.0

- Try the app with demo data: "Try it with demo data" fills an organisation of your own with invented people, personal numbers, five weeks of menus, drivers with licences, this week's routes and medical files, and a "View as" switch shows it as each role sees it.

## 0.16.1

- Routes: the Save button next to the kitchen address now sits level with the input fields.

## 0.16.0

- Drivers upload their driving licence (a photo, read on the device): the app checks that the driver's name is on it, reads its expiry date and number, and refuses an expired licence.
- Next to each driver, planners see the licence's state: valid until, expires in N days (from three months before), expired, or missing. Drivers see a notice on their route every time they open it while their licence is missing, expired or expires within three months.
- People's personal numbers now include the ID card's expiry date; reading the ID card fills it in.
- The Excel file now carries the personal numbers (CNP, ID card series, number and expiry) and the drivers' licence expiry and number, and they can be changed by uploading it again. Each export is recorded in the access log of the people in it: keep the file as safely as the ID cards themselves.

## 0.15.0

- Organisers can delete their organisation with everything in it, after typing its name to confirm. It cannot be undone: download it as Excel first if you need it.

## 0.14.1

- The row of tabs no longer shows a small scroll bar when all tabs fit; it scrolls sideways only when they do not.

## 0.14.0

- Print what you plan: the week's menus, one driver's route sheet (or all of them), the kitchen sheet and the calendar. Printouts leave out the app's toolbar and buttons.
- Below the month calendar, a day-by-day grid with everything assigned: birthdays, menus with their diet variants, each driver's route with the people in order (delivered ones ticked, with the driver's comments) and the portions per meal.

## 0.13.1

- "Open the organisation’s page" no longer shows “not found” while the page is private: your staff see a preview with a note, and visitors see it once you switch it on.

## 0.13.0

- Drivers can switch their route between the list and a map: every stop is a numbered pin in the order of the route, green once delivered, with the kitchen as a house. Tap a pin for the name, address and time.

## 0.12.0

- Drivers see what is in each package (the day's menu in that person's diet) and can leave a comment on every stop, for example "not home, left with the neighbour".
- The route planner shows each route's progress as it happens: how many packages are delivered, when each one was handed over and the driver's comment. Open pages update by themselves within seconds.

## 0.11.0

- Compute the order of a driver's stops from the map: enter your kitchen's address once, then one tap orders the route so everyone is reached within their window and the driver's shift. Whoever cannot fit is put last and you are told. Only addresses are sent to the map service (OpenRouteService), never names.

## 0.10.0

- Your organisation's own page: add a logo and a description, shown as a banner on your pages; switch the page on to let visitors see it (they see the banner only, never anything about the people you serve).
- Export the organisation to Excel: the organisation, people, meal times, menus, drivers, routes, staff and a year calendar with birthdays, each on its own sheet. The file name carries the date and time.
- Upload a changed file to apply it: renamed titles are fine, rows without an ID are added, nothing is deleted, and nothing changes at all if one row is wrong. The app warns first: the data is overwritten and there is no backup. Personal numbers, pictures and the medical file are never in the file.

## 0.9.0

- Medical papers in the medical file: discharge letters, results and prescriptions as a PDF (up to 5 MB) or a photo, stored encrypted, opened only by medical staff, and every opening recorded.

## 0.8.0

- Read the ID card: on a person's profile, organisers let the app read the ID card picture and fill in the name, date of birth, CNP, series and number and the address. The picture is read on your own device; you check and correct every field before saving. The newer electronic cards show no address.

## 0.7.0

- Drivers on their phone: link a driver to a staff member invited with the driver role, and they see their route of the day with addresses, a tap-to-call phone number, the note and the diet, and tick each meal as delivered.
- The route planner shows which stops are already delivered.

## 0.6.0

- A calendar for each month with a birthday badge on every person's day and the age they turn; tap a badge to open their profile.

## 0.5.0

- The medical file, for medical staff only: conditions, allergies, family doctor and blood type, medications with their times and course, medical notes, and hospital stays with the cause, the verdict and the recommendations for care from then on. Everything in it is stored encrypted, and organisers see who opened it.
- The daily medication round: every dose due, recorded as given, refused or missed, with who recorded it.
- While someone is in hospital they leave the kitchen sheet and the delivery routes by themselves; everyone else sees only an "In hospital" badge, never why.

## 0.4.0

- Delivery routes: add your drivers with their days and shift (they need no account), give each person living at home the time window they can receive their meal, and place everyone on a driver's route for each day.
- While planning, each driver's button turns green where the person still fits in time and stays grey where someone would be reached too late; every stop shows its estimated time, and late ones are marked in red.
- See the whole week at a glance, copy a day's routes from the week before, and print one route sheet per driver with the order, times, names, addresses, phones, the note for the driver and a box to tick.

## 0.3.0

- Plan the week's menus: the delivered meal of each day and, for your care home, every meal time with its strict window (for example breakfast 8:00–8:30). Write a variant for a diet when it gets something else, or copy last week's menus.
- Choose the days each person living at home gets a meal delivered.
- The kitchen sheet for each day: the menu, portions per diet, allergies in red and a label for every box, ready to print. Kitchen staff open it directly and see no addresses.

## 0.2.0

- Invite your staff: choose their role (organiser, coordinator, kitchen, driver or medical staff) and send them a link that works once, for 7 days.
- Organisers see everyone on the staff, change their roles and remove them; an organisation always keeps at least one organiser.

## 0.1.1

- Dates of birth before 2000 are accepted again (any day from 1900 until today); the date picker only offers those days.

## 0.1.0

- First version: create your organisation and keep a profile for each person you feed, living at home or in your care home, with their address, diet, allergies and a note for the driver.
- Add a profile photo and the ID card (both required), and up to two more papers such as the pension coupon. Pictures and personal numbers are stored encrypted, and you see who opened them and when.
- Write down incidents, and see the birthdays of the next seven days.
