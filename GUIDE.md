## Guide for Requirements

To launch the requirements checker, click the "Requirements" button on the bottom right corner.

Click the big plus button ➕ to add a set of requirements. It usually represents a major or a minor you plan to declare.

You will then see four buttons below the title of the set:

1. **Add course**

    Adds a required course. Note that the checker supports regex queries. If you don't know what regex is, <s>you should learn it</s> here are some useful examples:

    - COMP1021: This matches the course COMP1021.
    - [A-Z]{4}1021: This matches courses of any subject with the number "1021".
    - COMP[2-7][0-9]{3}[A-Z]?: This matches all 2000-level or higher COMP courses.

2. **Add AND group**

    Adds a group of requirements that is fulfilled if all of its members are fulfilled.

3. **Add OR group**

    Adds a group of requirements that is fulfilled if at least one of its member is fulfilled.

4. **Add XOR group**

    Adds a group of requirements that is fulfilled if only one of its members is fulfilled.

(Note: An empty group is always fulfilled.)