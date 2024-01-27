# HKUST Credit Planner 📝

A simple static web app to help HKUST students draft a credit plan.

## Features

1. A course planner organised by semester.
1. Requisites and exclusions auto-checking.
1. A major requirements checker
1. Ability to save multiple plans locally
1. Export the plan to an Excel file (Coming soon)

## FAQs

**Q**: How to change the starting semester/ total number of semesters?

A: In the course planner, click the cog button ⚙️ on the block for the first semester.

**Q:** Why is the course planner warning me when my plan is valid?

A: The course database is fetched from [HKUST Class Schedule and Quota](https://w5.ab.ust.hk/wcq/cgi-bin/) using the script in `data/courses.js`. It is far from perfect, so do expect inaccuries. If you encounter them, please report them to me.

**Q:** Why does the app tell me to manually re-check my plan when the database is updated. Isn't this done automatically by the app?

A: To improve speed, the planner uses lazy checking, i.e. it only checks the courses affected by your edits to the plan every time you modify it. If you want to manually re-check a specific course, you can click on the input box for its code and click away. When there is a big update to the database, it is recommended you do a manual re-checking of the entire plan by opening the hamburger menu at the top left corner of the app and clicking "Recheck plan".

**Q**: How does the requirements checker work? Can I match multiple courses with one course code? Can I add more complicated logic into my requirements?

A: Check out [this page](/GUIDE.md).

## Bug reports

To report a bug/ suggest a feature, you may submit an issue in this github project, or you may use this form.

## License

MIT License. In short, you may reuse the source code however you want, you just have to include the license in your copy. Attribution would be greatly appreciated though 🥰.