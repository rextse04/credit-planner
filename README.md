# HKUST Credit Planner 📝

A [simple static web app](https://rextse04.github.io/credit-planner/) to help HKUST students draft a credit plan.

## Features

1. A course planner organised by semester.
1. Requisites and exclusions auto-checking.
1. A major requirements checker.
1. Ability to save multiple plans locally.
1. Data stays in your browser only, not shared with anyone.
1. Export the plan as an Excel file (coming soon).

## FAQs

**Q**: How to change the starting semester/ total number of semesters?

A: In the course planner, click on the cog button ⚙️ on the block for the first semester.

**Q:** Why is the course planner giving me a warning even though my plan is valid?

A: The course database is fetched from [HKUST Class Schedule and Quota](https://w5.ab.ust.hk/wcq/cgi-bin/) using the script in `data/courses.js`. It is far from perfect, so do expect inaccuries. If you encounter them, please notify me by [creating an issue](https://github.com/rextse04/credit-planner/issues).

**Q:** Why does the app tell me to manually re-check my plan when the database is updated? Isn't this done automatically by the app?

A: For performance reasons, this planner uses lazy checking, i.e. it only checks the courses affected by your edits to the plan every time you modify it. If you want to manually re-check a specific course, you can click on the input box for its code and click away. When there is a big update to the database, it is recommended you do a manual re-checking of the entire plan by opening the hamburger menu at the top left corner of the app and clicking "Recheck plan".

**Q**: How does the requirements checker work? Can I match multiple courses with one course code? Can I add more complicated logic into my requirements?

A: See [this page](/GUIDE.md).

## Bug reports

To report a bug / suggest a feature, you may [create an issue](https://github.com/rextse04/credit-planner/issues) in this github project, or you may use [this form](https://www.youtube.com/watch?v=dQw4w9WgXcQ).

## License

[MIT License](/LICENSE). In short, you may reuse the source code however you want; you just have to include the license in your copy. Attribution would be greatly appreciated though 🥰.
