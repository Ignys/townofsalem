# Timer feature

Synchronized phase-timer state and presentation belong here. Clients will derive remaining time from a shared end timestamp.

Running timers persist one absolute `phaseEndsAt`. Paused timers remove that timestamp and persist `timerPaused` plus `timerRemainingMs`. Browsers render the countdown locally using Firebase's `.info/serverTimeOffset`; no per-second database writes or automatic phase transitions occur.

Host commands re-read the current game before applying a single atomic field update. Initial duration is entered by the host instead of assuming edition-specific phase durations.
