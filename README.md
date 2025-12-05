# DCS git tool

DCS shuffles the keys in the configs when saving, to be able to version control, we need to sort the keys of config objects.

## Getting started
Select the .miz you want to work on and use git to version control the mission!

## Alternatives to running it

- ```npx dcs-git-utils ./mission.miz```
- download the exe's from releases
- clone the repo

## Flow

- If .miz is selected, extracts content into ./out and sorts all configs.
- If ./out exists, creates a .miz

- (When saving in editor) After writing the .miz completes, it unpacks the archive and sorts the content, THEN re-archives into the .miz again to keep everything consistent for version control.
- When editing anything in ./out, archive (.miz) is created from ./out.

### Cmd args for debugging purposes

a single arg of a .miz filepath can be given to override file selection
